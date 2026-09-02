---
title: 'CodeGraph 安装与使用指南'
published: 2026-09-02
description: ''
image: ''
tags: ['MCP', 'Agent']
category: 'AI'
draft: false
lang: 'zh-CN'
---

> 原文链接：https://zhuanlan.zhihu.com/p/2044864852875818711
> 抓取时间：2026-09-02 10:47:38

## 一、简介

**CodeGraph** 是一个为 AI 编码代理（Claude Code、Cursor、Codex、Gemini 等）提供**语义代码智能**的本地工具。

核心价值：给 AI 编码助手提供一个**预建的代码知识图谱**，让 AI 不再需要通过大量 grep/read 文件来理解代码结构，从而**降低约 25% 成本、减少约 62% 工具调用**，且完全本地运行。

### 核心功能

| 功能 | 说明 |
| --- | --- |
| 智能上下文构建 | 一次工具调用即可返回入口点、相关符号和代码片段 |
| 全文搜索 | 基于 FTS5 的符号名称即时搜索 |
| 影响分析 | 修改前追踪调用者、被调用者和完整影响范围 |
| 自动同步 | 文件监听器使用原生 OS 事件，代码修改后图谱自动更新 |
| 20+ 语言支持 | TypeScript、Python、Go、Rust、Java、C/C++、Swift 等 |
| 框架路由感知 | 识别 14 种 Web 框架的路由文件，关联 URL 到处理函数 |
| 跨语言桥接 | Swift ↔ ObjC、React Native Bridge、Expo Modules 等 |
| 100% 本地 | 无数据外传，无 API Key，纯 SQLite 数据库 |

---

## 二、安装

### 方式 1：官方安装脚本（需要能访问 GitHub）

```bash
curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh
```

如果 curl 报错或无法解析版本，可以指定版本号：

```bash
CODEGRAPH_VERSION=v0.9.4 sh install.sh
```

### 方式 2：手动下载安装（推荐，适用于网络受限环境）

1. 从 GitHub Releases 下载对应平台的压缩包：
   - Linux x64: `codegraph-linux-x64.tar.gz`
   - macOS arm64: `codegraph-darwin-arm64.tar.gz`
   - macOS x64: `codegraph-darwin-x64.tar.gz`

   下载地址：https://github.com/colbymchenry/codegraph/releases

2. 解压：

```bash
tar -xzf codegraph-linux-x64.tar.gz
```

3. 创建软链接到 PATH 中：

```bash
mkdir -p ~/.local/bin
ln -sf /path/to/codegraph-linux-x64/bin/codegraph ~/.local/bin/codegraph
```

4. 确保 `~/.local/bin` 在 PATH 中（添加到 `~/.bashrc`）：

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

5. 验证安装：

```bash
codegraph --version
# 输出: 0.9.4
```

---

## 三、初始化项目

进入你要分析的代码库目录，执行初始化并建立索引：

```bash
cd /path/to/your-project
codegraph init -i
```

- `init` 会在项目根目录创建 `.codegraph/` 目录
- `-i` 表示同时建立索引（等同于 `init` + `index`）
- 索引数据存储在 `.codegraph/codegraph.db`（SQLite 数据库）

### 工作原理

1. **提取** — 用 tree-sitter 解析源码 AST，提取符号节点和调用边
2. **存储** — 存入本地 SQLite 数据库
3. **解析** — 解析函数调用→定义、import→源文件、类继承等关系
4. **自动同步** — MCP 服务器模式下监听文件变更，增量更新图谱

---

## 四、CLI 常用命令

| 命令 | 用途 |
| --- | --- |
| `codegraph init -i` | 初始化项目并建索引 |
| `codegraph index` | 全量重建索引 |
| `codegraph index --force` | 强制全量重建索引 |
| `codegraph sync` | 增量更新索引 |
| `codegraph status` | 查看索引统计信息 |
| `codegraph query <关键词>` | 搜索符号（函数/类/方法名） |
| `codegraph callers <符号>` | 查找谁调用了这个函数 |
| `codegraph callees <符号>` | 查找这个函数调用了谁 |
| `codegraph impact <符号>` | 分析修改某符号的影响范围 |
| `codegraph context <任务描述>` | 为 AI 构建上下文 |
| `codegraph files` | 查看已索引的文件结构 |
| `codegraph serve --mcp` | 启动 MCP 服务器 |

### 使用示例

```bash
# 搜索某个符号
codegraph query "xxx"

# 查看谁调用了某个函数
codegraph callers "xxx"

# 分析修改某函数的影响
codegraph impact "xxx"

# 为 AI 构建上下文（输出可直接粘贴给 AI）
codegraph context "xxx"
```

---

## 五、作为 MCP 服务器使用（核心用法）

CodeGraph 最强大的用法是作为 **MCP（Model Context Protocol）服务器**，让 AI 编码助手自动调用它来查询代码结构。

### 启动方式

```bash
codegraph serve --mcp
```

> **注意**：执行后终端会“卡住”——这是正常行为。它是一个 stdio 模式的服务进程，等待通过 stdin 接收 JSON-RPC 请求。你不需要手动运行它，AI 客户端会自动管理其生命周期。

### 提供的 MCP 工具

启动后，AI 代理可以调用以下能力：

- `codegraph_query` — 搜索符号
- `codegraph_context` — 为任务构建相关代码上下文
- `codegraph_callers` / `codegraph_callees` — 调用链分析
- `codegraph_impact` — 影响分析

---

## 六、配置到 AI 客户端

### Claude Code

在 `~/.claude.json` 中添加：

```json
{
  "mcpServers": {
    "codegraph": {
      "type": "stdio",
      "command": "/path/to/codegraph-linux-x64/bin/codegraph",
      "args": ["serve", "--mcp"],
      "cwd": "/path/to/your-project"
    }
  }
}
```

### Cursor

在项目根目录创建 `.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "codegraph": {
      "command": "/path/codegraph-linux-x64/bin/codegraph",
      "args": ["serve", "--mcp"]
    }
  }
}
```

### 多项目配置

如果需要同时分析多个代码库，注册多个 MCP 服务器实例：

```json
{
  "mcpServers": {
    "codegraph-xxx": {
      "type": "stdio",
      "command": "/path/to/codegraph-linux-x64/bin/codegraph",
      "args": ["serve", "--mcp"],
      "cwd": "/path/to/your-project"
    },
    "codegraph-xxx": {
      "type": "stdio",
      "command": "/path/to/codegraph-linux-x64/bin/codegraph",
      "args": ["serve", "--mcp"],
      "cwd": "/path/to/your-project"
    }
  }
}
```

---

## 七、完整使用流程示例

```bash
# 1. 克隆代码库
git clone --depth 1 https://github.com/xxx.git
cd xxx

# 2. 初始化 + 索引
codegraph init -i

# 3. 查看索引状态
codegraph status

# 4. 搜索符号
codegraph query "xxx"

# 5. 查看调用关系
codegraph callers "xxx"
codegraph callees "xxx"

# 6. 影响分析
codegraph impact "xxx"

# 7. 为 AI 构建上下文
codegraph context "xxx"

# 8. 启动 MCP 服务器（供 AI 客户端调用）
codegraph serve --mcp
```

---

## 八、注意事项

- **零配置**：不需要写配置文件，语言自动识别
- **自动排除**：`target/`、`node_modules/`、`.git/` 等构建目录自动跳过
- **自动同步**：MCP 服务器模式下会监听文件变更，自动增量更新
- **纯本地**：所有数据存在本地 SQLite，不会外传，无需 API Key
- **轻量级**：codegraph 本身很轻量，多实例运行开销很小

---

## 九、故障排查

| 问题 | 解决方案 |
| --- | --- |
| curl: (48) An unknown option was passed in to libcurl | 系统 curl 版本不兼容，手动下载 tar.gz 安装 |
| could not resolve latest version | 指定版本号：CODEGRAPH_VERSION=v0.9.4 sh install.sh |
| codegraph serve --mcp 卡住 | 正常行为，它是 stdio 服务进程，等待 JSON-RPC 请求 |
| 索引很慢 | 大型项目首次索引需要时间，后续用 sync 增量更新即可 |
| 命令找不到 | 确认 ~/.local/bin 在 PATH 中，或使用完整路径调用 |

---

## 十、支持多分支项目

CodeGraph 的索引是基于**本地文件系统目录**的，不是基于 Git 分支的。所以为不同分支创建独立索引，本质上就是让不同分支的代码存在于**不同的目录**下，然后分别初始化索引。

### 方案一：`git worktree`（推荐）

Git 原生支持将不同分支 checkout 到不同目录，共享同一个 `.git` 仓库，不需要重复 clone：

```bash
# 在主仓库目录下，把 feature-branch 分支 checkout 到另一个目录
git worktree add /xxx/neon-feature ../neon-feature feature-branch

# 然后为这个目录单独初始化 CodeGraph 索引
cd /xxx/neon-feature
codegraph init   # 或者对应的初始化命令
```

这样：

- `/xxx/neon` → main 分支的索引
- `/xxx/neon-feature` → feature-branch 的索引

查询时通过 `projectPath` 参数指定用哪个索引：

```json
{ "projectPath": "/xxx/neon-feature", "task": "..." }
```

### 方案二：多次 clone

直接 clone 多份仓库到不同目录，各自 checkout 不同分支，各自建索引。简单粗暴，但磁盘占用大。

### 方案三：切换分支后重建索引

如果同时只需要分析一个分支，可以：

```bash
git checkout feature-branch
codegraph index  # 重新建索引（覆盖原来的 .codegraph/）
```

缺点是切换分支后必须等索引重建完才能用，不能同时查两个分支。

### 推荐选择

| 场景 | 推荐方案 |
| --- | --- |
| 需要同时对比多个分支 | git worktree |
| 只需要分析当前分支 | 切换分支后重建索引 |
| 分支差异很大，磁盘够用 | 多次 clone |

`git worktree` 是最优解，既不浪费磁盘（共享 `.git` 对象库），又能同时维护多个分支的独立索引。
