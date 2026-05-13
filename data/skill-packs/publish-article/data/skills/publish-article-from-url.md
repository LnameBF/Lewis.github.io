# 发布文章

当用户提到“发布文章”或提供文章链接准备生成博客文章时，使用这个 skill。

## 前提
- 当前环境必须满足：Node `v24.9.0`、pnpm `9.14.4`、npm `11.6.0`
- `external` 模式固定目标仓库：`git@github.com:LnameBF/Lewis.github.io.git`
- `external` 模式固定工作目录：`data/skills/workspaces/Lewis.github.io`

## 用法
- `发布文章 <url>`
- `发布文章 <url> --target current`
- `发布文章 <url> --target external`
- `发布文章 <url> --title "自定义标题"`

## 执行顺序
1. 解析链接与可选参数
2. 校验环境版本
3. 校验或准备目标 Fuwari 项目
4. 抓取正文并转换为 Markdown
5. 自动补齐 `category` 和 `tags`
6. 执行 `pnpm publish-article ...`
7. `external` 模式下自动同步远端 `main`
8. `external` 模式下成功后自动提交并推送到远端 `main`
9. 返回文章标题、发布状态、发布时间

## 自动元数据规则
- 分类优先从固定分类池中匹配
- 若没有合适分类，会自动总结短分类
- 标签会根据文章内容自由生成 2~3 个
- 生成结果会写入 frontmatter

## 模式行为
- `current` 模式只在本地创建文章，不会自动 push
- `external` 模式会自动 `git pull origin main`、commit 和 push

## 命令
```bash
pnpm publish-article "$URL" [--target current|external] [--title "自定义标题"]
```
