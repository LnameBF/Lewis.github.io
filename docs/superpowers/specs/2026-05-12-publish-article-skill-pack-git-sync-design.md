# 发布文章技能包 external 模式 git 自动化设计

## 概述

本次增强目标是在 `data/skill-packs/publish-article/` 下的发布文章技能包中，为 `external` 模式增加 git 自动化能力。增强后，`external` 模式将在发布文章前先同步远端 `main` 分支，并在文章创建成功后自动提交并推送到远端 `main`。`current` 模式保持不变，仍然只在本地写文件，不自动 pull、commit 或 push。

本次增强只修改技能包下的 skill 文案和脚本逻辑，不扩展新的 CLI 参数，不处理复杂冲突恢复，不引入自定义分支或自定义 commit message 配置。

## 目标与非目标

### 目标
- 仅在 `external` 模式增加 `git pull origin main`。
- 仅在 `external` 模式增加 git 变更检查。
- 仅在 `external` 模式增加自动 `git add`、`git commit`、`git push origin main`。
- 成功发布后仍输出文章标题、发布状态和发布时间。
- 更新技能包中的 skill 文案与 README，使其准确描述 `external` 模式的新行为。

### 非目标
- 不改变 `current` 模式行为。
- 不新增 `--push`、`--branch`、`--commit-message` 等新参数。
- 不自动处理 merge conflict。
- 不自动 stash / restore 本地改动。
- 不支持自定义远端仓库或自定义推送分支。

## external 模式增强后流程

增强后，`external` 模式固定执行以下流程：

1. 校验环境版本
2. 准备 external 工作目录
3. 校验 external 仓库是否为可用 Fuwari 项目
4. 切换到 external 仓库并执行 `git pull origin main`
5. 抓取文章并生成 Markdown
6. 自动生成 `category` 与 `tags`
7. 执行 `pnpm new-post`
8. 写入 frontmatter 与正文
9. 检查是否存在有效 git 变更
10. 执行 `git add <new-post-file>`
11. 执行 `git commit -m "feat: publish article <title>"`
12. 执行 `git push origin main`
13. 返回成功状态

## current 模式约束

`current` 模式必须保持现状：
- 不自动 pull
- 不自动 commit
- 不自动 push

这样不会影响当前项目内正常开发流程。

## 脚本实现结构

本次增强只修改：
- `data/skill-packs/publish-article/scripts/publish-article-from-url.mjs`
- `data/skill-packs/publish-article/data/skills/publish-article-from-url.md`
- `data/skill-packs/publish-article/README.md`

### 新增函数职责

#### `syncExternalMain(projectRoot)`
职责：
- 确保 external 仓库在可同步状态
- 执行 `git pull origin main`
- 失败时直接抛错并终止后续流程

#### `hasGitChanges(projectRoot)`
职责：
- 检查 external 仓库是否存在实际 git 变更
- 如果没有有效变更，则不允许进入 commit / push 阶段

#### `commitAndPushExternal(projectRoot, title, postPath)`
职责：
1. `git add <postPath>`
2. `git commit -m "feat: publish article <title>"`
3. `git push origin main`

如果任一步失败，则中止流程并将错误抛回主流程。

## commit message 规则

首版统一使用：

```text
feat: publish article <title>
```

如果标题过长，允许在实现中做合理截断，但不引入用户自定义 commit message。

## 异常处理

### external 仓库准备失败
- 直接失败
- 不进入发文逻辑
- 不进入 git 同步逻辑

### `git pull origin main` 失败
- 直接失败
- 不创建文章
- 不 commit
- 不 push

### 文章生成失败
- 删除本次半成品文件
- 不 commit
- 不 push

### 没有有效 git 变更
- 直接失败
- 不 commit
- 不 push

### commit 失败
- 停止流程
- 保留已生成文章文件
- 不 push

### push 失败
- 停止流程
- 保留本地 commit 和文章文件
- 告知用户后续可手动 push

## 成功判定

### current 模式
仍以“文章文件成功生成并写入”为成功标准。

### external 模式
必须同时满足以下条件才算成功：
1. external 仓库准备成功
2. `git pull origin main` 成功
3. 文章创建成功
4. 存在有效 git 变更
5. commit 成功
6. push 成功

## 验证标准

至少验证以下场景：

1. external 模式完整成功
   - pull 成功
   - 创建文章成功
   - commit 成功
   - push 成功

2. pull 失败时中止
   - 不创建文章
   - 不 commit
   - 不 push

3. commit 失败时保留文章文件
   - 本地成果保留
   - 不 push

4. push 失败时保留本地成果
   - 本地 commit 保留
   - 文章文件保留

## 文档更新要求

### skill 文案
`data/skill-packs/publish-article/data/skills/publish-article-from-url.md` 需要补充：
- `external` 模式会在发文前同步远端 `main`
- `external` 模式成功后会自动提交并推送到远端 `main`
- `current` 模式不会自动 push

### README
`data/skill-packs/publish-article/README.md` 需要补充：
- `external` 模式会自动 `git pull origin main`
- `external` 模式会自动 commit 并 push 到 `main`
- 若 pull / commit / push 失败，保留本地成果供人工处理

## 约束与取舍

本次增强只做：
1. external 模式 pull
2. external 模式变更检查
3. external 模式 commit + push
4. skill 与 README 文案同步更新

本次不做：
- push 前人工确认
- 自动处理冲突
- 自定义远端分支
- 自定义 commit message
- 自动回滚本地提交

这样可以把增强控制在“自动发文到 external 仓库”的直接需求范围内，不引入额外复杂度。