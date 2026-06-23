---
title: '新电脑 Bitwarden 登不上，旧电脑却正常：一次 Vaultwarden 版本兼容坑的完整复盘 - 魔都水滴'
published: 2026-06-23
description: ''
image: ''
tags: ['Docker', 'API', '浏览器']
category: '后端'
draft: false
lang: 'zh-CN'
---

> 原文链接：https://blog.margrop.net/post/chrome-bitwarden-vaultwarden-login-failure-prelogin/
> 抓取时间：2026-06-23 11:48:03

发布时间: 2026-05-18
 
 
 
 
 [ Bitwarden ](/tag/bitwarden/)
 
 [ Vaultwarden ](/tag/vaultwarden/)
 
 [ Chrome ](/tag/chrome/)
 
 [ Docker ](/tag/docker/)
 
 [ 自托管 ](/tag/%E8%87%AA%E6%89%98%E7%AE%A1/)
 
 [ 密码管理 ](/tag/%E5%AF%86%E7%A0%81%E7%AE%A1%E7%90%86/)
 
 [ 故障排查 ](/tag/%E6%95%85%E9%9A%9C%E6%8E%92%E6%9F%A5/)
 
 [ 兼容性 ](/tag/%E5%85%BC%E5%AE%B9%E6%80%A7/)
 
 

 
 
> 先说结论
> 这次问题表面上看是“新安装的 Chrome + Bitwarden 扩展登录失败”，但根因并不在 Chrome，也不是账号密码输错，而是 Bitwarden 2026.4.1 客户端登录流程调用了新的 prelogin 接口，而自建 Vaultwarden 服务端还停留在 1.35.4-alpine ，缺少 /identity/accounts/prelogin/password 接口 。
> 旧电脑之所以还能用，是因为它大概率已有登录态和本地缓存，并没有重新触发完整的首次登录流程。真正的修复不是反复重装浏览器，而是先备份，再把 Vaultwarden 升级到 1.36.0 或更新版本，然后用日志确认新接口不再 404。
> 本文所有域名、路径、账号、部署目录均已脱敏，示例中统一使用 vault.example.com 、 /opt/vaultwarden 等占位值，不包含任何内网地址或私人信息。

![新电脑登录失败，旧电脑却正常](/post-images/chrome-bitwarden-vaultwarden-login-failure-prelogin/00-title.svg)

 图 1：这类故障最容易误判成 Chrome 或扩展问题，实际往往是客户端和服务端 API 版本错位。 

## 0. 问题背景：看起来像 Chrome 坏了，其实不是

最近遇到一个很典型、也很容易让人误判的问题：多台新安装的电脑上，安装了全新的 Chrome，再安装 Bitwarden 浏览器扩展，扩展版本是 2026.4.1 。密码库不是使用 Bitwarden 官方云，而是连接自己搭建的 Vaultwarden。

现象很奇怪：

 
- 新电脑：Chrome 新装，Bitwarden 扩展新装，配置自托管地址后登录失败；

- 旧电脑：Chrome 里同样已经升级到 Bitwarden 2026.4.1 ，但日常使用完全正常；

- 服务端：Vaultwarden 仍然在跑，旧设备同步和填充密码都没有明显异常；

- 直觉：既然旧电脑能用，新电脑不能用，是不是 Chrome 权限、扩展缓存、网络代理或者证书问题？

 

这种问题最容易把排查方向带偏。因为“旧电脑正常”会给人一种错觉：服务端肯定没有问题。可密码管理类软件的客户端状态并不是一个简单的开关。旧电脑可能已经登录过，保留了本地密钥、会话状态、设备记录、同步缓存；新电脑则必须从零开始走一次完整登录流程，包括服务端发现、prelogin、KDF 参数获取、令牌交换、同步初始化等步骤。

所以真正需要问的问题不是“为什么同版本扩展有的能用有的不能用”，而是： 新设备首次登录和旧设备已登录状态，到底走的是不是同一条 API 路径？ 

答案通常是否定的。

## 1. 问题表现：失败集中在“新设备首次登录”

这次问题有几个非常鲜明的特征。

第一，失败只发生在新安装环境。几台新电脑都失败，说明这不是某一台电脑的偶发缓存问题，也不像是某个用户手抖输错密码。只要是新 Chrome、新扩展、新登录，就会复现。

第二，旧电脑的 Bitwarden 扩展版本并不低。旧电脑也已经是 2026.4.1 ，但因为它之前已经登录过，所以它的“能用”更多代表既有会话仍然有效，不代表完整登录链路仍然健康。

第三，服务端镜像版本是一个关键线索：

 
```
 vaultwarden/server:1.35.4-alpine
 
```
 
这个版本发布于 2026 年 2 月，而 Vaultwarden 1.36.0 在 2026 年 5 月 3 日发布，官方 release note 中明确包含一项变更：

 
```
 add new /identity/accounts/prelogin/password
 
```
 
这就把问题从“泛泛的登录失败”收敛成一个非常具体的兼容性问题： 新客户端可能开始调用一个旧服务端根本没有的接口。 

![旧设备与新设备的登录路径不同](/post-images/chrome-bitwarden-vaultwarden-login-failure-prelogin/01-flow.svg)

 图 2：旧电脑“能用”不等于“服务端登录 API 完整可用”，它可能只是没有重新走首次登录流程。 

## 2. 最容易走错的排查方向

遇到浏览器扩展登录失败，很多人第一反应会去折腾客户端：卸载扩展、重装 Chrome、清缓存、换浏览器、关代理、换 DNS、甚至怀疑账号密码。不是说这些方向完全没有价值，而是它们应该排在服务端版本和接口日志之后。

在自托管密码管理系统里，客户端只是入口。真正决定登录能不能完成的，是客户端发出的请求能否被服务端正确理解。如果服务端缺接口，客户端再干净也没有用。

这次问题里，有几个方向看起来很像，但优先级都不该排第一。

### 2.1 不是简单的 Chrome 权限问题

Chrome 扩展权限确实会造成一些异常，比如扩展被限制为“点击时访问”、公司策略禁用了某些能力、或者浏览器拦截了跨站请求。但如果多台新装设备都失败，而旧设备保持可用，同时服务端版本又落后于新客户端版本，那么服务端兼容性要优先排查。

### 2.2 不是简单的密码错误

如果账号密码真错，旧设备的缓存状态并不能证明密码正确，但多台新设备同样失败时，仍然要结合服务端日志判断。特别是当日志里出现 prelogin 相关 404 时，就不能再把问题归因于密码。

### 2.3 也不能只看 Web Vault 是否能打开

很多人会说：浏览器直接打开 https://vault.example.com 能看到 Web Vault，说明服务端正常。这个判断不够。能打开首页，只能证明反向代理、TLS、静态资源大致可用；不代表所有 Identity API 都可用，更不代表新版浏览器扩展的登录流程一定兼容。

### 2.4 不要先让旧电脑退出登录

这是一个非常重要的安全操作习惯。旧电脑还能用时，它是最后的可用入口。不要为了测试而在旧电脑上退出登录。等服务端版本、备份、升级、验证都完成后，再考虑是否重登旧设备。

## 3. 正确的分析路径：从“现象”走到“接口”

排障时最有价值的不是猜测，而是把问题切成几个可验证的层次。

第一层：客户端是否真的连到了自托管服务器？新设备登录页必须选择 Self-hosted / 自托管，并填写干净的服务地址，例如：

 
```
 https://vault.example.com
 
```
 
不要填 http:// ，不要填带 /#/login 的页面地址，也不要误连到官方 bitwarden.com 。如果这里错了，服务端日志通常完全看不到请求。

第二层：服务端是否收到请求？在服务器上看容器日志：

 
```
 docker logs -f vaultwarden 2>& 1 | grep -Ei 'prelogin|connect/token|404|400|ERROR|WARN' 
 
```
 
然后在新电脑上尝试登录一次。

第三层：失败点是哪一个接口？如果看到类似：

 
```
 POST /identity/accounts/prelogin/password 404
 
```
 
这就已经非常接近根因了。 404 的含义不是“账号不存在”，而是服务端路由里没有这个接口。对于一个仍在 1.35.4 的 Vaultwarden 来说，这正好符合版本事实。

第四层：对照官方发布说明。Vaultwarden 1.36.0 的变更列表中明确写了新增 /identity/accounts/prelogin/password 。这不是猜测，而是版本差异。

![排查顺序：先看版本和请求，再看客户端](/post-images/chrome-bitwarden-vaultwarden-login-failure-prelogin/02-triage.svg)

 图 3：排查顺序决定效率。先确认服务端版本和接口日志，再处理客户端环境。 

还有一个判断细节也很重要：不要把“同步还能跑”理解成“登录链路没问题”。密码管理器的同步、填充、解锁、重新登录并不是同一个动作。同步可能依赖已有令牌，解锁可能只发生在本地，填充甚至可能完全使用本地缓存；但新设备首次登录必须重新向服务端证明身份，并拿到服务端返回的登录准备信息。只要这条链路里有一个接口缺失，新设备就会失败。很多自托管系统的疑难杂症，本质上都是把这几种状态混在一起看，才让排障方向偏了。

## 4. 问题根因：客户端登录流程升级，服务端 API 没跟上

把线索串起来，根因就很清楚了。

新安装的 Bitwarden Chrome 扩展 2026.4.1 在首次登录自托管服务端时，会走新的登录准备流程。这个流程需要调用：

 
```
 /identity/accounts/prelogin/password
 
```
 
这个接口用于登录前获取或处理密码登录相关的准备信息。对用户来说，它隐藏在“输入邮箱密码并点击登录”的背后；对服务端来说，它是登录协议的一部分。

而当前服务端镜像是：

 
```
 vaultwarden/server:1.35.4-alpine
 
```
 
这个版本并不包含上面的新接口。于是新设备首次登录时，客户端发出请求，服务端返回 404，扩展端表现为登录失败。旧电脑因为已有会话，不一定重新调用完整 prelogin 流程，所以还能继续填充和同步，看上去像“旧电脑一切正常”。

这就是这类问题最迷惑人的地方： 同一个扩展版本，在“已登录设备”和“首次登录设备”上不是同一种状态。 

还有一个容易忽略的点：这次升级不只是兼容性修复。Vaultwarden 1.36.0 release note 同时包含多项安全修复，并明确建议尽快更新。因此，即便暂时没有新电脑登录问题，也不应该长期停留在旧版本。

## 5. 最小安全修复方案：备份、只改镜像、升级、验证

解决这类问题时，最忌讳一口气改很多东西。不要同时改反向代理、改域名、改 volume、改数据库、改 SMTP、改管理员 Token。正确做法是：先保留现有部署结构，只把 Vaultwarden 镜像升级到包含新接口的版本。

### 5.1 先备份，不要跳过

如果使用 SQLite，并且数据目录在 /opt/vaultwarden/data ，可以这样备份：

 
```
 cd /opt/vaultwarden
 
 tar -czvf vaultwarden-data-backup- $( date +%F-%H%M ) .tar.gz ./data
 cp docker-compose.yml docker-compose.yml.bak- $( date +%F-%H%M ) 
 
```
 
如果使用 MySQL 或 PostgreSQL，还要做数据库备份。密码库系统的升级，哪怕只是小版本，也必须先有可回滚的备份。

### 5.2 修改 Docker Compose 镜像版本

示例配置如下，只展示关键字段：

 
```
 services :
 vaultwarden :
 image : vaultwarden/server:1.36.0-alpine 
 container_name : vaultwarden 
 restart : unless-stopped 
 volumes :
 - ./data:/data 
 ports :
 - "8080:80" 
 
```
 
如果原来有这些配置，保持不动：

 
```
 DOMAIN
 SMTP_HOST
 SMTP_FROM
 ADMIN_TOKEN
 SIGNUPS_ALLOWED
 WEBSOCKET_ENABLED
 DATABASE_URL
 
```
 
本次修复的目标是验证版本兼容性，不是重构部署。

### 5.3 拉取镜像并重启

 
```
 docker compose pull vaultwarden
 docker compose up -d vaultwarden
 docker logs -f vaultwarden
 
```
 
如果服务名不是 vaultwarden ，先查看：

 
```
 docker compose ps
 
```
 
再用实际服务名执行。

### 5.4 确认版本和接口

升级后可以通过配置接口或日志确认版本：

 
```
 curl -s https://vault.example.com/api/config | jq
 
```
 
也可以看容器日志中的版本信息：

 
```
 docker logs vaultwarden | grep -i version
 
```
 
然后再次在新电脑 Bitwarden 扩展里登录。此时重点观察日志里是否还出现：

 
```
 POST /identity/accounts/prelogin/password 404
 
```
 
如果 404 消失，登录继续往后走，基本就证明根因命中。

![最小安全修复路径](/post-images/chrome-bitwarden-vaultwarden-login-failure-prelogin/03-upgrade-checklist.svg)

 图 4：只改必要项，保留原有部署结构，先把服务端 API 补齐。 

## 6. 升级后仍失败怎么办

升级到 1.36.0 后，如果新电脑仍然登录失败，不要回到盲目重装。继续按日志分叉处理。

### 6.1 仍然看到 prelogin 404

如果日志仍然是：

 
```
 POST /identity/accounts/prelogin/password 404
 
```
 
说明请求没有打到新容器，常见原因包括：

 
- Docker Compose 没有真正重建目标服务；

- 反向代理仍然指向旧容器或旧端口；

- 同一台服务器上存在多个 Vaultwarden 实例；

- 镜像 tag 改了，但容器实际仍在使用旧镜像；

- CDN、网关或上游代理缓存了错误路由。

 

此时要检查：

 
```
 docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}' 
 docker inspect vaultwarden --format '{{.Config.Image}}' 
 
```
 
还要确认反向代理 upstream 指向的是当前容器端口。

### 6.2 prelogin 正常，但 token 返回 400

如果 prelogin 不再 404，但后续看到：

 
```
 POST /identity/connect/token 400
 Username or password is incorrect
 
```
 
再排查：

 
- Self-hosted URL 是否填错；

- 是否误连到官方服务；

- 邮箱前后是否有空格；

- 主密码是否真的正确；

- 2FA、WebAuthn、SSO 是否有特殊配置；

- 反向代理是否正确传递 Host 和 X-Forwarded-Proto 。

 

### 6.3 服务端完全没有请求

如果登录时服务端日志没有任何请求，就说明请求没到 Vaultwarden。重点看：

 
- 扩展是否选择了 Self-hosted；

- URL 是否是 https://vault.example.com 这种干净地址；

- 新电脑是否信任 TLS 证书；

- DNS 是否解析到正确入口；

- Chrome 扩展网站访问权限是否过度限制；

- 公司代理、系统代理、浏览器安全策略是否拦截。

 

## 7. 推荐的反向代理检查项

虽然这次根因是服务端版本，但自托管 Vaultwarden 仍然需要健康的反向代理配置。Nginx 示例：

 
```
 proxy_set_header Host $host;
 proxy_set_header X-Real-IP $remote_addr;
 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 proxy_set_header X-Forwarded-Proto $scheme;
 
 proxy_http_version 1 .1 ;
 proxy_set_header Upgrade $http_upgrade;
 proxy_set_header Connection "upgrade" ;
 
```
 
如果使用 Nginx Proxy Manager，至少确认 WebSocket Support 已开启，并且 upstream 没有指向旧实例。WebSocket 主要影响同步通知，但反代配置混乱时，登录、附件、图标、同步也可能出现连锁异常。

## 8. 这件事给自托管服务的启发

这次故障很小，但教训很典型。

第一，自托管不是“一次部署，永久不动”。客户端是持续更新的，尤其是浏览器扩展、移动端 App、桌面端，它们会不断引入新的 API 调用、登录流程、安全策略。如果服务端长期不升级，迟早会被某一次客户端更新撞出来。

第二，“旧设备正常”只能证明旧状态还活着，不能证明新登录路径可用。很多系统都有类似问题：已经登录的设备能继续用，新设备、新令牌、新授权流程却失败。排查时必须区分“已有会话”和“新建会话”。

第三，排障要看请求而不是只看界面。界面只会告诉你“登录失败”，日志才能告诉你失败在 prelogin、token、sync、TLS、反代还是客户端配置。

第四，安全升级和兼容升级经常是同一件事。Vaultwarden 1.36.0 同时带来新接口和安全修复，停在旧版本不仅影响新客户端登录，也会扩大安全风险窗口。

第五，修复时要控制变量。只改镜像版本，保留原有 volume、数据库、反代和环境变量，是最快验证根因的方式。

## 9. Q&A

### Q1：为什么旧电脑同样是 Bitwarden 2026.4.1，却没有问题？

因为旧电脑很可能已有登录态。它不一定重新走完整首次登录流程，也不一定调用 /identity/accounts/prelogin/password 。这不是版本相同就一定路径相同的问题，而是登录状态不同。

### Q2：能不能先降级 Bitwarden 扩展？

不建议作为长期方案。浏览器扩展降级麻烦，容易被自动更新覆盖，也会留下安全风险。服务端补齐 API 才是正解。

### Q3：必须升级到 1.36.0 吗？

至少要升级到包含 /identity/accounts/prelogin/password 的版本。当前官方最新 release 是 1.36.0 ，所以直接升到它最干净。以后如果有更新版本，也应优先选择最新稳定版本。

### Q4：只升级 Vaultwarden 会不会影响已有密码库？

正常情况下不会，但必须先备份。Vaultwarden 的数据通常在 /data volume 或外部数据库里，镜像升级不会删除数据；真正危险的是没有备份、误改 volume、误连空数据库。

### Q5：升级后旧电脑需要重新登录吗？

不需要立刻动旧电脑。先让新电脑登录成功，确认同步、填充、Web Vault 都正常，再根据需要处理旧设备。

### Q6：如果我用的是官方 Bitwarden Server，也会有这个问题吗？

官方服务端和官方客户端的兼容性由 Bitwarden 官方维护，通常不会出现这种非官方兼容滞后问题。Vaultwarden 是优秀的社区实现，但它需要跟随 Bitwarden 客户端 API 变化及时更新。

### Q7：有没有一条最短排查命令？

有。先在服务端盯日志：

 
```
 docker logs -f vaultwarden 2>& 1 | grep -Ei 'prelogin|connect/token|404|400|ERROR|WARN' 
 
```
 
然后新设备登录一次。如果看到 prelogin/password 404 ，优先升级 Vaultwarden。

## 10. 实战操作剧本：按这个顺序做，风险最低

如果把上面的分析落到一次真实维护里，我会把动作拆成三个阶段：维护前确认、升级中观察、升级后验收。这样做的价值不是显得流程复杂，而是避免把一个本来很小的兼容性问题修成更大的服务事故。

### 10.1 维护前确认

第一步是确认自己到底在改哪一个实例。很多自托管服务跑久了之后，机器上可能有旧 compose 目录、旧容器、测试容器、备份容器，甚至反向代理还指向另一个端口。升级前先执行：

 
```
 docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}' 
 docker compose ps
 
```
 
然后确认三个东西完全对应：当前正在运行的容器名、反向代理 upstream 指向的端口、compose 文件里的服务名。只有这三者一致，后面的升级才有意义。

第二步是记录现状。至少记录当前镜像、容器 ID、数据目录、数据库类型、反向代理入口。示例：

 
```
 docker inspect vaultwarden --format '{{.Id}} {{.Config.Image}}' 
 docker inspect vaultwarden --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}' 
 
```
 
这些信息在升级失败时非常有用。很多人回滚失败，不是因为没有备份，而是因为不知道原来到底用了哪个 volume、哪个配置文件、哪个端口。

第三步是确认备份能被找到。不要只执行压缩命令就算完事，还要 ls -lh 看文件大小，必要时用 tar -tzf 看压缩包能否列出内容。如果是外部数据库，还要确认数据库 dump 文件不是 0 字节。

### 10.2 升级中观察

升级时建议开两个终端。一个终端执行 compose 操作：

 
```
 docker compose pull vaultwarden
 docker compose up -d vaultwarden
 
```
 
另一个终端持续看日志：

 
```
 docker logs -f vaultwarden
 
```
 
日志里重点看三类信息。第一类是启动版本，确认新容器确实跑起来；第二类是数据库迁移或 schema 检查，如果有错误要立刻停止继续尝试登录；第三类是来自新电脑扩展的登录请求，确认 prelogin/password 不再 404。

如果升级后容器不断重启，不要急着反复 up -d 。先看最近日志：

 
```
 docker logs --tail = 200 vaultwarden
 
```
 
如果错误指向环境变量、数据库连接、权限或 volume 路径，就回到配置层处理。不要在不明原因时继续修改多个变量。

### 10.3 升级后验收

验收不是“页面能打开”就结束。建议至少做五个检查。

第一，访问 Web Vault 首页，确认 TLS 正常、静态资源正常加载。

第二，调用配置接口，确认返回内容符合预期：

 
```
 curl -s https://vault.example.com/api/config | jq
 
```
 
第三，新电脑 Chrome 扩展重新选择 Self-hosted，填入 https://vault.example.com ，完成一次登录。

第四，登录后创建一个无敏感内容的测试条目，比如标题为 test-login-after-upgrade ，确认能同步到 Web Vault，再删除它。

第五，观察日志 5 到 10 分钟，确认没有连续报错、数据库错误、反向代理 502、WebSocket 异常风暴。

这五个检查做完，才能说“服务恢复”。如果只看到登录成功就结束，后续同步、填充、移动端、桌面端仍然可能留下未验证的坑。

### 10.4 回滚原则

如果升级失败，优先回滚到升级前的 compose 文件和数据备份。回滚时也要控制变量：先恢复 image tag，重新 docker compose up -d ；如果仍然异常，再考虑恢复数据目录或数据库。不要一边改 image，一边改 volume，一边改代理端口。

回滚成功的标准也不是容器起来，而是旧设备或 Web Vault 能重新进入，日志没有持续错误。等服务稳定后，再重新整理升级方案。

这套流程看起来比“改一行 image 然后重启”多了几分钟，但它能显著降低密码库服务的维护风险。密码库不是普通工具服务，里面存的是访问其他系统的钥匙。越是小升级，越应该把备份、日志和验收做扎实。

## 11. 总结

这次问题的核心并不复杂：Bitwarden Chrome 扩展 2026.4.1 在新设备首次登录时调用了新的 prelogin 接口，而 Vaultwarden 1.35.4-alpine 没有这个接口。旧电脑还能用，是因为它处在已有会话状态，不代表新登录链路可用。

最终建议非常直接：

 
```
 先备份，再把 vaultwarden/server:1.35.4-alpine 升级到 vaultwarden/server:1.36.0-alpine 或更新稳定版本。
 
```
 
升级后用日志确认 /identity/accounts/prelogin/password 不再返回 404，再处理扩展端的 Self-hosted URL、权限、证书和反向代理细节。

这类问题真正值得记住的不是某个版本号，而是一种判断方法：当“旧设备正常、新设备失败”时，先区分已有会话和首次登录，再沿着请求日志去找协议差异。这样排障会快很多，也更不容易被表象带偏。

## 参考来源

 
- Vaultwarden GitHub Release 1.36.0 ：https://github.com/dani-garcia/vaultwarden/releases/tag/1.36.0

- Vaultwarden PR add new /identity/accounts/prelogin/password ：https://github.com/dani-garcia/vaultwarden/pull/7156

- Bitwarden 官方自托管帮助文档：https://bitwarden.com/help/self-host-an-organization/

- 本文问题背景来自一次已脱敏的排障对话，所有私有部署信息均已替换为示例值。
