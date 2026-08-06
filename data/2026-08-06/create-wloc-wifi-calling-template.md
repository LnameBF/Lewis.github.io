# 2026-08-06 维护记录

## 文章创建（模板）

- **标题**: 利用 wloc 在国行 iOS 26+ 不使用尾插开启 Wi-Fi Calling 的方法
- **来源**: https://www.v2ex.com/t/1229822（V2EX，@Soneleex，iPhone 节点）
- **文件名**: `src/content/posts/iOS26-wloc-WiFi-Calling.md`
- **分类**: 数码（脚本 CATEGORY_RULES 池内无数码/iOS 类目，本应回退「随笔」；按内容主题手动改为「数码」，待用户确认）
- **标签**: iOS, Wi-Fi Calling, wloc（手动选定，脚本 TAG_KEYWORDS 池无 iOS 相关词）

## 操作摘要

1. 用户要求按 V2EX 链接创建文章，并强调「先把模板创建好」，后续再补充其他内容
2. 因 WebFetch 对中文内容误触敏感词过滤（400 报错），改用 `webReader` 抓取，得到标题、正文与元数据
3. 参考 `scripts/publish-article-from-url.mjs` 中的 `buildPostContent` 结构与已有文章 `MCP-plugins-CodeGraph.md` 的 frontmatter 约定，手写模板：
   - 去掉标题里的 `[已成功]` 论坛状态前缀
   - 正文保留「背景 + 操作步骤」结构，4 个主步骤含 wloc 模块订阅地址、快捷指令链接、代理与蜂窝设置
   - 文末留 `<!-- TODO -->` 占位，等待用户补充「其他内容」
4. 未调用 `pnpm publish-article` 脚本：脚本会做版本严格校验并自动 commit/push，用户当前只要模板；手写更可控
5. 未执行 lint / commit：仅新增 markdown，用户未要求提交

## 备注

- 此为模板初稿，正文来自原帖整理；用户后续会告知需要补充的内容
- 分类「数码」为手动判断，若用户偏好其他类目（如「教程」「随笔」）可改 frontmatter 的 `category`
