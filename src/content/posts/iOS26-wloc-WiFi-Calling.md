---
title: '利用 wloc 在国行 iOS 26+ 不使用尾插开启 Wi-Fi Calling 的方法'
published: 2026-08-06
description: '国行 iPhone 在只有一台新系统机器、没有尾插或老 iPhone 的情况下，借助 wloc 定位模块 + 英国代理 IP 拉起 Wi-Fi 通话的实操记录。'
image: ''
tags: ['iOS', 'Wi-Fi Calling', 'wloc']
category: '数码'
draft: false
lang: 'zh-CN'
---

> 原文链接：https://www.v2ex.com/t/1229822
> 抓取时间：2026-08-06 11:46:24

## 背景

主包仅有一个新系统的 iPhone，觉得买尾插或老 iPhone 太麻烦，研究数日发现 wloc 也可以拉起 Wi-Fi Calling，成功后发现网上暂时没有类似的教程，故简要分享抛砖引玉。

## 操作步骤

1. 将 iPhone 拔出外卡，开启飞行模式。
2. 按照 GitHub 上的步骤配置好 wloc（<https://github.com/Yu9191/wloc>），这里以小火箭为例：
   - 依次点击打开小火箭 **配置 - 模块 - 右上角 + 号**，粘贴 GitHub 上的订阅地址订阅模块：

     ```text
     https://raw.githubusercontent.com/Yu9191/wloc/refs/heads/main/modules/wloc.module
     ```

   - 回到配置页面，点击你正在使用的配置文件右侧的 **i** 图标，打开 **HTTPS 解密** 和 **MiTM**（步骤较多，网上教程很多但很简单，这里不展开赘述）。
   - 安装快捷指令（<https://www.icloud.com/shortcuts/a82717d8fdad4e6280866fcf911173f7>），安装完毕后，在地图 app 上点击你要定位的地址，点 **分享 - 使用 wloc 设置地理位置**。若成功，重新打开地图 app 可以看到定位已经改变。
3. 全局连接英国的代理 IP（步骤 3 与步骤 2 无严格先后要求）。
4. 插入外卡，点击 **设置 - 蜂窝网络 - 对应 SIM 卡的「无线局域网通话」**，打开 **在 iPhone 上使用无线局域网通话**，等待状态栏出现 Wi-Fi Calling 标志即可。

<!-- TODO：后续补充内容待用户提供 -->
