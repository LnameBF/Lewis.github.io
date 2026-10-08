---
title: 'frp 内网穿透搭建教程 —— 多二级域名 + HTTPS'
published: 2026-10-08
description: '使用 frp（TOML 配置，v0.71.0）将多个二级域名以 HTTPS 穿透到内网服务：服务端 systemd 部署、客户端 Docker Compose 部署、https2http 插件终结 TLS、MySQL TCP 直通及常见报错排查'
image: ''
tags: ['frp', '内网穿透', 'HTTPS']
category: '运维'
draft: false
lang: 'zh-CN'
---

> 整理日期：2026-10-08 ｜ frp 版本：v0.71.0（TOML 配置格式，适用于 frp ≥ 0.52）
>
> **文中域名（example.com）与内网 IP（192.168.1.100）均为示例数据，非真实环境；实际使用时替换为自己的域名和内网地址。**
>
> 场景：一台公网服务器，多个二级域名解析到该服务器，不同子域名穿透到内网机器的不同端口，浏览器直接通过 `https://子域名` 访问内网服务。

---

## 1. 架构说明

```
用户浏览器
   │  https://dbx.example.com (443)
   ▼
公网服务器 frps ──按 SNI 分流──隧道──▶ 内网机器 frpc（https2http 插件终结 TLS）──▶ 192.168.1.100:4224
```

- **frps（服务端）**：跑在公网服务器上，监听 443（HTTPS 流量按 SNI 分流）、80（HTTP）、7000（与 frpc 的通信端口）、7500（监控面板）。
- **frpc（客户端）**：跑在内网机器上，用 Docker Compose 部署。HTTPS 流量由 frps 原样转发进隧道，在**内网侧**由 `https2http` 插件用本地证书终结 TLS，再转成 HTTP 访问内网服务。
- **特点**：证书只放在内网机器上，服务器全程只见密文；缺点是证书到期需手动更换（无自动续期）。
- **非 HTTP 服务**（如 MySQL）不携带 Host/SNI，无法按域名分流，只能走 TCP 直通（域名仅作为服务器 IP 的别名，分流靠端口）。

### 服务清单（本文示例）

| 子域名 | 内网地址 | 协议 | 代理类型 |
|---|---|---|---|
| sy.example.com | 192.168.1.100:9002 | HTTP | `https` + https2http 插件 |
| dbx.example.com | 192.168.1.100:4224 | HTTP | `https` + https2http 插件 |
| drone.example.com | 192.168.1.100:8001 | HTTP | `https` + https2http 插件 |
| gost.example.com | 192.168.1.100:3100 | HTTP | `https` + https2http 插件 |
| status.example.com | 192.168.1.100:25774 | HTTP | `https` + https2http 插件 |
| mysql.example.com | 192.168.1.100:3308 | MySQL（TCP） | `tcp` 直通，remotePort = 3308 |

---

## 2. 准备工作

1. **DNS 解析**：在域名管理商处添加泛解析 `*.example.com → 服务器公网IP`（一次配置，后续新增子域名无需再动 DNS）；或逐条添加 A 记录。
2. **证书文件**：每个子域名一张证书（PEM 格式，建议含完整证书链 fullchain + 私钥 key）；如果有 `*.example.com` 泛域名证书，所有服务共用一对文件即可。
3. **云安全组放行端口**：

   | 端口 | 用途 |
   |---|---|
   | 7000/tcp | frpc ↔ frps 通信 |
   | 80/tcp | HTTP 访问（vhost） |
   | 443/tcp | HTTPS 访问（vhost） |
   | 7500/tcp | frps 监控面板 |
   | 3308/tcp | MySQL TCP 直通（按需） |

4. **备案提醒**：大陆地域的服务器，未 ICP 备案的域名在 80/443 上会被运营商拦截。解决：备案 / 选香港·境外地域 / 改用非标端口。

---

## 3. 服务端安装（frps，公网服务器）

以 root 身份执行，安装目录 `/root/frps`。

### 3.1 下载安装

```bash
# 确认架构：x86_64 → amd64；aarch64 → arm64
uname -m

# 下载解压（版本号以 https://github.com/fatedier/frp/releases 最新为准）
cd /tmp
wget https://github.com/fatedier/frp/releases/download/v0.71.0/frp_0.71.0_linux_amd64.tar.gz
tar -xzf frp_0.71.0_linux_amd64.tar.gz

# 只需要 frps 这个文件（frpc 是客户端用的）
mkdir -p /root/frps
cp frp_0.71.0_linux_amd64/frps /root/frps/
```

> 大陆服务器下载 GitHub 慢：可在链接前加加速前缀（如 `https://ghproxy.net/`），或本地下载后 `scp` 上传。

### 3.2 编写配置 `/root/frps/frps.toml`

```bash
tee /root/frps/frps.toml > /dev/null <<'EOF'
bindPort = 7000
vhostHTTPPort = 80
vhostHTTPSPort = 443
subDomainHost = "example.com"
auth.token = "换成强密码1"

# 内置监控面板
webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "admin"
webServer.password = "换成强密码2"
EOF
```

> **两个密码不要相同**：7000 端口的 token 是唯一门锁（弱密码等于任何人都能借服务器打隧道）；7500 面板直接暴露公网。

### 3.3 注册 systemd 服务

```bash
tee /etc/systemd/system/frps.service > /dev/null <<'EOF'
[Unit]
Description=frp server
After=network.target

[Service]
Type=simple
ExecStart=/root/frps/frps -c /root/frps/frps.toml
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now frps
```

### 3.4 验证

```bash
systemctl status frps --no-pager
ss -tlnp | grep frps        # 应监听 7000、80、443、7500
```

浏览器访问 `http://服务器IP:7500`，用配置里的账号密码登录面板。

---

## 4. 客户端安装（frpc，内网机器）

用 Docker Compose 部署，镜像 `snowdreamtech/frpc`（社区主流，amd64/arm64 都有）。

### 4.1 目录结构

```
/root/frpc/
├── docker-compose.yml
├── frpc.toml
└── certs/                        # 宿主机证书目录（挂载为容器内 /etc/frp/certs）
    ├── sy.example.com.pem / .key
    ├── dbx.example.com.pem / .key
    ├── drone.example.com.pem / .key
    ├── gost.example.com.pem / .key
    └── status.example.com.pem / .key
```

> 泛域名证书只需放一对文件，配置里所有代理引用同一对路径。

### 4.2 docker-compose.yml

```yaml
services:
  frpc:
    image: snowdreamtech/frpc
    container_name: frpc
    restart: always
    network_mode: host          # Linux 推荐：容器直接用宿主机网络
    volumes:
      - ./frpc.toml:/etc/frp/frpc.toml
      - ./certs:/etc/frp/certs:ro
```

> - **Windows / Mac 的 Docker Desktop 不支持 `network_mode: host`**：删掉该行，改加 `extra_hosts: ["host.docker.internal:host-gateway"]`，并且 frpc.toml 里插件的 `localAddr` 写 `host.docker.internal:端口`。
> - 国内拉不动 Docker Hub：先给 Docker 配镜像加速器（`/etc/docker/daemon.json` 加 `registry-mirrors`）再 `docker compose pull`。

### 4.3 frpc.toml（完整示例）

```toml
# ========== 服务器连接 ==========
serverAddr = "服务器公网IP"
serverPort = 7000
auth.token = "强密码1（和 frps.toml 一致）"
transport.tls.enable = true     # 加密 frpc↔frps 控制通道，建议开

# ========== HTTPS 服务：按子域名分流，证书在内网本地 ==========
[[proxies]]
name = "sy"
type = "https"
subdomain = "sy"                # = sy.example.com

[proxies.plugin]
type = "https2http"
localAddr = "192.168.1.100:9002"
crtPath = "/etc/frp/certs/sy.example.com.pem"
keyPath = "/etc/frp/certs/sy.example.com.key"

[[proxies]]
name = "dbx"
type = "https"
subdomain = "dbx"               # = dbx.example.com

[proxies.plugin]
type = "https2http"
localAddr = "192.168.1.100:4224"
crtPath = "/etc/frp/certs/dbx.example.com.pem"
keyPath = "/etc/frp/certs/dbx.example.com.key"

[[proxies]]
name = "drone"
type = "https"
subdomain = "drone"             # = drone.example.com

[proxies.plugin]
type = "https2http"
localAddr = "192.168.1.100:8001"
crtPath = "/etc/frp/certs/drone.example.com.pem"
keyPath = "/etc/frp/certs/drone.example.com.key"

[[proxies]]
name = "gost"
type = "https"
subdomain = "gost"              # = gost.example.com

[proxies.plugin]
type = "https2http"
localAddr = "192.168.1.100:3100"
crtPath = "/etc/frp/certs/gost.example.com.pem"
keyPath = "/etc/frp/certs/gost.example.com.key"

[[proxies]]
name = "status"
type = "https"
subdomain = "status"            # = status.example.com

[proxies.plugin]
type = "https2http"
localAddr = "192.168.1.100:25774"
crtPath = "/etc/frp/certs/status.example.com.pem"
keyPath = "/etc/frp/certs/status.example.com.key"

# ========== MySQL：非HTTP，TCP直通（不走域名分流） ==========
[[proxies]]
name = "mysql"
type = "tcp"
localIP = "192.168.1.100"
localPort = 3308
remotePort = 3308               # 服务器对外暴露的端口
```

**TOML 格式三个要点（都是实际踩过的坑）：**

1. `subdomain` 是**字符串不带括号**，只写**子域前缀**（写 `sy`，不要写 `["sy.example.com"]`）；
2. `[proxies.plugin]` 段必须写在每条代理普通参数（name/type/subdomain）的**后面**；
3. 证书路径写的是**容器内路径** `/etc/frp/certs/...`（对应宿主机 `/root/frpc/certs/`）。

### 4.4 启动与验证

```bash
cd /root/frpc
docker compose up -d
docker compose logs -f
```

看到 `login to server success` 和每条代理的 `start proxy success` 即成功。

---

## 5. 整体验证

1. **客户端日志**：所有代理 `start proxy success`；
2. **服务端面板** `http://服务器IP:7500`：代理列表全部在线、有流量曲线；
3. **浏览器**：访问 `https://dbx.example.com` 等域名，出现证书锁、页面为内网对应服务即通；
4. **MySQL**：`mysql -h mysql.example.com -P 3308 -u 用户 -p`（域名只是 IP 别名，分流靠端口 3308）。

> 注意：frp **不会自动把 http:// 跳转到 https://**，地址栏直接输 https。

---

## 6. 日常运维

### 新增一个服务（以 status.example.com → 25774 为例）

```bash
cd /root/frpc
cat >> frpc.toml <<'EOF'

[[proxies]]
name = "status"
type = "https"
subdomain = "status"

[proxies.plugin]
type = "https2http"
localAddr = "192.168.1.100:25774"
crtPath = "/etc/frp/certs/status.example.com.pem"
keyPath = "/etc/frp/certs/status.example.com.key"
EOF

docker compose restart frpc
docker compose logs -f
```

前置条件：泛解析已覆盖该子域名（否则补 A 记录）、证书文件已放入 `certs/`（泛域名证书则复用）。**服务端无需任何改动。**

### 常用命令

```bash
# 服务端
systemctl restart frps                        # 改配置后重启
journalctl -u frps -e -n 50                   # 看服务端日志（如端口占用报错）

# 客户端
docker compose restart frpc                   # 改配置后重启
docker compose logs -f                        # 跟踪日志
```

### 证书更换

证书到期需**手动替换** `certs/` 下的文件，然后 `docker compose restart frpc`。没有自动续期，到期日自行记录（对比 Caddy 方案的唯一代价）。

---

## 7. 踩坑记录（常见报错速查）

| 报错 / 现象 | 原因 | 解决 |
|---|---|---|
| `type [https] not supported when vhost https port is not set` | **服务端**没配 `vhostHTTPSPort`，或配了没重启 | frps.toml 加 `vhostHTTPSPort = 443`，`systemctl restart frps` |
| `custom domain [dbx.example.com] should not belong to subdomain host [example.com]` | 服务端设了 `subDomainHost` 后，子域名不能再用 `customDomains` 全称声明 | 客户端改用 `subdomain = "dbx"` 短前缀 |
| `subdomain` 写成数组或全称 | 格式错误 | `subdomain` 是字符串、只写前缀：`subdomain = "sy"` |
| 443 起不来 | 端口被 nginx/apache 等占用 | `ss -tlnp \| grep 443` 找到占用者停掉，或换端口 |
| 域名打不开但面板显示代理在线 | DNS 未生效，或大陆服务器未备案被拦 80/443 | `nslookup 子域名` 确认解析；未备案走备案/境外服务器/非标端口 |
| frpc 日志大量 `http: TLS handshake error from x.x.x.x: ...` | 公网扫描器/机器人探测 443（证书签发后域名进入证书透明度 CT 日志，机器人按域名探测），被 TLS 层正常拒绝 | **不是故障**，属互联网背景噪音；浏览器能正常打开 `https://子域名` 即无问题 |

---

## 8. 安全清单

- [ ] `auth.token` 使用强密码（7000 端口对公网开放，token 是唯一门锁）
- [ ] 面板 7500 密码独立且够强；更稳妥可把 `webServer.addr` 改 `127.0.0.1`，用 SSH 隧道访问：`ssh -L 7500:127.0.0.1:7500 root@服务器IP`
- [ ] MySQL 走 TCP 直通等于**直接挂公网**：数据库强密码、删除匿名账户，最好安全组里 3308 只放行固定出口 IP（仅自用可考虑 frp 的 `stcp` 安全隧道模式，端口完全不暴露）
- [ ] 证书文件使用含中间证书的 fullchain，避免部分客户端报不信任
- [ ] 大陆服务器 + 未备案域名：80/443 会被拦截，提前规划（备案 / 境外地域 / 非标端口）
