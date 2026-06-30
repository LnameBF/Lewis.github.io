---
title: 'Chrome DevTools MCP × Claude Code 完整配置指南 - 愤怒的企鹅 - 博客园'
published: 2026-05-26
description: ''
image: ''
tags: ['MCP', 'Agent']
category: 'AI'
draft: false
lang: 'zh-CN'
---

> 原文链接：https://www.cnblogs.com/max/p/19749818
> 抓取时间：2026-05-26 14:18:22

# Chrome DevTools MCP × Claude Code 完整配置指南

> 让 Claude Code（及其他 AI 编码助手）直接操控你的 Chrome 浏览器，
> 包括 复用当前已登录的浏览器 Session ，无需重新打开新窗口。

 

## 目录

 
- [原理概述](#1-%E5%8E%9F%E7%90%86%E6%A6%82%E8%BF%B0)

- [快速安装](#2-%E5%BF%AB%E9%80%9F%E5%AE%89%E8%A3%85)

- [mcp.json 配置方案](#3-mcpjson-%E9%85%8D%E7%BD%AE%E6%96%B9%E6%A1%88)
 
 方案 A：启动全新浏览器（默认）

- 方案 B：复用当前浏览器 Session（推荐）

- 方案 C：通过 remote-debugging-port 连接

- 方案 D：通过 WebSocket 直连

 
 
- [逐步操作：复用现有浏览器 Session](#4-%E9%80%90%E6%AD%A5%E6%93%8D%E4%BD%9C%E5%A4%8D%E7%94%A8%E7%8E%B0%E6%9C%89%E6%B5%8F%E8%A7%88%E5%99%A8-session)
 
 方式一：--autoConnect（Chrome 144+，最简单）

- 方式二：--remote-debugging-port（任意 Chrome 版本）

 
 
- [方案对比](#5-%E6%96%B9%E6%A1%88%E5%AF%B9%E6%AF%94)

- [完整参数参考](#6-%E5%AE%8C%E6%95%B4%E5%8F%82%E6%95%B0%E5%8F%82%E8%80%83)

- [可用工具列表](#7-%E5%8F%AF%E7%94%A8%E5%B7%A5%E5%85%B7%E5%88%97%E8%A1%A8)

- [常见问题](#8-%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)

 
 

## 1. 原理概述

```
Claude Code
 │
 │ MCP (Model Context Protocol)
 ▼
chrome-devtools-mcp server (npx)
 │
 │ Chrome DevTools Protocol (CDP)
 ▼
Chrome 浏览器
```

 chrome-devtools-mcp 是一个 MCP Server，通过 Chrome DevTools Protocol (CDP) 桥接 AI Agent 与 Chrome 浏览器，让 AI 可以：截图、点击、填表、执行 JS、抓取网络请求、做性能分析等。

 

## 2. 快速安装

无需全局安装，直接用 npx 按需运行即可。

```
# 验证可以运行
npx chrome-devtools-mcp@latest --help
```

 

## 3. mcp.json 配置方案

Claude Code 的 MCP 配置文件路径：

 
 
 
 范围 
 路径 
 
 
 
 
 全局 
 ~/.claude.json （在 mcpServers 字段下） 
 
 
 项目级 
 .claude/mcp.json 或 claude.json （项目根目录） 
 
 
 

也可以用命令行添加：

```
claude mcp add --transport stdio chrome-devtools -- npx -y chrome-devtools-mcp@latest
```

 

### 方案 A：启动全新浏览器（默认，最简单）

每次 AI 需要浏览器时，自动启动一个全新的 Chrome 实例。 不能访问你当前的登录状态。 

```
{
 "mcpServers": {
 "chrome-devtools": {
 "command": "npx",
 "args": ["-y", "chrome-devtools-mcp@latest"]
 }
 }
}
```

 

### 方案 B：复用当前浏览器 Session —— --autoConnect （推荐，需 Chrome 144+）

 直接连接你正在使用的 Chrome ，保留所有 Cookie、登录状态、当前打开的页面。

```
{
 "mcpServers": {
 "chrome-devtools": {
 "command": "npx",
 "args": ["-y", "chrome-devtools-mcp@latest", "--autoConnect"]
 }
 }
}
```

> 如果你的 Chrome 版本是 Beta/Canary（144 尚未正式发布时）：

```
{
 "mcpServers": {
 "chrome-devtools": {
 "command": "npx",
 "args": ["-y", "chrome-devtools-mcp@latest", "--autoConnect", "--channel=beta"]
 }
 }
}
```

 

### 方案 C：复用当前浏览器 Session —— --browser-url （任意 Chrome 版本）

适用于已手动启动带调试端口的 Chrome。

```
{
 "mcpServers": {
 "chrome-devtools": {
 "command": "npx",
 "args": [
 "-y",
 "chrome-devtools-mcp@latest",
 "--browser-url=http://127.0.0.1:9222"
 ]
 }
 }
}
```

 

### 方案 D：通过 WebSocket 直连

适合需要鉴权头或精确控制 Tab 的场景。

```
{
 "mcpServers": {
 "chrome-devtools": {
 "command": "npx",
 "args": [
 "-y",
 "chrome-devtools-mcp@latest",
 "--wsEndpoint=ws://127.0.0.1:9222/devtools/browser/ ",
 "--wsHeaders={\"Authorization\":\"Bearer YOUR_TOKEN\"}"
 ]
 }
 }
}
```

> 通过访问 http://127.0.0.1:9222/json/version 获取 webSocketDebuggerUrl 字段。

 

## 4. 逐步操作：复用现有浏览器 Session

### 方式一： --autoConnect （Chrome 144+，最简单推荐）

 第 1 步：确认 Chrome 版本 ≥ 144 

打开 chrome://settings/help 查看版本号。

 第 2 步：在 Chrome 中开启远程调试权限 
 
- 打开 chrome://inspect/#remote-debugging 

- 页面会出现「启用远程调试」的选项，点击允许

 
 第 3 步：配置 Claude Code MCP 

编辑（或创建） ~/.claude.json ，在 mcpServers 中加入：

```
{
 "mcpServers": {
 "chrome-devtools": {
 "command": "npx",
 "args": ["-y", "chrome-devtools-mcp@latest", "--autoConnect"]
 }
 }
}
```

或直接运行命令：

```
claude mcp add --transport stdio chrome-devtools -- \
 npx -y chrome-devtools-mcp@latest --autoConnect
```

 第 4 步：重启 Claude Code 

```
# 重新打开 Claude Code 会话，让 MCP Server 重新加载
```

 第 5 步：首次连接时在 Chrome 中确认授权 

当 Claude 第一次调用浏览器工具时：

 
- Chrome 会弹出 用户确认对话框 → 点击「允许」

- Chrome 顶部会出现横幅： "Chrome is being controlled by automated test software" 

- ✅ 连接成功，AI 现在可以访问你当前所有打开的标签页

 
 

### 方式二： --remote-debugging-port （任意 Chrome 版本）

> ⚠️ Chrome 136+ 限制 ： --remote-debugging-port 不能使用 Chrome 默认 Profile，
> 必须通过 --user-data-dir 指定独立目录。

 第 1 步：用调试端口启动 Chrome 

 关闭已有的 Chrome 进程 ，然后用以下命令启动：

```
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
 --remote-debugging-port=9222 \
 --user-data-dir="$HOME/.chrome-debug-profile"

# Linux
google-chrome \
 --remote-debugging-port=9222 \
 --user-data-dir=/tmp/chrome-debug-profile

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
 --remote-debugging-port=9222 ^
 --user-data-dir="%TEMP%\chrome-debug-profile"
```

> 💡 --user-data-dir 目录会被 Chrome 自动创建，你也可以指向你的现有 Profile 目录（如 ~/Library/Application Support/Google/Chrome/Default ），但 不推荐 （有数据安全风险）。

 第 2 步：验证调试端口已生效 

```
curl http://127.0.0.1:9222/json/version
```

正常返回类似：

```
{
 "Browser": "Chrome/146.0.7680.154",
 "webSocketDebuggerUrl": "ws://127.0.0.1:9222/devtools/browser/abc-123-..."
}
```

 第 3 步：配置 Claude Code MCP 

```
{
 "mcpServers": {
 "chrome-devtools": {
 "command": "npx",
 "args": [
 "-y",
 "chrome-devtools-mcp@latest",
 "--browser-url=http://127.0.0.1:9222"
 ]
 }
 }
}
```

 第 4 步：重启 Claude Code，即可使用 
 

## 5. 方案对比

 
 
 
 对比项 
 方案 A（新浏览器） 
 方案 B（--autoConnect） 
 方案 C（--browser-url） 
 
 
 
 
 是否保留登录状态 
 ❌ 全新 Profile 
 ✅ 完全保留 
 ✅ 保留（取决于 Profile） 
 
 
 Chrome 版本要求 
 任意 
 ≥ 144 
 任意 
 
 
 是否需要重启 Chrome 
 ❌ 不需要 
 ❌ 不需要 
 ⚠️ 需要（加 --remote-debugging-port） 
 
 
 用户授权弹窗 
 ❌ 无 
 ✅ 有（每次连接需确认） 
 ❌ 无 
 
 
 访问当前打开的 Tab 
 ❌ 不能 
 ✅ 能 
 ✅ 能 
 
 
 配置复杂度 
 ⭐ 最简单 
 ⭐⭐ 简单 
 ⭐⭐⭐ 稍复杂 
 
 
 适用场景 
 CI/CD、自动化测试 
 日常开发调试（推荐） 
 老版本 Chrome 或精确控制 
 
 
 
 

## 6. 完整参数参考

### 连接参数

 
 
 
 参数 
 类型 
 说明 
 
 
 
 
 --autoConnect 
 boolean 
 连接当前运行的 Chrome（需 144+），触发用户授权弹窗 
 
 
 --browser-url 
 string 
 指定 Chrome 调试 HTTP 端点，如 http://127.0.0.1:9222 
 
 
 --wsEndpoint 
 string 
 直接指定 WebSocket 端点 
 
 
 --wsHeaders 
 string 
 WebSocket 连接的自定义 HTTP 头（JSON 字符串） 
 
 
 

> 内部逻辑 ：只要提供了 --browser-url 、 --wsEndpoint 或 --autoConnect 任一参数，就会连接已有浏览器；否则自动启动新浏览器。

### 新浏览器启动参数

 
 
 
 参数 
 默认值 
 说明 
 
 
 
 
 --headless 
 false 
 无头模式（无 UI） 
 
 
 --channel 
 stable 
 Chrome 渠道： stable / beta / canary / dev 
 
 
 --isolated 
 false 
 使用临时 Profile（退出后自动删除） 
 
 
 --user-data-dir 
 ~/.cache/chrome-devtools-mcp/... 
 自定义 Profile 目录 
 
 
 --viewport 
 — 
 视窗尺寸，如 1280x720 
 
 
 --executablePath 
 自动检测 
 指定 Chrome 可执行文件路径 
 
 
 --acceptInsecureCerts 
 false 
 忽略 SSL 证书错误 
 
 
 --chromeArg 
 — 
 传递额外的 Chrome 启动参数 
 
 
 

### 功能开关参数

 
 
 
 参数 
 默认值 
 说明 
 
 
 
 
 --slim 
 false 
 精简模式：仅保留 3 个工具（navigate、evaluate_script、screenshot） 
 
 
 --headless 
 false 
 无头运行 
 
 
 --categoryPerformance 
 true 
 启用性能分析工具 
 
 
 --categoryNetwork 
 true 
 启用网络请求工具 
 
 
 --categoryEmulation 
 true 
 启用设备模拟工具 
 
 
 --usageStatistics 
 true 
 是否发送遥测数据到 Google（设为 false 可关闭） 
 
 
 
 

## 7. 可用工具列表

连接成功后，Claude 可使用以下浏览器工具：

 
 
 
 类别 
 工具名 
 功能 
 
 
 
 
 截图/快照 
 take_screenshot 
 截取当前页面截图 
 
 
 截图/快照 
 take_snapshot 
 获取 DOM 快照 
 
 
 导航 
 navigate_page 
 打开/跳转 URL 
 
 
 导航 
 new_page 
 打开新标签页 
 
 
 导航 
 close_page 
 关闭标签页 
 
 
 导航 
 list_pages 
 列出所有标签页 
 
 
 导航 
 select_page 
 切换到指定标签页 
 
 
 交互 
 click 
 点击元素 
 
 
 交互 
 fill 
 填写输入框 
 
 
 交互 
 fill_form 
 批量填写表单 
 
 
 交互 
 type_text 
 模拟键盘输入 
 
 
 交互 
 press_key 
 按下按键 
 
 
 交互 
 hover 
 鼠标悬停 
 
 
 交互 
 drag 
 拖拽操作 
 
 
 交互 
 handle_dialog 
 处理 alert/confirm 弹窗 
 
 
 交互 
 upload_file 
 上传文件 
 
 
 JS 执行 
 evaluate_script 
 在页面上下文执行 JavaScript 
 
 
 调试 
 list_console_messages 
 查看控制台日志 
 
 
 调试 
 get_console_message 
 获取特定控制台消息 
 
 
 调试 
 lighthouse_audit 
 运行 Lighthouse 审计 
 
 
 性能 
 performance_start_trace 
 开始性能录制 
 
 
 性能 
 performance_stop_trace 
 停止性能录制并分析 
 
 
 性能 
 performance_analyze_insight 
 分析性能洞察 
 
 
 性能 
 take_memory_snapshot 
 内存快照 
 
 
 网络 
 list_network_requests 
 列出网络请求 
 
 
 网络 
 get_network_request 
 获取特定请求详情 
 
 
 等待 
 wait_for 
 等待条件满足 
 
 
 
 

## 8. 常见问题

### Q1： --autoConnect 连接后 Chrome 报错「无法连接」？

 原因 ：Chrome 版本低于 144。

 解决 ：升级 Chrome 到 144+，或改用 --browser-url 方式（方案 C）。

 

### Q2： --remote-debugging-port 启动失败，提示「不能使用默认 Profile」？

 原因 ：Chrome 136+ 的安全限制，不允许对默认 Profile 开启远程调试。

 解决 ：必须加 --user-data-dir 参数指定独立目录：

```
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
 --remote-debugging-port=9222 \
 --user-data-dir="$HOME/.chrome-debug-profile"
```

 

### Q3：如何确认 MCP Server 已成功加载？

```
# 查看已注册的 MCP Server
claude mcp list
```

 

### Q4：连接已有 Chrome 后，AI 能看到哪些 Tab？

所有已打开的标签页都能被列出和访问。使用 list_pages 工具可以查看，再用 select_page 切换。

 

### Q5：已有 Chrome 的 Session（Cookie/登录态）会泄露给 AI 吗？

AI 可以读取当前页面内容、执行 JS（包括读取 Cookie），所以 会有访问权限 。每次 --autoConnect 连接时 Chrome 都会弹出用户确认对话框，这是安全防护机制。建议只在可信的开发环境中使用。

 

### Q6：关闭 Google 数据遥测？

```
"args": ["-y", "chrome-devtools-mcp@latest", "--autoConnect", "--usageStatistics=false"]
```

或设置环境变量：

```
export CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS=1
```

 

## 决策树：选择哪种方案？

```
我想连接「我当前正在用的 Chrome」？
│
├── 是 ──→ Chrome 版本 ≥ 144？
│ ├── 是 ──→ 用 --autoConnect（方案 B）✅ 推荐
│ └── 否 ──→ 重启 Chrome 加 --remote-debugging-port
│ 用 --browser-url（方案 C）
│
└── 否，我想要一个干净的新浏览器
 ├── 有 UI ──→ 默认配置（方案 A）
 ├── 无 UI ──→ 加 --headless
 └── 临时用完即删 ──→ 加 --isolated
```

 

## 参考资料

 
- [Chrome DevTools MCP GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)

- [Chrome for Developers Blog: Chrome DevTools for AI Agents](https://developer.chrome.com/blog/chrome-devtools-mcp)

- [Chrome for Developers Blog: Debug Your Browser Session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)

- [Model Context Protocol 官方文档](https://modelcontextprotocol.io)

 

 
 
 踩坑之路多回顾，不要在一个坑掉两次！
THINK TWICE,CODE ONCE!
 
 
 
 
 
 
 
 
 posted @ 
 2026-03-22 00:22 
[愤怒的企鹅](https://www.cnblogs.com/max) 
阅读( 10360 ) 
评论( 0 ) 
 
[收藏](javascript:void(0)) 
[举报](https://report.cnblogs.com?targetLink=https%3A%2F%2Fwww.cnblogs.com%2Fmax%2Fp%2F19749818&targetId=19749818&targetType=0)
 
 
 
 
 
 
 
 
 
 
 [刷新页面](#)[返回顶部](#top)
 
 
 
 
 
 
 
 [
 ![](https://img2024.cnblogs.com/blog/35695/202512/35695-20251205182619157-1150461542.webp)
 
 ](https://ais.cn/u/3Qf22e)
 
 
 
 
 
 
 

 
 
 
 

 
 
 
 

### 公告

 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
[博客园](https://www.cnblogs.com/)
 &copy; 2004-2026 

 
 [ 浙公网安备 33010602011771号](http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010602011771)
 [浙ICP备2021040463号-3](https://beian.miit.gov.cn)
