# 2026-08-06 维护记录

## 文章发布

- **标题**: MCP plugins： CodeGraph
- **来源**: https://www.cnblogs.com/tommymarc/p/20562646（博客园，外部链接抓取）
- **文件名**: `src/content/posts/MCP-plugins-CodeGraph.md`
- **分类**: AI（脚本初判，文章讲 CodeGraph 这个 MCP 工具，合理，保留）
- **标签**: MCP, Agent（脚本初判，保留）

## 操作摘要

1. 运行 `pnpm publish-article "<url>"`，脚本报告发布成功，但抓取质量不达标：
   - **标题污染**：`<title>` 含博客园后缀，变成 `MCP plugins： CodeGraph - Tommy_marc - 博客园`
   - **正文噪音**：`extractPrimaryContentHtml` 的 `<article>` 选择器命中博客园整页布局，前约 180 行全是导航/logo/搜索框/菜单，真正的文章正文从第 190 行才开始；表格也被压成纯文本
2. 改用 `webReader` 重新抓取，得到干净正文，但代码块被误转成表格
3. 综合 web_reader 干净正文 + 从原抓取文件还原 4 个代码块（1 段 mermaid 流程图、1 段 TypeScript API 示例、2 段 Agent 提示词），重建文章：
   - 去掉标题里的 `- Tommy_marc - 博客园` 后缀
   - 删除污染文件 `MCP-plugins-CodeGraph-Tommy_marc-博客园.md`
   - 去掉文末博客园「免责声明」（非正文内容）
   - frontmatter 补上 description（取原文副标题）
   - 分类 AI / 标签 MCP, Agent 保留脚本判定

## 备注

- 文章为博客园抓取转载，原文链接与抓取时间保留在正文头部引用块
- 已知限制：脚本的 `extractPrimaryContentHtml` 对博客园页面结构适配不佳，遇到 cnblogs 源时建议直接用 webReader 抓取正文再人工重建代码块
