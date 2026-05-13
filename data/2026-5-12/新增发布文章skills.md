# 新增发布文章 skills

- 新增 `data/skills/publish-article-from-url.md`，作为“发布文章”技能入口
- 新增 `scripts/publish-article-from-url.mjs`，负责文章抓取、Markdown 转换、项目检查、创建文章与结果输出
- 在 `package.json` 中新增 `pnpm publish-article` 命令
- 新增 `data/skills/workspaces/Lewis.github.io` 作为 external 模式固定工作目录约定
- 新增 `data/skills/logs/` 与 `data/skills/tmp/` 目录占位
- 技能支持 `current` / `external` 双模式，默认自动提取标题，支持 `--title` 覆盖
- 发布成功后统一输出：文章标题、发布状态、发布时间
