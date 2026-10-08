---
title: '小白向Komari搭建及配置图文教程'
published: 2026-10-08
description: '面向新手的 Komari 服务器监控/探针面板搭建与配置教程，涵盖 Docker Compose 与 1Panel 部署、反向代理、PurCarte 主题美化及监控节点添加'
image: ''
tags: ['Komari', '监控', 'Docker']
category: '运维'
draft: false
lang: 'zh-CN'
---

> 原文链接：https://juejin.cn/post/7600234310965919782#heading-9
> 抓取时间：2026-10-08 11:20:14

小白向Komari搭建及配置图文教程
 

 [ 
 猫猫摸大鱼
 ](/user/3653005204006634/posts) 
 2026-01-28
 
 
 953
 
 阅读5分钟
 本文作者：猫猫摸大鱼 原文地址：[www.iloli.love/archives/17…](https://link.juejin.cn?target=https%3A%2F%2Fwww.iloli.love%2Farchives%2F1769602819038)

## 1. 前言

Komari 是一个服务器监控/探针面板，github地址为 [github.com/komari-moni…](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fkomari-monitor%2Fkomari)

本文基于 Komari 1.1.3 版本，Purcarte主题 1.2.5 版本，KomariBeautify 0.4.2 版本

本文中搭建Komari使用的是腾讯云轻量应用服务器，可以参加腾讯云活动 [cloud.tencent.com/act/pro/dou…](https://link.juejin.cn?target=https%3A%2F%2Fcloud.tencent.com%2Fact%2Fpro%2Fdouble12-2025) 进行购买，4核4G服务器新客38元/年起，当然买不买都无所谓，毕竟我也没有AFF

## 2. 部署搭建Komari

首先是部署Komari，这里我们介绍docker compose 部署和 1panel 部署两种方式（2.1与2.2两种方式二选一即可）

如果想要使用更多部署方式（例如一键脚本）可以参考Komari官方文档 [www.komari.wiki/install/qui…](https://link.juejin.cn?target=https%3A%2F%2Fwww.komari.wiki%2Finstall%2Fquick-start.html)

### 2.1 docker compose 部署

首先确保你的服务器安装了 Docker ，安装 Docker 的教程遍地都是，这里就不多赘述了（建议使用 [linuxmirrors.cn/](https://link.juejin.cn?target=https%3A%2F%2Flinuxmirrors.cn%2F) ）

另外只要不是非常久远版本的 Docker 都是自带 compose 的，所以一般来说不需要额外安装 docker-compose

确定安装好 Docker 了以后，就可以找一个目录来部署和保存Komari的数据了（本文中使用 /data/komari ）

在 /data/komari 目录下新建文件 compose.yaml 

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/50dc695b03e94c69b77bf1dd8a094fe8~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=g6tILqqMe5Rt3LSJHLe6thY1hNo%3D)

将以下内容复制粘贴进 compose.yaml 

```yaml
services:
  komari:
    image: ghcr.io/komari-monitor/komari:latest
    container_name: komari
    ports:
      - 25774:25774
    volumes:
      - ./data:/app/data
    environment:
      # 可选：自定义初始管理员账号
      # ADMIN_USERNAME: admin
      # ADMIN_PASSWORD: yourpassword
    restart: unless-stopped
```

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/aecdf4c9d3a84bcb833660bae93ffcb6~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=vwHlTCfW63nCAaoQsTzBVY5IS1c%3D)

接下来进行修改

首先，如果你的服务器位于大陆，可以将 ghcr.io/komari-monitor/komari:latest 替换为 ghcr.1ms.run/komari-monitor/komari:latest （1ms.run加速镜像）

其次，可以将 - 25774:25774 中 前面的 那个25774修改为其它端口（这个也可以不修改，默认即可）

然后，将 # ADMIN_USERNAME 和 # ADMIN_PASSWORD 前面的 # 删除，并分别修改后面的值为你要给komari设置的账号 密码（要修改）

我的服务器位于大陆，不修改端口，设置了账号密码，修改后的示例：

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/a6caac97bcd4439ea1e51ec13a95cf0d~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=fNTjCPxsgwmt6dm9shfh%2BsaHoLU%3D)

保存后，在 /data/komari 目录下运行命令 docker compose up -d ，如下图，容器启动即成功

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/6d90250437f1446ca8915d443add09e2~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=8jCPR1yT09D9NNlFhpglNEn89gY%3D)

### 2.2 1panel部署

如果你的服务器在使用1panel面板，那么可以使用更简单的部署方式

首先在服务器上运行脚本

```bash
bash -c "$(curl -sSL https://1panel.komari.wiki/install.sh)"
```

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/920a1b9e7faa49fb96c56d446d5fceb3~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=3HgwQBZ%2BliWJyu8buFg07UJ5vBU%3D)

接下来 来到1panel面板，点击 应用商店 - 同步本地应用 然后关闭弹窗

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/20eea493b0cf4ca0b3f50ee073fddb5d~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=LI6ycTL8WeV4I6Nz2Y50Kh6dDo8%3D)

接下来输入 komari ，点击搜索，点击安装

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/3f562b8865a24579b02b83ec67ddfa2b~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=cuImtkPEgUcQHTTrtuZ8ZasMYxQ%3D)

然后 可选修改端口（一般默认即可），修改管理员用户名和密码，如果不配置反代或需要端口访问，则将 端口外部访问 勾选

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/e6b5c20952a94260a6595ff7595715af~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=eHz5uoKD%2B%2FdWJDsEsK6wXcwPcFM%3D)

如果你的服务器位于境外，直接点击确认即可

如果你的服务器位于大陆，那么下拉到底部，勾选 编辑 compose 文件 ，然后在下方框内将 ghcr.io/komari-monitor/komari 替换为 ghcr.1ms.run/komari-monitor/komari （1ms.run加速镜像），点击确认

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/334c42287d4c49e88e37740a0d65b837~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=ToTsA6pkd8kUFRTxjjcMT9b%2B2C4%3D)

安装完成，关闭弹窗即可

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/a9e29d8be1ef4c05bf4fbd0b9b0b0315~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=umkMnLWe%2FcFgKGv8I9sGz6lkx54%3D)

已经可以在应用商店看到刚刚安装的komari了

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/2187391245b342af95aac0276abef7e1~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=BomGlq5UmevBrRgXC9YH1MiKq5E%3D)

### 2.3 （可选）配置反代

1panel面板的反代模板内容很全面，所以为了方便，这里我使用1panel配置反代

点击网站 - 网站 - 创建网站

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/1bf5282ad63744499995227e2819b097~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=0ACncQZf%2FqZPBTJvelmmXQfk7LU%3D)

选择 反向代理 ，填写你反代komari的域名

如果你是1panel部署的komari，则点击下拉框，点击komari，点击确认

如果你是其它方式部署的komari，则在代理地址里填 127.0.0.1:25774 （如果你自定义了其它端口则将25774修改为你的端口），点击确认

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/abc4ee3d83024ce59ea8cb630bf1a783~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=%2B8t6F%2FyMDZVYViN1MahQIuJCWFw%3D)

如果需要为刚刚创建的网站域名配置证书，则点击配置 - HTTPS - 启用HTTPS，可以在里面配置你的证书，本文不再赘述

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/b73f5cbdd3c943d4afcbf25265673171~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=SEPDgFRBcCtPkCp0eJZp%2B5TWjd4%3D)

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/82673761888044d1baa9c50f10d799a2~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=hNyrBoLtsoC7qfJnXMMksigNSpI%3D)

## 3. 配置 Komari

已经部署完成了，接下来就可以访问并配置komari了

### 3.1 访问komari

如果你配置了反代，则访问你的域名

如果你没有配置反代，则访问 服务器IP:25774 （如果你自定义了其它端口则将25774修改为你的端口）

点击右上角登录，输入你刚刚设置的账号密码，点击登录

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/8e0be668e0e04bfb84c45b7ca4ec4695~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=2Qv3s%2F2OKqs051gHrsROC6rb1I0%3D)

点击接受

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/b083d6dee0aa4bfbb6aa489f6a239ede~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=aU5%2BZQG%2Bij%2FUlMn7INQbdFDRKAM%3D)

### 3.2 （可选）配置PurCarte主题

PurCarte主题github地址：[github.com/Montia37/ko…](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2FMontia37%2Fkomari-theme-purcarte) 

首先，访问releases，下载最新版的主题包到本地 [github.com/Montia37/ko…](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2FMontia37%2Fkomari-theme-purcarte%2Freleases)

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/6a5c233b973a49f695198bbdcd7b74ec~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=ydm9m1s0ls3jt3nRvTPQQ5Ves9c%3D)

在后台点击设置 - 主题管理 - 上传主题，上传刚刚下载的主题包

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/08306bbf18bb4788852e1415c2058785~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=DvcxYPAEZUvOJKu2%2B1Nuarn57dU%3D)

点击齿轮按钮，设置为当前主题

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/8a8ae654b83f4483a54f0d6110a15d71~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=XQj6zbXfAlymRClYb7pgHAInGeA%3D)

可以在前台点击如图按钮进行主题配置，也可以在后台 PurCarte设置 进行主题配置

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/934894f57e5b48889ae3cb5ee26fa16c~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=DQXs0hPKC6dP3appkT7xlvkCsqw%3D)

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/261ee53937f245a0a1b6a506a4ae2ca5~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=ZLCklr%2BIyIulx38mTAOfUMNpe%2F8%3D)

默认配置即可用，建议自行全部翻阅一遍进行自定义配置

（这里夹带一点点私货，公益站点，跪求大佬放过）欢迎大家将背景图片设置为我的双端自适应二次元图片API https://www.loliapi.com/acg/ 

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/8b080e3c25794ab4889dfee4c6cb2ec3~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=VxdVpy1L2smVQklWH8m4A95hfJY%3D)

### 3.3 （可选）配置KomariBeautify - 基于PurCarte主题的自定义代码

进入后台，点击设置 - 站点，找到 自定义头部 和 自定义Body 的位置

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/0cee104e1a1c46008dbb9dc351941ad2~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=i78inTINncrEQbZ59bQHzmv8py8%3D)

接下来，访问KomariBeautify的github地址：[github.com/YoungYannic…](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2FYoungYannick%2FKomariBeautify)

点击 KomariBeautify.html

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/4f8cfc4d46e44a65b52ba8693a7301cf~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=W7iKR1j6SQbiXloRbobTopPM9zA%3D)

**重要！！！**需要将其中的 CSS/HTML 相关代码和 JS 相关代码，分别复制到 自定义头部 和 自定义Body 里

对于KomariBeautify V0.4.2版本，可以翻到第 1071 行，其它版本请自行寻找，上面的全部为CSS/HTML代码，下面的全部为JS代码

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/f634657ebcf047618f0927329b8a0c86~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=01brbCdgFkj8Y9WAw%2F3PoCU9X08%3D)

（如果该项目更新了新的版本，自己实在找不到分界在哪里，可以试试问AI）

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/aa040baea8f54f1695cf0caeb594806f~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=30BO29%2F8a3x%2F%2FuCK5IDgZghRO68%3D)

粘贴完成后分别点击保存

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/5a02025b96bf4f8db43d1bf0afb822bf~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=EAZaUvnjGF1JtbAC6G9oxqHyLl8%3D)

（补充）0.4.2版本，可以通过修改792和793行的代码，来修改欢迎小面板的图片和标题

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/f73c3b9290ea4d3f843a2a5dc0b20673~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=uieZw2KdegGNGPJTs9Cd3siL5rE%3D)

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/ddd25b412b514e089ba1e6d938239dfd~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=zIUXUaRn8yFYwbExJwzofzkGpRA%3D)

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/94ed8e4cd757401c8c12dc764aee62c8~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=hUfykB38VLM8JtEH318lFzoRmfA%3D)

目前添加了主题和增强的效果

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/e3ff80cacf39493aa15fb6832774c1a7~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=vC7CmQm7JnnodF35JMZAFlYGkyk%3D)

### 3.4 添加服务器节点

进入后台，点击服务器 - 添加节点，可选填写节点名称，点击添加节点

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/816cb5069d7a47d1b92baa66fb0878ee~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=DzG2MCqDVkQhFQDRtW9%2FcgkuybY%3D)

点击一键部署指令按钮，根据服务器的类型和自己所需自行选择安装选项，如果是大陆机器，可以勾选 Github代理 ，然后填写 https://ghfast.top/ （目前可用，可能随时不可用，建议自己寻找），点击复制

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/a25755c9272d4abd98c69ce4cbc67b9f~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=27nH9XmcSuXf9ISI7ZfugQ29AQ8%3D)

在对应的服务器上运行刚刚复制的命令，很快就安装完了

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/71fede1d5f5a480ebb5317959ae8d230~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=anf4YmaBdBENtR3b6vIxkEisbeU%3D)

返回前台，已经可以看到刚刚添加的机器了

![](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/e4eadc654b28473c97e14e416f9f0081~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg54yr54yr5pG45aSn6bG8:q75.awebp?rk3s=f64ab15b&x-expires=1792022851&x-signature=QPQkrkbmvtKJaAWTWBtk%2FwAEnvY%3D)

## 4. 总结

欢迎大家来我的探针参观 [status.iloli.love/](https://link.juejin.cn?target=https%3A%2F%2Fstatus.iloli.love%2F) ，蹭蹭大家的流量（bushi

到这里，Komari的搭建及基础配置就完成了，感谢你的阅读，komari还有一些好玩的配置项，这里就先不多赘述了，以后 （下辈子） 再填坑吧
