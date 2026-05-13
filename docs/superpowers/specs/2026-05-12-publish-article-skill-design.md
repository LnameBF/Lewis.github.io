# 发布文章 Skill 设计

## 概述

目标是提供一个“发布文章”技能：输入文章链接，自动抓取网页内容并转换为 Markdown，然后在 Fuwari 项目中执行 `pnpm new-post <filename>` 创建文章并写入内容。该技能支持双模式：默认操作当前仓库，也可切换到固定外部仓库工作区 `data/skills/workspaces/Lewis.github.io`。

对外形态采用单一 skill；内部实现采用一个本地执行脚本承载实际逻辑，以保证可维护性。

## 目标与非目标

### 目标
- 接收文章链接，默认自动提取标题，允许手动覆盖标题。
- 优先抓取正文，失败时退回整页可见文本。
- 将抓取结果转换为 Markdown。
- 根据 `current` / `external` 模式选择目标项目。
- 检查目标项目是否为可用 Fuwari 项目。
- 在 `external` 模式下，必要时 clone 外部仓库并在“不存在或不是 Fuwari 项目”时执行初始化。
- 调用 `pnpm new-post <filename>` 创建文章。
- 用转换后的 Markdown 回填新文章内容。
- 发布完成后输出：文章标题、发布状态、发布时间。

### 非目标
- 不做自动总结、改写、洗稿。
- 不自动生成 tags / category / description 的智能内容。
- 不自动下载图片到本地，仅保留 Markdown 中的远程图片链接。
- 不绕过登录、付费墙或访问权限。
- 不自动执行 git commit / push，除非后续单独扩展。

## 用户接口

### Skill 位置
- `data/skills/publish-article-from-url.md`

### 推荐调用形式
- `发布文章 <url>`
- `发布文章 <url> --target current`
- `发布文章 <url> --target external`
- `发布文章 <url> --title "自定义标题"`
- `发布文章 <url> --target external --title "自定义标题"`

### 参数定义
- `<url>`：必填，文章链接。
- `--target`：可选，默认 `current`。
  - `current`：在当前仓库发布。
  - `external`：在 `data/skills/workspaces/Lewis.github.io` 对应的外部仓库发布。
- `--title`：可选，手动覆盖自动提取标题。

### 标题优先级
1. `--title`
2. 网页自动提取标题
3. 如果仍无法获取标题，则失败，不生成未命名文章

### 输出格式
成功：
- `文章标题：xxx`
- `发布状态：成功`
- `发布时间：YYYY-MM-DD HH:mm:ss`

失败：
- `文章标题：xxx 或 未识别`
- `发布状态：失败`
- `失败原因：xxx`
- `发布时间：YYYY-MM-DD HH:mm:ss`

## 实现结构

### 文件布局
- `data/skills/publish-article-from-url.md`：skill 入口说明与调用协议。
- `scripts/publish-article-from-url.mjs`：实际执行逻辑。
- `data/skills/workspaces/Lewis.github.io`：`external` 模式固定工作区。
- 可选：
  - `data/skills/tmp/`：临时文件。
  - `data/skills/logs/`：发布日志。

### 职责划分
#### Skill 文件
负责：
- 说明触发条件。
- 说明参数格式。
- 约束执行顺序。
- 调用本地脚本。

#### 本地脚本
负责：
- 参数解析。
- 环境与版本检查。
- `current` / `external` 模式判定。
- clone / 初始化 / 项目校验。
- 网页抓取与 Markdown 转换。
- 调用 `pnpm new-post` 并回填内容。
- 输出最终状态。

## 执行流程

1. 解析输入参数。
2. 判定目标模式：`current` 或 `external`。
3. 检查运行环境版本：
   - Node `v24.9.0`
   - pnpm `9.14.4`
   - npm `11.6.0`
4. 准备目标项目。
5. 拉取文章内容。
6. 提取标题并转换 Markdown。
7. 执行 `pnpm new-post <filename>`。
8. 找到新生成文章文件并写入 frontmatter 与正文。
9. 输出结果。

## 双模式规则

### `current` 模式
- 不 clone。
- 不执行 `pnpm create fuwari@latest`。
- 仅校验当前目录是否为可发布的 Fuwari 项目。
- 如果不是，直接失败，并提示切换到正确目录或改用 `external` 模式。

### `external` 模式
- 固定远程仓库地址：`git@github.com:LnameBF/Lewis.github.io.git`
- 固定工作目录：`data/skills/workspaces/Lewis.github.io`
- 如果工作目录不存在，先 clone。
- clone 后如果不是 Fuwari 项目，则执行 `pnpm create fuwari@latest`。
- 准备完成后，检查 `pnpm new-post` 是否可用，再进入发布流程。

## 项目判定规则

目标目录被视为“可用 Fuwari 项目”至少应满足：
- 存在 `package.json`
- `package.json` 中存在 `scripts.new-post`
- 存在 `src/content/posts` 目录

`current` 模式只校验，不自动修复。

## 文件名规则

### 原则
- 文章显示标题保留原始中文标题。
- 文件名由标题生成安全 slug。
- 去除非法文件名字符：`\\ / : * ? " < > |`
- 压缩连续空格，去掉首尾空格。
- 长标题截断到合理范围，例如 80 字符以内。
- 最终文件名建议转为短横线 slug 风格，兼容中英混合标题。

## Markdown 写入规则

### 创建方式
必须先执行：
- `pnpm new-post <filename>`

然后再回填生成的文章文件内容，保持现有项目模板流程不变。

### frontmatter 规则
保留项目默认结构，仅最小修改必要字段：
- `title`：手动标题或网页标题
- `published`：当前日期
- `description`：可留空或取正文前一段
- `image`：空
- `tags`：空数组
- `category`：空字符串
- `draft`：`false`
- `lang`：`zh-CN`

### 正文规则
- 不重复写一级标题。
- 在正文开头插入来源信息：
  - 原文链接
  - 抓取时间
- 后接转换后的 Markdown 正文。

### Markdown 保留目标
尽量保留：
- 标题层级
- 段落
- 列表
- 引用
- 代码块
- 链接
- 图片链接

首版不做：
- 图片本地化
- 自动摘要润色
- 自动标签分类

## 异常处理

### 输入异常
直接失败：
- 缺少 URL
- URL 非法
- `--target` 取值不支持

### 环境异常
直接失败：
- Node / pnpm / npm 版本不匹配
- 当前目录不是 Fuwari 项目
- `external` 模式 clone 失败
- 无权限操作外部仓库
- `pnpm new-post` 不可用

### 抓取异常
- 先尝试正文提取。
- 失败后退回整页文本。
- 如果整页文本仍过少，无法形成文章，则失败。
- 应设置最小内容阈值，避免生成空文章。

### 创建异常
直接失败：
- `pnpm new-post` 执行失败
- 新文章文件找不到
- 文件写入失败

### 半成品处理
如果文章模板已创建但正文写入失败：
- 默认删除本次新建的半成品文件
- 不保留脏状态

## 成功判定

仅当以下条件全部满足时判定为成功：
1. 目标项目检查通过
2. 成功抓取并转换出有效 Markdown 内容
3. `pnpm new-post <filename>` 执行成功
4. 新文章文件已正确写入
5. 最终文件包含可读正文

## 最小测试方案

至少验证以下 6 个场景：
1. `current` 模式正常发文
2. `external` 模式首次运行
3. `external` 模式重复运行
4. 手动覆盖标题
5. 正文抓取失败后退回整页文本
6. 非法链接或无权限页面失败且不留半成品

## 约束与取舍

首版只做“最小可用发布 skill”，不纳入以下能力：
- 自动 git commit / push
- 自动图片本地化
- 自动 tags / category 提取
- 自动摘要润色

这样可以把复杂度控制在可维护范围内，同时满足当前核心目标：从文章链接稳定生成可发布的 Fuwari 文章。