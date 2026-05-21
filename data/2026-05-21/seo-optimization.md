# SEO 优化

## 改动内容

### P0 - 核心优化

1. **补全 og:image / twitter:image**
   - `src/layouts/Layout.astro`: 新增 `image` prop，当有值时输出 `og:image` 和 `twitter:image` meta 标签
   - `src/pages/posts/[...slug].astro`: 传入文章 frontmatter 的 `image` 字段

2. **添加 canonical URL**
   - `src/layouts/Layout.astro`: 每页输出 `<link rel="canonical">`，支持通过 `canonicalUrl` prop 覆盖

3. **完善 description fallback 逻辑**
   - `src/config.ts`: 新增 `description` 字段（站点级 SEO 描述）
   - `src/types/config.ts`: 类型定义中添加 `description?: string`
   - `src/layouts/Layout.astro`: description fallback 优先级改为：页面 description → 站点 description → 站点 subtitle

### P1 - 搜索展示优化

4. **完善文章页 JSON-LD 结构化数据**
   - `src/pages/posts/[...slug].astro`: 补全 `dateModified`、`publisher`、`url`、`image` 字段

5. **首页添加 WebSite JSON-LD**
   - `src/pages/[...page].astro`: 输出 `WebSite` schema 结构化数据

6. **添加 og:locale**
   - `src/layouts/Layout.astro`: 输出 `<meta property="og:locale">`

### P2 - 进阶优化

7. **增加 SEO 相关 frontmatter 字段**
   - `src/content/config.ts`: 新增 `canonicalUrl`（手动指定 canonical URL）和 `robots`（控制 noindex/nofollow）
   - `src/layouts/Layout.astro`: 支持接收并使用这两个 prop

## 涉及文件

- `src/layouts/Layout.astro`
- `src/pages/posts/[...slug].astro`
- `src/pages/[...page].astro`
- `src/config.ts`
- `src/types/config.ts`
- `src/content/config.ts`
