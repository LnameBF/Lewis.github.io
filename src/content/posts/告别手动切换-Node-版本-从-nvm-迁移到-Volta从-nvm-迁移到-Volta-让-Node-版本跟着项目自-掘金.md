---
title: '告别手动切换 Node 版本：从 nvm 迁移到 Volta从 nvm 迁移到 Volta：让 Node 版本跟着项目自 - 掘金'
published: 2026-05-13
description: ''
image: ''
tags: ['node', '前端', 'Node']
category: '后端'
draft: false
lang: 'zh-CN'
---

> 原文链接：https://juejin.cn/post/7637354393595166730
> 抓取时间：2026-05-13 16:45:07

告别手动切换 Node 版本：从 nvm 迁移到 Volta

## 从 nvm 迁移到 Volta：让 Node 版本跟着项目自动切换

 做前端开发时，多个项目使用不同 Node.js 版本几乎是常态。

比如有的老项目还停留在 Node 14.x，有的项目依赖 Node 16.x，新项目又可能要求 Node 22+。如果每次进入项目都要手动切换版本，不仅麻烦，还很容易忘。

我之前一直使用的是 nvm ，它能解决多版本安装的问题，但版本切换依赖手动执行命令。一旦进入项目后忘记切换 Node 版本，轻则安装依赖报错，重则出现一些很难定位的构建问题。

所以这次我决定把本地 Node 版本管理从 nvm 迁移到 Volta 。

### 为什么选择 Volta

 Volta 也是一个 Node.js 版本管理工具，但它和 nvm 的使用体验不太一样。

它最大的特点是：可以把项目需要的 Node 版本写进 package.json ，之后只要进入项目目录，Volta 就会自动使用项目指定的版本。

也就是说，迁移完成后，基本不需要再记住“这个项目应该用哪个 Node 版本”，工具会替你处理。

### 迁移前准备

在卸载 nvm 之前，建议先查看当前已经安装过哪些 Node 版本：

```
nvm list
```

把仍然需要使用的版本记录下来，比如：

```
14.21.3
16.20.2
22.22.2
```

这些版本后面可以通过 Volta 重新安装。

另外，卸载前最好关闭所有正在运行的 Node 相关进程，避免因为进程占用导致卸载不完整。

### 卸载 nvm

先关闭 nvm 对 Node 的管理：

```
nvm off
```

然后在 Windows 中卸载 NVM for Windows ：

```
Windows 设置 -> 应用 -> 已安装的应用 -> NVM for Windows -> 卸载
```

卸载完成后，可以重新打开一个 PowerShell，确认 nvm 已经不可用。

```
nvm version
```

如果命令不存在，说明 nvm 已经卸载完成。

### 安装 Volta

在 PowerShell 中执行：

```
winget install Volta.Volta
```

安装完成后，重新打开终端，让环境变量生效。

可以通过下面的命令确认 Volta 是否安装成功：

```
volta --version
```

### 设置默认 Node 版本

先安装一个较新的 Node.js 版本作为全局默认版本。

例如我这里使用的是：

```
volta install node@22.22.2
```

安装完成后，可以检查当前默认版本：

```
node -v
```

后续如果想修改默认 Node 版本，也继续使用 volta install ：

```
volta install node@新版本
```

需要注意的是，这里的默认版本主要影响没有单独配置 Node 版本的目录。

### 为项目指定 Node 版本

进入某个项目目录，然后使用 volta pin 指定该项目需要的 Node 版本。

例如某个老项目需要 Node 14：

```
cd D:\project\old-app
volta pin node@14.21.3
```

执行完成后，项目的 package.json 中会自动新增一个 volta 字段：

```
 { 
 "volta" : { 
 "node" : "14.21.3" 
 } 
 } 
```

之后只要在这个项目目录中执行：

```
node -v
```

Volta 就会自动使用项目指定的 Node 版本。

这也是我从 nvm 迁移到 Volta 的主要原因：版本跟项目绑定，而不是靠人脑记忆。

### 查看已安装版本

可以使用下面的命令查看 Volta 当前管理的工具和版本：

```
volta list all
```

如果某个项目 pin 了一个本地还没有安装过的 Node 版本，Volta 会在需要时自动处理对应版本。

### 全局包怎么安装

迁移到 Volta 后，全局包不建议再使用：

```
npm install -g 包名
```

更推荐使用：

```
volta install 包名
```

例如：

```
volta install pnpm
volta install yarn
```

这样安装的全局工具会由 Volta 管理，行为更稳定，也不会被当前项目的 Node 版本影响。

如果想安装指定版本：

```
volta install 包名@版本
```

例如：

```
volta install pnpm@9.15.0
```

### 项目内的包管理器版本

项目内安装依赖时，仍然使用项目自己的包管理工具，比如：

```
npm install
yarn install
pnpm install
```

如果某个项目对包管理器版本也有要求，可以同样通过 volta pin 固定。

例如固定 Yarn 版本：

```
volta pin yarn@1.22.22
```

执行后， package.json 中的 volta 字段会变成类似这样：

```
 { 
 "volta" : { 
 "node" : "14.21.3" , 
 "yarn" : "1.22.22" 
 } 
 } 
```

这样团队成员拉取代码后，也能使用一致的 Node 和包管理器版本。

### 迁移后的体验

迁移完成后，我最明显的感受是：不用再频繁思考 Node 版本了。

以前进入项目后，第一反应是：

```
nvm use 14.21.3
```

现在只需要进入项目目录，Volta 会自动根据 package.json 中的配置切换版本。

对同时维护多个新老项目的人来说，这个体验提升还是很明显的。

### 总结

这次从 nvm 迁移到 Volta ，核心流程其实很简单：

 
- 记录原来 nvm 中需要保留的 Node 版本

- 卸载 NVM for Windows 

- 安装 Volta 

- 使用 volta install 设置默认 Node 版本

- 在项目中使用 volta pin 固定 Node 版本

- 使用 volta install 管理全局工具

 

如果你也经常在多个前端项目之间切换，尤其是项目 Node 版本差异比较大，Volta 会比手动切换版本省心很多。

它不只是“安装多个 Node 版本”，更重要的是把版本管理这件事从个人习惯变成项目配置。
