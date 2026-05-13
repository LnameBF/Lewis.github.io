# 发布文章 Skill 分类与标签增强 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the publish-article skill so generated posts automatically get one category and two to three tags when the source article does not provide them.

**Architecture:** Keep the enhancement inside `scripts/publish-article-from-url.mjs` so the publish flow remains a single local script. Add one fixed category rule table, one category detector, one tag generator, and update frontmatter rendering so category and tags are written together with the article body.

**Tech Stack:** Node.js 24.9.0, pnpm 9.14.4, existing `pnpm publish-article` CLI, local rule-based keyword extraction, Astro content frontmatter

---

## File structure

- Modify: `scripts/publish-article-from-url.mjs`
  - Add category rules, category detection, tag extraction, and frontmatter rendering changes.
- Modify: `data/skills/publish-article-from-url.md`
  - Document the new auto-generated category and tags behavior.
- Create: `data/2026-5-12/增强发布文章分类和标签.md`
  - Maintenance record required by project memory.

## Task 1: Add category rules and keyword normalization helpers

**Files:**
- Modify: `scripts/publish-article-from-url.mjs:6-40`
- Test: `scripts/publish-article-from-url.mjs`

- [ ] **Step 1: Add the category rule table and shared normalization constants**

```js
const CATEGORY_RULES = {
	AI: ["agent", "rag", "mcp", "llm", "prompt", "大模型", "智能体", "提示词", "模型"],
	后端: ["java", "spring", "golang", "go", "node", "api", "服务", "后端", "接口"],
	前端: ["react", "vue", "javascript", "typescript", "css", "浏览器", "组件", "前端"],
	数据库: ["mysql", "redis", "sql", "索引", "事务", "数据库"],
	运维: ["docker", "k8s", "kubernetes", "ci", "cd", "部署", "监控", "运维"],
	架构: ["架构", "设计模式", "系统设计", "重构", "高可用", "分布式"],
	随笔: ["随笔", "感想", "心得", "总结"],
}

const GENERIC_TAG_BLACKLIST = new Set(["技术", "开发", "教程", "文章", "总结"])
```

- [ ] **Step 2: Add shared text normalization helpers for classification**

```js
function normalizeForMatch(text) {
	return text.toLowerCase().replace(/[？！，。；：“”‘’（）【】《》、,:!?()[\]{}]/g, " ")
}

function countKeywordMatches(text, keywords) {
	const normalized = normalizeForMatch(text)
	return keywords.reduce((total, keyword) => total + (normalized.includes(keyword.toLowerCase()) ? 1 : 0), 0)
}
```

- [ ] **Step 3: Run the existing invalid URL check to verify no regression in argument handling**

Run: `pnpm publish-article not-a-url`
Expected:
- `发布状态：失败`
- `失败原因：文章链接格式无效`

- [ ] **Step 4: Commit**

```bash
git add scripts/publish-article-from-url.mjs
git commit -m "feat: add publish article category rules"
```

## Task 2: Implement category detection with fixed-pool first and fallback summary

**Files:**
- Modify: `scripts/publish-article-from-url.mjs:220-320`
- Test: `scripts/publish-article-from-url.mjs`

- [ ] **Step 1: Add a short fallback summarizer for category generation**

```js
function summarizeFallbackCategory(title, markdown) {
	const source = `${title} ${markdown}`
	const normalized = normalizeForMatch(source)

	if (normalized.includes("工具") || normalized.includes("效率")) {
		return "开发工具"
	}

	if (normalized.includes("优化") || normalized.includes("性能")) {
		return "性能优化"
	}

	if (normalized.includes("实践") || normalized.includes("工程")) {
		return "工程实践"
	}

	return "工程实践"
}
```

- [ ] **Step 2: Add the main category detector**

```js
function detectCategory(title, markdown) {
	const titleScores = Object.entries(CATEGORY_RULES).map(([category, keywords]) => ({
		category,
		score: countKeywordMatches(title, keywords) * 10,
	}))

	const bodyScores = Object.entries(CATEGORY_RULES).map(([category, keywords]) => ({
		category,
		score: countKeywordMatches(markdown, keywords),
	}))

	const combined = new Map()
	for (const item of [...titleScores, ...bodyScores]) {
		combined.set(item.category, (combined.get(item.category) ?? 0) + item.score)
	}

	const ranked = [...combined.entries()].sort((left, right) => right[1] - left[1])
	const [bestCategory, bestScore] = ranked[0] ?? []

	if (!bestCategory || !bestScore) {
		return summarizeFallbackCategory(title, markdown)
	}

	return bestCategory
}
```

- [ ] **Step 3: Add a temporary debug line after article fetch to inspect category selection**

```js
const category = detectCategory(finalTitle, article.markdown)
console.log(`DEBUG_CATEGORY=${category}`)
```

- [ ] **Step 4: Run against the Juejin article to verify AI classification**

Run: `pnpm publish-article "https://juejin.cn/post/7621878684524740671" --target current --title "分类测试文章"`
Expected:
- stdout includes `DEBUG_CATEGORY=AI`
- overall publish succeeds

- [ ] **Step 5: Remove the debug line after verification**

Delete:
```js
console.log(`DEBUG_CATEGORY=${category}`)
```

- [ ] **Step 6: Remove the generated test article file**

Run: `rm "src/content/posts/分类测试文章.md"`
Expected: the temporary verification article is deleted.

- [ ] **Step 7: Commit**

```bash
git add scripts/publish-article-from-url.mjs
git commit -m "feat: detect publish article categories"
```

## Task 3: Implement tag extraction and filtering

**Files:**
- Modify: `scripts/publish-article-from-url.mjs:220-360`
- Test: `scripts/publish-article-from-url.mjs`

- [ ] **Step 1: Add candidate extraction helpers for tags**

```js
function unique(items) {
	return [...new Set(items)]
}

function extractCandidateTags(title, markdown) {
	const text = `${title}\n${markdown}`
	const patterns = [
		/\b[A-Z][A-Za-z0-9.+-]{1,20}\b/g,
		/\b(?:Agent|RAG|MCP|LLM|Prompt|MySQL|Redis|Docker|Kubernetes|React|Vue|Node|TypeScript|JavaScript)\b/gi,
		/[一-鿿]{2,8}/g,
	]

	const values = patterns.flatMap((pattern) => text.match(pattern) ?? [])
	return unique(values.map((item) => item.trim()).filter(Boolean))
}
```

- [ ] **Step 2: Add the tag generator with blacklist and count constraints**

```js
function generateTags(title, markdown, category) {
	const candidates = extractCandidateTags(title, markdown)
	const filtered = candidates.filter((item) => {
		if (!item || item.length > 20) {
			return false
		}

		if (item === category) {
			return false
		}

		if (GENERIC_TAG_BLACKLIST.has(item)) {
			return false
		}

		return true
	})

	const prioritized = filtered.filter((item) => /[A-Za-z]/.test(item)).concat(filtered.filter((item) => !/[A-Za-z]/.test(item)))
	const tags = unique(prioritized).slice(0, 3)

	if (tags.length >= 2) {
		return tags
	}

	const fallbacks = category === "AI" ? ["Agent", "RAG"] : [category, "工程实践"]
	return unique([...tags, ...fallbacks]).filter((item) => item !== category || category === "AI").slice(0, 2)
}
```

- [ ] **Step 3: Add temporary debug lines to inspect tags for the Juejin article**

```js
const tags = generateTags(finalTitle, article.markdown, category)
console.log(`DEBUG_TAGS=${tags.join(",")}`)
```

- [ ] **Step 4: Run against the Juejin article to verify tag quality**

Run: `pnpm publish-article "https://juejin.cn/post/7621878684524740671" --target current --title "标签测试文章"`
Expected:
- stdout includes a `DEBUG_TAGS=` line
- at least 2 tags are present
- tags are not empty and do not contain `技术`, `开发`, `教程`, `文章`, `总结`

- [ ] **Step 5: Remove the debug line after verification**

Delete:
```js
console.log(`DEBUG_TAGS=${tags.join(",")}`)
```

- [ ] **Step 6: Remove the generated test article file**

Run: `rm "src/content/posts/标签测试文章.md"`
Expected: the temporary verification article is deleted.

- [ ] **Step 7: Commit**

```bash
git add scripts/publish-article-from-url.mjs
git commit -m "feat: generate publish article tags"
```

## Task 4: Write category and tags into frontmatter

**Files:**
- Modify: `scripts/publish-article-from-url.mjs:320-420`
- Test: `src/content/posts/分类标签写入测试.md`

- [ ] **Step 1: Update frontmatter rendering to accept category and tags**

```js
function buildPostContent(title, url, markdown, category, tags) {
	const today = new Date().toISOString().slice(0, 10)
	const fetchedAt = formatTimestamp()
	const renderedTags = tags.map((tag) => `'${escapeYamlString(tag)}'`).join(", ")

	return `---\ntitle: '${escapeYamlString(title)}'\npublished: ${today}\ndescription: ''\nimage: ''\ntags: [${renderedTags}]\ncategory: '${escapeYamlString(category)}'\ndraft: false\nlang: 'zh-CN'\n---\n\n> 原文链接：${url}\n> 抓取时间：${fetchedAt}\n\n${markdown}\n`
}
```

- [ ] **Step 2: Pass category and tags through the main flow**

```js
const article = await fetchArticle(options.url)
const finalTitle = options.title || article.title

if (!finalTitle) {
	fail("无法提取文章标题")
}

const category = detectCategory(finalTitle, article.markdown)
const tags = generateTags(finalTitle, article.markdown, category)
```

And update the write call to:

```js
const postContent = buildPostContent(finalTitle, options.url, article.markdown, category, tags)
```

- [ ] **Step 3: Run a full current-mode publish and inspect the file**

Run: `pnpm publish-article "https://juejin.cn/post/7621878684524740671" --target current --title "分类标签写入测试"`
Expected:
- publish succeeds
- file `src/content/posts/分类标签写入测试.md` exists

- [ ] **Step 4: Read the generated file and verify frontmatter contains non-empty category and tags**

Run: `python - <<'PY'
from pathlib import Path
path = Path('src/content/posts/分类标签写入测试.md')
print(path.read_text(encoding='utf-8').split('---')[1])
PY`
Expected:
- `category:` is not empty
- `tags:` contains 2 or 3 values

- [ ] **Step 5: Remove the generated verification article**

Run: `rm "src/content/posts/分类标签写入测试.md"`
Expected: the temporary verification article is deleted.

- [ ] **Step 6: Commit**

```bash
git add scripts/publish-article-from-url.mjs
git commit -m "feat: write publish article categories and tags"
```

## Task 5: Update the user-facing skill description

**Files:**
- Modify: `data/skills/publish-article-from-url.md`
- Test: `data/skills/publish-article-from-url.md`

- [ ] **Step 1: Update the skill description to mention category and tag generation**

Add these points under the execution flow or capability description:

```md
- 自动补齐 `category` 和 `tags`
- 分类优先从固定分类池中匹配
- 若没有合适分类，会自动总结短分类
- 标签会根据文章内容自由生成 2~3 个
```

- [ ] **Step 2: Review the file for consistency with implementation**

Check:
- It still documents `current` / `external`
- It does not promise any new CLI flags that were not implemented
- It now explicitly says category/tags are auto-generated

- [ ] **Step 3: Commit**

```bash
git add data/skills/publish-article-from-url.md
git commit -m "docs: describe publish article category and tag generation"
```

## Task 6: Add the required maintenance record

**Files:**
- Create: `data/2026-5-12/增强发布文章分类和标签.md`

- [ ] **Step 1: Create the maintenance log**

```md
# 增强发布文章分类和标签

- 增强 `scripts/publish-article-from-url.mjs`，在发布文章时自动生成 `category` 和 `tags`
- 分类优先从固定分类池中匹配，未命中时回退为短分类总结
- 标签根据文章标题和正文自由生成 2~3 个
- 将生成的 `category` 和 `tags` 写入 frontmatter
- 同步更新 `data/skills/publish-article-from-url.md`，补充自动分类和标签说明
```

- [ ] **Step 2: Verify the file exists in the correct date folder**

Run: `ls "data/2026-5-12"`
Expected: includes `增强发布文章分类和标签.md`

- [ ] **Step 3: Commit**

```bash
git add "data/2026-5-12/增强发布文章分类和标签.md"
git commit -m "docs: record category and tag enhancement"
```

## Task 7: Run final regression checks

**Files:**
- Modify: none
- Test: `scripts/publish-article-from-url.mjs`, generated temp files, skill doc

- [ ] **Step 1: Re-run invalid URL failure**

Run: `pnpm publish-article invalid-url`
Expected:
- `发布状态：失败`
- `失败原因：文章链接格式无效`

- [ ] **Step 2: Re-run content-too-short failure**

Run: `pnpm publish-article https://example.com --target current`
Expected:
- `发布状态：失败`
- `失败原因：抓取到的正文内容过少，无法生成文章`

- [ ] **Step 3: Run one final successful publish with title override**

Run: `pnpm publish-article "https://juejin.cn/post/7621878684524740671" --target current --title "最终回归测试文章"`
Expected:
- publish succeeds
- generated file contains non-empty category and 2~3 tags

- [ ] **Step 4: Remove the final regression article after inspection**

Run: `rm "src/content/posts/最终回归测试文章.md"`
Expected: the temporary regression article is deleted.

- [ ] **Step 5: Run lint**

Run: `pnpm lint`
Expected: PASS with no required fixes beyond touched files.

- [ ] **Step 6: Commit**

```bash
git add scripts/publish-article-from-url.mjs data/skills/publish-article-from-url.md "data/2026-5-12/增强发布文章分类和标签.md"
git commit -m "feat: enrich publish article metadata"
```

## Self-review

### Spec coverage
- Fixed category pool: Task 1 and Task 2
- Title-first and body fallback classification: Task 2
- Free-summary category fallback: Task 2
- Free tags with 2~3 count: Task 3
- Filtering generic tags: Task 3
- Write category/tags into frontmatter: Task 4
- Skill document update: Task 5
- Maintenance record: Task 6
- Regression verification: Task 7

### Placeholder scan
- No `TODO`, `TBD`, or “implement later” placeholders remain.
- The only dynamic value is the real article URL already chosen in prior verification: `https://juejin.cn/post/7621878684524740671`.
- All code-changing steps include concrete code blocks.

### Type consistency
- Category helper names stay `CATEGORY_RULES`, `detectCategory`, `generateTags`
- Frontmatter writer consistently becomes `buildPostContent(title, url, markdown, category, tags)`
- No new CLI arguments are introduced in the plan
