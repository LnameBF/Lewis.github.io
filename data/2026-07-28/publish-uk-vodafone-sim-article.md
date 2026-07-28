# 2026-07-28 维护记录

## 文章发布

- **标题**: 英国 Vodafone PayGo 保号卡 - AceSheep
- **来源**: https://blog.acesheep.com/p/sim-card-uk-vodafone/（外部链接抓取）
- **文件名**: `src/content/posts/技巧杂烩/英国-Vodafone-PayGo-保号卡-AceSheep.md`
- **分类**: 技巧杂烩（脚本初判为「后端」，明显不符，手动修正）
- **标签**: Vodafone, 英国, 保号卡, SIM卡（脚本初判为「工程实践」，手动修正）

## 操作摘要

1. 运行 `pnpm publish-article "<url>"` 抓取原文并生成 md，发布成功
2. 脚本自动分类为「后端 / 工程实践」，对 SIM 保号卡文章明显不合适，手动调整：
   - 文件从 `src/content/posts/` 根目录移入 `src/content/posts/技巧杂烩/`（对齐 pyenv 等实操指南的分类约定）
   - frontmatter `category` 改为「技巧杂烩」，`tags` 改为 Vodafone / 英国 / 保号卡 / SIM卡

## 备注

- 文章为外部博客抓取转载，原文链接与抓取时间已由脚本写入正文头部引用块
