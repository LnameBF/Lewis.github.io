---
title: '从 0 到 1 搭建 AI 知识库：obsidian-wiki 完整实操（保姆级教程）'
published: 2026-07-20
updated: 2026-07-22
description: ''
image: ''
tags: ['知识库', 'RAG', 'Obsidian']
category: 'AI'
draft: false
lang: 'zh-CN'
---

> 原文链接：https://juejin.cn/post/7637823184209494051
> 抓取时间：2026-07-20 11:25:04
> 更新说明：本文已在 2026-07-22 根据 obsidian-wiki 官方 README / PyPI 的最新安装方式校正；原文中的 `npx skills add` 已改为旧方式说明。

从 0 到 1 搭建 AI 知识库：obsidian-wiki 完整实操（保姆级教程）
 

 [ 
 Yue的AI工坊
 ](/user/1618104611770958/posts) 
 2026-05-10
 
 
 2,748
 
 阅读13分钟
 
## 从 0 到 1 搭建 AI 知识库：obsidian-wiki 完整实操（保姆级教程）

> 用 pip 安装 obsidian-wiki，让 Claude Code / Codex 等 AI Agent 自动维护你的私人维基。本文带你从环境准备到日常工作流，把 Karpathy 的 LLM Wiki 模式完整跑通一遍。

### 一、写在前面：你是不是也卡在这里

 我想你大概率有过下面这几种体验：

 
- 同一个问题问了 GPT/Claude 五次 ：每次都得把上下文重新讲一遍，回答还略有出入。

- 写过的代码、踩过的坑全散落在对话里 ： ~/.claude 几个 G 的 JSONL，但你一条都翻不出来。

- Notion / 飞书文档积了几百页 ：写的时候很爽，回头要找一条结论比拷贝粘贴还慢。

- 有 Obsidian vault ：可惜 90% 的页面是「TODO: 之后整理」。

 

这些痛点本质上是同一件事： 知识没有被结构化沉淀，AI 也没有「持续学习你」 。

Andrej Karpathy 在他那条经典的 LLM Wiki gist 里给出过一个朴素方案：

> Compile knowledge once into interconnected markdown files, then let the LLM keep them current.

把知识编译一次，然后让 LLM 帮你维护。今天要讲的 [obsidian-wiki](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2FAr9av%2Fobsidian-wiki)（GitHub 1.1k★，MIT；截至 2026-07-22，PyPI 版本为 2026.7.8）就是这个模式的完整工程化落地。

读完本文你会得到：

 
- ✅ 一个 会自我维护 的本地知识库（Obsidian vault）

- ✅ 一套由 Agent skills 组成的工作流（Claude Code 用 /wiki-ingest、/wiki-query、/wiki-update；Codex 通常用 $wiki-ingest、$wiki-query、$wiki-update）

- ✅ 把 Claude/Codex 历史对话 自动蒸馏 为知识页面的能力

- ✅ 一张 可点击、可上色 的个人知识图谱

 

预计耗时： 30-45 分钟 （其中 ingest 第一份资料的等待大概 5-10 分钟）。

 

### 二、obsidian-wiki 到底是什么

 一句话 ：一组让任意 AI 编程代理都能读懂并执行的 Markdown skill 文件，配合 Obsidian 作为"viewer"，把"读资料 → 抽概念 → 写 wiki 页"的全流程交给 LLM。

它不是一个 Obsidian 插件，也不是一个独立 CLI，而是：

```
obsidian-wiki/
├── .skills/ ← 所有能力的 "权威定义" 
│ ├── wiki-setup/ SKILL .md ← 教 LLM 怎么初始化 vault
│ ├── wiki-ingest/ SKILL .md ← 教 LLM 怎么蒸馏文档
│ ├── wiki-query/ SKILL .md ← 教 LLM 怎么从 wiki 找答案
│ └── ... 13 + 个 skill
├── CLAUDE.md / GEMINI.md / AGENTS.md ← 给不同代理的引导
├── .cursor/rules/ .windsurf/rules/ .kiro/steering/
└── obsidian_wiki/cli.py ← pip 版 CLI，负责 setup / doctor / cache / ast-extract
```

 支持的代理会随版本更新。当前 pip 版 setup 会把 skills 安装到 Claude Code、Codex、Gemini CLI、Hermes、OpenClaw、GitHub Copilot CLI、Trae、Kiro、Pi、通用 `.agents` 等全局目录；项目本地安装还会写入 Claude、Cursor、Windsurf 等目录。本文以 Claude Code 为主线演示，并在关键位置补充 Codex 的写法。

 核心工作原理：四阶段管线 

```
源材料 (markdown / PDF / JSONL / 截图)
 │
 ▼
 [1] Ingest ── 直接读取，不做预处理
 │
 ▼
 [2] Extract ── 抽概念、实体、关系、open questions
 │
 ▼
 [3] Resolve ── 与现有 wiki 合并 / 新建页面
 │
 ▼
 [4] Schema ── 维护 schema 一致性、补 wikilinks
 │
 ▼
 生成 wiki 页面 + 更新 .manifest.json
```

每条声明都会被打上 extracted （直接抽自原文）/ inferred （推断）/ ambiguous （存疑）三类来源标签写入 frontmatter，可追溯性比一般「用 AI 总结」高了一个量级。

 Delta 跟踪 

 .manifest.json 会记录每个 source 的路径、内容 hash、时间戳、对应生成的 wiki 页面。下次再跑 /wiki-ingest 时， 只处理新增 / 修改过的文件 ，不会重复花 token。

 

### 三、准备工作清单

下面这几样在动手之前先确认到位：

| 工具 | 是否必需 | 用途 | 安装方式 |
|---|---|---|---|
| Obsidian | 必需 | 浏览生成的 vault、看图谱 | [obsidian.md](https://link.juejin.cn?target=https%3A%2F%2Fobsidian.md%2F) 官网下载 |
| Python ≥ 3.9 | 必需 | 安装 obsidian-wiki CLI | Windows 推荐用 `py -m pip` |
| AI 代理 | 必需（任选一个） | 真正去执行 skill | 推荐 Claude Code 或 Codex |
| Git | 推荐 | 备份 vault、使用源码安装方式 | 系统自带或包管理器安装 |
| Node.js ≥ 18 | 仅旧安装方式需要 | 运行已 deprecated 的 `npx skills add` | nvm / 官方安装包 |
| QMD | 可选 | 语义搜索 | 后面单独讲 |

 1. 装 Obsidian、新建空 vault 

打开 Obsidian → 「Create new vault」→ 选一个空目录，比如 ~/ObsidianVault 。 记住这个绝对路径 ，下面要用。

 2. 装 Claude Code（其他代理可跳过） 

```
npm install -g @anthropic-ai/claude-code
claude --version # 应该输出版本号 
```

如果你用的是 Cursor / Windsurf / Codex，跳过即可；后面的 `obsidian-wiki setup` 会把 skills 写到对应 Agent 能发现的位置。

 

### 四、安装 obsidian-wiki：推荐 pip + setup

官方现在推荐通过 PyPI 安装 `obsidian-wiki` CLI，再用 `obsidian-wiki setup` 写入全局配置并安装 skills。旧的 `npx skills add Ar9av/obsidian-wiki` 仍可能可用，但已经被标记为 deprecated；它主要安装 Markdown skills，不会完整写入 `~/.obsidian-wiki/config`，也不提供 CLI 的 doctor、cache、AST 提取等能力。

 方式 A：pip 安装（推荐）

Windows 推荐显式使用 `py -m pip`，避免多 Python 版本时把包装到错误环境：

```powershell
py -m pip install -U obsidian-wiki
obsidian-wiki setup --vault "E:\opc\opc_know" --copy
obsidian-wiki doctor
obsidian-wiki info
```

如果 `obsidian-wiki` 提示不是可识别命令，通常是 Python 的 `Scripts` 目录没进 PATH，可以临时改用：

```powershell
py -m obsidian_wiki.cli setup --vault "E:\opc\opc_know" --copy
py -m obsidian_wiki.cli doctor
```

macOS / Linux 写法类似：

```bash
python3 -m pip install -U obsidian-wiki
obsidian-wiki setup --vault "$HOME/ObsidianVault"
obsidian-wiki doctor
obsidian-wiki info
```

`setup` 会做这些事：

- 把内置 skills 安装到支持的全局 Agent 目录，例如 `~/.claude/skills/`、`~/.codex/skills/`、`~/.gemini/skills/` 等。
- 创建 `~/.obsidian-wiki/config`，写入 `OBSIDIAN_VAULT_PATH`，让 Agent 在任意项目目录都能找到 vault。
- 检查 vault 基础结构和必需文件，例如 `index.md`、`log.md`、`hot.md`、`.manifest.json`。
- `--copy` 会复制 skill 文件而不是 symlink，Windows 上更少遇到权限或开发者模式问题。

如果你只使用 Claude Code 和 Codex，多安装到其他 Agent 目录通常没有副作用；不用那些 Agent，它们就不会读取这些 skills。

 方式 B：git clone + setup.sh（源码调试时再用）

如果你想看清楚每一步发生了什么，或者准备改 obsidian-wiki 自身，再考虑源码安装：

```bash
git clone https://github.com/Ar9av/obsidian-wiki.git
cd obsidian-wiki
bash setup.sh
```

 方式 C：npx skills add（旧方式，不推荐新手使用）

```bash
npx skills add Ar9av/obsidian-wiki
```

这条命令更像“只安装 skill 说明书”。如果你后面要长期维护 vault、做增量检查、跑 `doctor`、`cache-check`、`ast-extract`，还是建议切到 pip 版。

 验证安装 

```bash
obsidian-wiki list
obsidian-wiki doctor
obsidian-wiki info
```

也可以检查对应 Agent 的目录：

```bash
ls ~/.claude/skills | grep wiki
ls ~/.codex/skills | grep wiki
```

应该看到至少这些条目：

```text
wiki-setup
wiki-ingest
wiki-query
wiki-update
wiki-history-ingest
wiki-research
wiki-lint
wiki-export
wiki-rebuild
wiki-status
wiki-capture
cross-linker
tag-taxonomy
graph-colorize
```

如果一条都没有，优先跑 `obsidian-wiki doctor` 看是 config、vault 路径，还是 Agent skill 目录没写成功。

 

### 五、配置：.env 与全局 config

 obsidian-wiki 有两份配置文件，作用不同：

 1. ~/.obsidian-wiki/config （全局） 

由 `obsidian-wiki setup` 写入，所有代理共用：

```
OBSIDIAN_VAULT_PATH=/Users/you/ObsidianVault
```

 2. .env （项目级，可覆盖全局） 

模板就是仓库里的 .env.example ，关键字段：

```
 # 必填：你的 Obsidian vault 绝对路径 
OBSIDIAN_VAULT_PATH=/Users/you/ObsidianVault

 # 可选：要 ingest 的源目录（多个用逗号隔开） 
OBSIDIAN_SOURCES_DIR=/Users/you/Documents/Notes,/Users/you/Downloads/Papers

 # 可选：vault 里允许出现的页面分类 
OBSIDIAN_CATEGORIES=concepts,entities,skills,references,synthesis,journal

 # 可选：单次 ingest 最多生成的页面数（防一次跑太久） 
OBSIDIAN_MAX_PAGES_PER_INGEST=15

 # 可选：Claude / Codex 历史目录（留空则自动发现） 
CLAUDE_HISTORY_PATH=
CODEX_HISTORY_PATH=

 # 可选：链接格式 
OBSIDIAN_LINK_FORMAT=wikilink # 或 markdown 

 # 可选：raw 暂存区目录名 
OBSIDIAN_RAW_DIR=_raw

 # 可选（QMD 语义搜索用） 
QMD_WIKI_COLLECTION=wiki
QMD_PAPERS_COLLECTION=papers
QMD_TRANSPORT=mcp # 或 cli
```

新手只填 `OBSIDIAN_VAULT_PATH` 一个就够，其他全部用默认。多项目用户建议在每个项目根目录放自己的 `.env`，这样同一个总 vault 可以区分不同项目的 source。例如：

```env
OBSIDIAN_VAULT_PATH=E:\opc\opc_know
OBSIDIAN_SOURCES_DIR=E:\opc\forum-mini-app-new-ui\data
OBSIDIAN_LINK_FORMAT=wikilink
```

也就是说，`OBSIDIAN_VAULT_PATH` 指向“结果库”，`OBSIDIAN_SOURCES_DIR` 指向“这个项目要摄入的资料/日志目录”。以 `forum-mini-app-new-ui` 为例，可以直接在项目根目录创建 `.env`：

```powershell
cd "E:\opc\forum-mini-app-new-ui"
New-Item -ItemType File -Force .env
```

然后写入：

```env
OBSIDIAN_VAULT_PATH=E:\opc\opc_know
OBSIDIAN_SOURCES_DIR=E:\opc\forum-mini-app-new-ui\data
OBSIDIAN_LINK_FORMAT=wikilink
```

之后在这个项目根目录启动 Agent：

```powershell
cd "E:\opc\forum-mini-app-new-ui"
codex
```

第一次建议先跑：

```text
$wiki-update
$wiki-ingest
```

`$wiki-update` 负责读取项目代码、README、配置和 git log，建立项目概览；`$wiki-ingest` 负责读取 `data` 目录里的维护日志和资料。最终会把结果写入：

```text
E:\opc\opc_know\projects\forum-mini-app-new-ui\
```

后续再增加其它项目时，只要在各自项目根目录放自己的 `.env`，把 `OBSIDIAN_VAULT_PATH` 指向同一个结果库，把 `OBSIDIAN_SOURCES_DIR` 指向该项目的资料目录即可。

 

### 六、第一次启动：让代理把 vault 结构搭起来

打开终端，cd 到你 Obsidian vault 所在的目录、项目目录，或任何工作目录，启动 Claude Code：

```
cd ~/ObsidianVault # 任意目录都行
claude
```

进入对话后， 最简单的入口 ：

```
 > set up my wiki 
```

Claude Code 会自动识别这是 wiki-setup skill 的触发短语并执行。如果你更喜欢显式控制，等价的写法是：

```
 > /wiki-setup 
```

如果你用的是 Codex，直接说自然语言也能触发 skill，例如：

```text
set up my wiki
```

显式调用时，Codex 里更常见的写法是 `$wiki-setup`、`$wiki-ingest`、`$wiki-query` 这一类 `$skill-name` 形式。

执行结束你的 vault 应该长这样：

```
~/ObsidianVault/
├── concepts/ ← 概念页
├── entities/ ← 人物/组织/产品
├── skills/ ← 技能/方法论
├── references/ ← 外部资料引用
├── synthesis/ ← 跨概念综述
├── journal/ ← 日志/时间线
├── projects/ ← 按项目组织的知识
├── _archives/ ← 快照归档（rebuild/restore 用）
├── _raw/ ← 暂存区（草稿、未分类的卡片）
├── _staging/ ← 可选：人工审核队列
├── .obsidian/ ← Obsidian 配置（vault 识别）
├── index.md ← vault 主入口（自动维护）
├── log.md ← ingest 操作日志
├── hot.md ← 近期活动语义快照（~500 字，每次写操作后更新）
└── .manifest.json ← 增量追踪清单
```

 几个关键文件值得打开看一眼 ：

 
- index.md ：vault 的"首页"，按分类列出所有页面，由 ingest 自动维护。

- log.md ：每次 ingest / update 的操作记录，方便追溯哪批资料是什么时候进来的。

- _raw/ ：草稿暂存区，把粗糙的笔记扔进来， /wiki-ingest 会自动提升为正式页面，并把原始草稿移到 `_raw/_archived/`，避免下次重复处理。

 
 

### 七、喂第一份资料： /wiki-ingest 走起

光有空架子没意思。下面把一份真实文档塞进去看效果。

 1. 准备 source 

随便选一份你现成的 markdown 长文，比如一篇技术博客存为 ~/Documents/Notes/llm-rate-limiting.md ，内容假设包含：rate limiting 的几种算法、实践经验、Anthropic API 相关坑等。

 2. 把 source 路径告诉 obsidian-wiki 

最简单的方式是把它扔进 vault 的 _raw/ 目录：

```
 cp ~/Documents/Notes/llm-rate-limiting.md ~/ObsidianVault/_raw/
```

或者在 .env 里设置 OBSIDIAN_SOURCES_DIR 指向源目录。

 3. 跑 ingest 

```
 > /wiki-ingest 
```

Codex 中对应写：

```text
$wiki-ingest
```

Agent 会进入四阶段流程，控制台输出大致长这样：

```
[ 1/4 Ingest ] Reading 1 new source: llm-rate-limiting.md
[ 2/4 Extract ] 12 concepts · 4 entities · 3 open questions
[ 3/4 Resolve ] Created 5 new pages, merged into 2 existing
[ 4/4 Schema ] Schema unchanged. Wikilinks: 23 added, 0 broken
✓ .manifest.json updated
```

打开 Obsidian，左侧文件树刷新一下，你会看到：

```
concepts/
├── token-bucket-algorithm.md
├── leaky-bucket-algorithm.md
├── exponential-backoff.md
└── jitter.md
entities/
└── anthropic-api.md
synthesis/
└── llm-rate-limiting-strategies.md
```

每个页面顶部 frontmatter 大致这样：

```
---
title: Token Bucket Algorithm
category: concepts
sources:
  - _raw/llm-rate-limiting.md
tags: [rate-limiting, algorithms]
provenance:
  extracted: 0.7
  inferred: 0.3
  ambiguous: 0.0
base_confidence: 0.65
lifecycle: draft
created: 2026-05-10
updated: 2026-05-10
---
```

 extracted: 0.7 / inferred: 0.3 的含义是：这一页 70% 来自原文直接抽取，30% 是 LLM 基于语义推断的——出现冲突时你知道该重点核对哪部分。

 4. 让 ingest 真正"增量" 

往 _raw/ 里再扔一个新文件，重跑：

```
 > /wiki-ingest 
```

Codex 中对应写：

```text
$wiki-ingest
```

输出会变成：

```
 [1/4 Ingest] Found 1 changed source (skipped 1 unchanged via .manifest.json)
```

省 token、省时间。

 

### 八、用自然语言查 vault： /wiki-query 

```
 > /wiki-query 我之前调过哪些 Anthropic API 速率限制相关的坑？ 
```

Codex 中对应写：

```text
$wiki-query 我之前调过哪些 Anthropic API 速率限制相关的坑？
```

它的检索是分层的： 先扫所有页面的 title / tags / summary，命中后才打开具体页面读全文 ——大 vault 也跑得动。

输出会附带页面引用，例如：

> 你曾遇到 3 类问题：
> Token bucket 容量设置过小 → 见 [[concepts/token-bucket-algorithm]]
> Retry 没加 jitter 导致雪崩 → 见 [[concepts/jitter]]
> 5xx 重试逻辑混淆 4xx → 见 [[synthesis/llm-rate-limiting-strategies]]

可以 直接在 Obsidian 里点击 那些 wikilink 跳过去。

 

### 九、把当前项目的知识同步进 vault： /wiki-update 

这是日常用得最多的命令之一。设想一个场景：你今天在 ~/projects/my-cool-app 里写了一整天的代码，做了一些架构决策、踩了几个坑。下班前：

```
 cd ~/projects/my-cool-app
claude
> /wiki-update
```

如果你用 Codex，在项目根目录直接写：

```text
$wiki-update
```

 wiki-update 会：

 
- 用 git log 找出今天改动过哪些文件

- 读这些文件 + commit message 提取「新决策 / 新概念 / 新约定」

- 增量写入到 vault 对应分类下

 

注意它 不会把代码原样塞进 vault ，而是只蒸馏出"知识"层面的东西。

 

### 十、让历史对话不再白费： /wiki-history-ingest 

你 ~/.claude 里那几个 G 的 JSONL 才是宝藏。obsidian-wiki 提供了统一入口：

```
 > /wiki-history-ingest claude 
```

Codex 中对应写：

```text
$wiki-history-ingest claude
```

也支持其它代理的历史：

```
 > /wiki-history-ingest codex 
 > /wiki-history-ingest hermes 
 > /wiki-history-ingest openclaw 
 > /wiki-history-ingest copilot 
```

它会：

 
- 自动定位历史目录（也可在 .env 通过 CLAUDE_HISTORY_PATH 显式指定）

- 把多轮对话当作 source 走完整 4 阶段管线

- 抽出来的页面通常落到 synthesis/ 与 concepts/ 

- 同样写入 .manifest.json ，下次只处理新会话

 

> 我自己第一次跑 Claude 历史 ingest 时，1.2 万条 message 大约用了 25 分钟，最终生成 187 个 wiki 页面。最有价值的是 synthesis/ 里那 30 多页综述——把我两年里在 prompt engineering 上踩的每个坑都串起来了。

 

### 十一、自主联网研究： /wiki-research 

如果你 vault 里某个主题信息太薄、想让代理出门补课：

```
 > /wiki-research 量化交易里的市场微结构 
```

Codex 中对应写：

```text
$wiki-research 量化交易里的市场微结构
```

它会：

 
- 多轮 web search（不是一次就完）

- 综合多源、标注引用

- 直接写入 vault 对应分类

- 自动建立 wikilinks 到已有概念

 

跟"让 GPT 给我写一篇综述"的区别在于： 结果是结构化页面 + 可追溯来源 + 自动连接到你已有的知识 ，不是一段你看完就丢的文本。

 

### 十二、维护与质量：定期跑这几条

vault 用一阵子之后会出现断链、孤立页、tag 拼写不一致等问题。obsidian-wiki 有专门的"清洁工"：

```
 > /wiki-status # 总览：摄入了多少、还差多少、最近 delta 
 > /wiki-lint # 检查断链、孤立页、过期内容 
 > /cross-linker # 自动发现 + 补全缺失的 wikilinks 
 > /tag-taxonomy # 统一 tag 词汇（合并 #api 与 #API、#apis） 
```

建议把 /wiki-lint 和 /cross-linker 放进每周一次的习惯里。它们是人工触发的维护动作：先看状态，再清理链接和标签，比让 vault 靠感觉自然增长靠谱得多。

 

### 十三、知识图谱：让 vault 真正"动"起来

 1. 打开 Obsidian 全局图谱 

Obsidian 左侧功能区有个"连接网络"图标；或按 Ctrl/Cmd + P ，输入 Open graph view 。第一次打开你会看到一坨灰色的圆圈和线。

 2. 上色 

```
 > /graph-colorize 
```

它会改写 <vault>/.obsidian/graph.json 的 colorGroups 字段（ 只动颜色，保留你的缩放、物理参数 ），按 tag 或 category 给节点上色，用色盲友好调色板。

刷新图谱，你会看到 concepts / entities / synthesis 一目了然分层。

 3. 导出给外部工具 

```
 > /wiki-export 
```

会在 vault 根目录生成 wiki-export/ ：

```
wiki-export/
├── graph.json ← 通用 JSON
├── graph.graphml ← 给 Gephi / yEd
├── cypher.txt ← 给 Neo4j
└── graph.html ← 一个独立、可点击的浏览器可视化
```

最实用的是 graph.html ——双击打开浏览器就能交互浏览，分享给同事不需要他装 Obsidian。

 

### 十四、可选：开启 QMD 语义搜索

默认情况下 obsidian-wiki 用 grep / glob 找文件——能用，但只能精确字符串匹配。安装 [QMD](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Ftobi%2Fqmd) 后可以走"概念级"语义搜索。

 .env 里启用：

```
QMD_WIKI_COLLECTION=wiki
QMD_PAPERS_COLLECTION=papers
QMD_TRANSPORT=mcp # 或 cli
# 如果用 CLI，还可以按机器性能选择：quality / balanced / fast
QMD_CLI_SEARCH_MODE=quality
```

启用后 /wiki-query 检索质量会显著提升。`QMD_TRANSPORT=mcp` 适合已经把 QMD 接成 MCP 的 Agent；`cli` 模式则会调用本机 `qmd` 命令。如果你在 vault 还小（< 200 页）的阶段，可以先不开。

 

### 十五、一份可执行的日常工作流（强烈推荐）

整理下来，长期用起来大致是这样的节奏：

 每天（5 min） 

```
cd ~/projects/my-cool-app
claude
> /wiki-update # 把今天的新增蒸馏进 vault 
```

Codex 用户则在项目根目录写：

```text
$wiki-update
$wiki-ingest # 如果项目 .env 配了 OBSIDIAN_SOURCES_DIR，就会处理对应资料/日志目录
```

 每周（10-15 min） 

```
 > /wiki-history-ingest claude # 这周和 Claude 聊出来的全部沉淀 
 > /wiki-status # 看看进度 
 > /wiki-lint # 找断链 / 孤立 
 > /cross-linker # 补 wikilinks 
```

 每月（半小时） 

```
 > /tag-taxonomy # 统一 tag 
 > /graph-colorize # 重新上色 
 > /wiki-export # 导出 graph.html，备份并分享 
```

 季度 

```
 > /wiki-rebuild # vault 实在乱了再用，会先归档再重建 
```

 

### 十六、常见问题排查

Q1：在代理里输 /wiki-setup 显示找不到 skill。

检查：

```
obsidian-wiki doctor
obsidian-wiki info
ls ~/.claude/skills/ | grep wiki-setup
ls ~/.codex/skills/ | grep wiki-setup
```

为空的话重新跑：

```bash
obsidian-wiki setup --vault "/path/to/ObsidianVault"
```

Windows 上建议加 `--copy`：

```powershell
obsidian-wiki setup --vault "E:\opc\opc_know" --copy
```

 Q2： /wiki-ingest 跑完没生成任何页面。 

最常见的原因是没指定 source。三种修复方式任选：

 
- 把文件放到 <vault>/_raw/ 

- 在 .env 里设 OBSIDIAN_SOURCES_DIR 

- 直接在对话里说："ingest from /Users/me/Documents/Notes/foo.md "

 

 Q3：环境变量改了但代理像没读到。 

 .env 是项目级覆盖、 ~/.obsidian-wiki/config 是全局。代理读取顺序优先项目 .env 。改完后新开一个 Claude Code / Codex 对话重新加载。

 Q4：ingest 一直在重新处理同一份文件。 

检查 vault 根的 .manifest.json 是否存在并可写。如果你不小心把它 git ignore 后又 rm 了，重置即可。

 Q5：图谱打开还是灰色。 

 /graph-colorize 写的是 <vault>/.obsidian/graph.json ，Obsidian 已打开的话需要关掉再开（或切换到别的 vault 再切回来）。

 Q6：能用 Cursor / Codex 吗？ 

完全可以。pip 版 `setup` 会安装到 `~/.codex/skills/` 等全局目录。Claude Code 通常使用 `/wiki-ingest` 这种斜杠命令；Codex 更常见的显式写法是 `$wiki-ingest`、`$wiki-query`、`$wiki-update`。

 Q7：Windows 上 `obsidian-wiki` 提示不是可识别命令怎么办？

先确认包到底装在哪个 Python：

```powershell
py -m pip show obsidian-wiki
py -m pip --version
python -m pip --version
pip --version
```

如果 `py -m pip` 显示已安装，但 `obsidian-wiki` 找不到，通常是 Python 的 `Scripts` 目录没进 PATH。可以临时用模块入口：

```powershell
py -m obsidian_wiki.cli doctor
py -m obsidian_wiki.cli setup --vault "E:\opc\opc_know" --copy
```

长期修复则把对应 Python 的 `Scripts` 目录加入 PATH，例如 `D:\python\312\Scripts`。

 

### 十七、写在最后：我的几点感受

用了一阵子之后总结：

 
- 它不是替代 Notion / Obsidian ，而是替代你"以后整理"的拖延。蒸馏权交给 LLM，你只管扔原料。

- 价值密度最高的命令其实是 /wiki-history-ingest 。你过去和 AI 的对话比你想象的有用得多。

- .manifest.json 是它最 underrated 的设计 。这种"只处理 delta"的模式让长期使用的成本几乎线性，不会爆炸。

- frontmatter 里的 extracted/inferred 比例是杀手特性 。它强制你直面"AI 编了多少"。

- 它对协作不友好 。当前是个人 vault 设计，团队场景需要自己再套一层 Git PR 流程。

 

如果你已经是 Claude Code / Codex 的重度用户，这是我今年遇到性价比很高的一个 skill 集合。30 分钟装好之后，你会越用 vault 越大、越用越值钱。

> 进一步阅读
> 项目仓库： [Ar9av/obsidian-wiki](https://github.com/Ar9av/obsidian-wiki)
> PyPI： [obsidian-wiki](https://pypi.org/project/obsidian-wiki/)
> Karpathy 的原始 LLM Wiki gist：搜索 "Karpathy LLM Wiki"
> 配套推荐： kepano/obsidian-skills （Bases / Canvas / 高级 markdown 语法）

Happy Coding Yue!
