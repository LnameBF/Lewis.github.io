---
date: 2026-05-15
type: feature
---

## 侧边栏个人信息栏添加站点统计 & 信息页

### 变更内容

- 新增 `getTotalWordCount()` 工具函数 (`src/utils/content-utils.ts`)，使用 `reading-time` 包聚合所有文章字数
- 修改 `Profile.astro` 组件，在社交链接下方新增三项统计数据：
  - **总计字数** - 实时汇总所有文章字数
  - **浏览量** - 占位符，待接入统计工具
  - **当前提交** - 客户端通过 GitHub API 获取最新 commit hash，点击跳转 `/info/` 页面
- 新增 `/info/` 页面 (`src/pages/info.astro`)，展示当前提交详情（短哈希、完整哈希、提交者、日期、消息、完整 JSON 记录）
- 新增 `src/content/spec/info.md` 内容文件，通过 GitHub API 客户端获取并渲染提交信息

### 修改文件

- `src/utils/content-utils.ts` - 新增 `getTotalWordCount` 函数
- `src/components/widget/Profile.astro` - 新增统计区域 UI，提交哈希改为客户端 API 获取并链接到 /info/
- `src/pages/info.astro` - 新增信息页面
- `src/content/spec/info.md` - 新增信息页内容
