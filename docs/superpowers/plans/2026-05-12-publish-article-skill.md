# 发布文章 Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a publish-article skill that fetches a webpage, converts it to Markdown, creates a Fuwari post with `pnpm new-post`, and writes the article into either the current repo or a fixed external workspace.

**Architecture:** Keep the user-facing behavior in a single skill file under `data/skills/`, but put the real logic in a Node script under `scripts/`. The script will parse CLI args, validate environment and project shape, fetch and convert article content, run the existing post scaffold command, and replace the generated frontmatter/body with normalized Markdown.

**Tech Stack:** Node.js 24.9.0, npm 11.6.0, pnpm 9.14.4, existing `pnpm new-post` script, local Markdown processing in Node, Claude Code skill markdown

---

## File structure

- Create: `data/skills/publish-article-from-url.md`
  - Skill entrypoint, usage contract, and invocation examples.
- Create: `scripts/publish-article-from-url.mjs`
  - Main CLI executor for argument parsing, environment checks, workspace resolution, fetch/convert/write flow, and final status output.
- Modify: `package.json`
  - Add a script alias for the new publisher CLI so the skill can call one stable command.
- Create: `data/skills/logs/.gitkeep`
  - Keep logs directory in repo for publish logs.
- Create: `data/skills/tmp/.gitkeep`
  - Keep temp directory in repo for future transient artifacts.
- Create: `data/2026-5-12/新增发布文章skills.md`
  - Maintenance record required by project memory.

## Task 1: Add the CLI entrypoint in package.json

**Files:**
- Modify: `package.json:4-16`
- Test: `package.json`

- [ ] **Step 1: Add the new script entry**

```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "check": "astro check",
    "build": "astro build && pagefind --site dist",
    "preview": "astro preview",
    "astro": "astro",
    "type-check": "tsc --noEmit --isolatedDeclarations",
    "new-post": "node scripts/new-post.js",
    "publish-article": "node scripts/publish-article-from-url.mjs",
    "format": "biome format --write ./src",
    "lint": "biome check --write ./src",
    "preinstall": "npx only-allow pnpm"
  }
}
```

- [ ] **Step 2: Run the script with no args to verify the entrypoint resolves**

Run: `pnpm publish-article`
Expected: FAIL with a usage or missing-URL error from `scripts/publish-article-from-url.mjs`, not a “Missing script” error.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: add publish article cli entrypoint"
```

## Task 2: Build argument parsing and status output scaffold

**Files:**
- Create: `scripts/publish-article-from-url.mjs`
- Test: `scripts/publish-article-from-url.mjs`

- [ ] **Step 1: Write the failing usage test command**

Run: `pnpm publish-article`
Expected: FAIL because the file does not exist yet.

- [ ] **Step 2: Create the initial CLI file with argument parsing and status helpers**

```js
import process from "node:process"

function formatTimestamp(date = new Date()) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	const hours = String(date.getHours()).padStart(2, "0")
	const minutes = String(date.getMinutes()).padStart(2, "0")
	const seconds = String(date.getSeconds()).padStart(2, "0")

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function fail(message, title = "未识别") {
	console.log(`文章标题：${title}`)
	console.log("发布状态：失败")
	console.log(`失败原因：${message}`)
	console.log(`发布时间：${formatTimestamp()}`)
	process.exit(1)
}

function succeed(title) {
	console.log(`文章标题：${title}`)
	console.log("发布状态：成功")
	console.log(`发布时间：${formatTimestamp()}`)
}

function parseArgs(argv) {
	const args = argv.slice(2)

	if (args.length === 0) {
		fail("未提供文章链接")
	}

	const options = {
		url: "",
		target: "current",
		title: "",
	}

	for (let index = 0; index < args.length; index += 1) {
		const value = args[index]

		if (value === "--target") {
			options.target = args[index + 1] ?? ""
			index += 1
			continue
		}

		if (value === "--title") {
			options.title = args[index + 1] ?? ""
			index += 1
			continue
		}

		if (!options.url) {
			options.url = value
			continue
		}

		fail(`无法识别的参数：${value}`)
	}

	if (!options.url) {
		fail("未提供文章链接")
	}

	if (!["current", "external"].includes(options.target)) {
		fail(`不支持的 target 值：${options.target}`)
	}

	try {
		new URL(options.url)
	} catch {
		fail("文章链接格式无效")
	}

	return options
}

const options = parseArgs(process.argv)

if (!options.url) {
	fail("未提供文章链接")
}

succeed(options.title || "参数解析通过")
```

- [ ] **Step 3: Run with a bad URL to verify validation**

Run: `pnpm publish-article not-a-url`
Expected:
- `文章标题：未识别`
- `发布状态：失败`
- `失败原因：文章链接格式无效`

- [ ] **Step 4: Run with a good URL to verify the scaffold path**

Run: `pnpm publish-article https://example.com`
Expected:
- `文章标题：参数解析通过`
- `发布状态：成功`

- [ ] **Step 5: Commit**

```bash
git add scripts/publish-article-from-url.mjs
git commit -m "feat: add publish article cli scaffold"
```

## Task 3: Add environment checks for Node, npm, and pnpm versions

**Files:**
- Modify: `scripts/publish-article-from-url.mjs`
- Test: `scripts/publish-article-from-url.mjs`

- [ ] **Step 1: Add version check helpers before the main flow**

```js
import { execFileSync } from "node:child_process"

const REQUIRED_NODE_VERSION = "v24.9.0"
const REQUIRED_NPM_VERSION = "11.6.0"
const REQUIRED_PNPM_VERSION = "9.14.4"

function readCommandVersion(command, args) {
	return execFileSync(command, args, { encoding: "utf8" }).trim()
}

function verifyEnvironment() {
	const nodeVersion = process.version
	const npmVersion = readCommandVersion("npm", ["--version"])
	const pnpmVersion = readCommandVersion("pnpm", ["--version"])

	if (nodeVersion !== REQUIRED_NODE_VERSION) {
		fail(`Node 版本不匹配，要求 ${REQUIRED_NODE_VERSION}，当前 ${nodeVersion}`)
	}

	if (npmVersion !== REQUIRED_NPM_VERSION) {
		fail(`npm 版本不匹配，要求 ${REQUIRED_NPM_VERSION}，当前 ${npmVersion}`)
	}

	if (pnpmVersion !== REQUIRED_PNPM_VERSION) {
		fail(`pnpm 版本不匹配，要求 ${REQUIRED_PNPM_VERSION}，当前 ${pnpmVersion}`)
	}
}
```

- [ ] **Step 2: Call the environment check before any repo work**

```js
const options = parseArgs(process.argv)
verifyEnvironment()
succeed(options.title || "参数解析通过")
```

- [ ] **Step 3: Run to verify the current environment behavior**

Run: `pnpm publish-article https://example.com`
Expected: either
- FAIL with one explicit version mismatch message, or
- PASS through this phase if the local environment already matches all required versions.

- [ ] **Step 4: Commit**

```bash
git add scripts/publish-article-from-url.mjs
git commit -m "feat: enforce publish article environment versions"
```

## Task 4: Resolve target workspace and validate Fuwari project shape

**Files:**
- Modify: `scripts/publish-article-from-url.mjs`
- Test: `scripts/publish-article-from-url.mjs`

- [ ] **Step 1: Add repo path and validation helpers**

```js
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, "..")
const EXTERNAL_REPO_URL = "git@github.com:LnameBF/Lewis.github.io.git"
const EXTERNAL_WORKSPACE = path.join(REPO_ROOT, "data", "skills", "workspaces", "Lewis.github.io")

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function isFuwariProject(projectRoot) {
	const packageJsonPath = path.join(projectRoot, "package.json")
	const postsDirectory = path.join(projectRoot, "src", "content", "posts")

	if (!fs.existsSync(packageJsonPath) || !fs.existsSync(postsDirectory)) {
		return false
	}

	const packageJson = readJson(packageJsonPath)
	return typeof packageJson?.scripts?.["new-post"] === "string"
}

function resolveProjectRoot(target) {
	if (target === "current") {
		return REPO_ROOT
	}

	return EXTERNAL_WORKSPACE
}

function ensureCurrentProject(projectRoot) {
	if (!isFuwariProject(projectRoot)) {
		fail("当前目录不是可发布的 Fuwari 项目，请切换到正确目录或改用 --target external")
	}
}
```

- [ ] **Step 2: Wire the current-mode validation into the main flow**

```js
const options = parseArgs(process.argv)
verifyEnvironment()

const projectRoot = resolveProjectRoot(options.target)
if (options.target === "current") {
	ensureCurrentProject(projectRoot)
}

succeed(options.title || "项目检查通过")
```

- [ ] **Step 3: Run current mode to verify project validation passes in this repo**

Run: `pnpm publish-article https://example.com --target current`
Expected:
- `文章标题：项目检查通过`
- `发布状态：成功`

- [ ] **Step 4: Commit**

```bash
git add scripts/publish-article-from-url.mjs
git commit -m "feat: validate publish target project"
```

## Task 5: Add external workspace preparation with clone and initialization decision

**Files:**
- Modify: `scripts/publish-article-from-url.mjs`
- Test: `scripts/publish-article-from-url.mjs`

- [ ] **Step 1: Add command runner and external workspace preparation helpers**

```js
function runCommand(command, args, cwd) {
	return execFileSync(command, args, {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim()
}

function ensureDirectory(directoryPath) {
	fs.mkdirSync(directoryPath, { recursive: true })
}

function cloneExternalWorkspace() {
	ensureDirectory(path.dirname(EXTERNAL_WORKSPACE))
	runCommand("git", ["clone", EXTERNAL_REPO_URL, EXTERNAL_WORKSPACE], REPO_ROOT)
}

function initializeExternalWorkspace(projectRoot) {
	ensureDirectory(projectRoot)
	runCommand("pnpm", ["create", "fuwari@latest"], projectRoot)
}

function ensureExternalProject(projectRoot) {
	if (!fs.existsSync(projectRoot)) {
		cloneExternalWorkspace()
	}

	if (!isFuwariProject(projectRoot)) {
		initializeExternalWorkspace(projectRoot)
	}

	if (!isFuwariProject(projectRoot)) {
		fail("external 模式项目准备失败，pnpm new-post 不可用")
	}
}
```

- [ ] **Step 2: Wire external preparation into the main flow**

```js
const projectRoot = resolveProjectRoot(options.target)
if (options.target === "current") {
	ensureCurrentProject(projectRoot)
} else {
	ensureExternalProject(projectRoot)
}
```

- [ ] **Step 3: Run current mode again to verify the external branch did not break current mode**

Run: `pnpm publish-article https://example.com --target current`
Expected:
- `文章标题：项目检查通过`
- `发布状态：成功`

- [ ] **Step 4: Commit**

```bash
git add scripts/publish-article-from-url.mjs
git commit -m "feat: prepare external publish workspace"
```

## Task 6: Fetch webpage content, extract title, and convert to Markdown

**Files:**
- Modify: `scripts/publish-article-from-url.mjs`
- Test: `scripts/publish-article-from-url.mjs`

- [ ] **Step 1: Add HTML normalization, extraction, and Markdown conversion helpers**

```js
function decodeHtml(text) {
	return text
		.replaceAll("&nbsp;", " ")
		.replaceAll("&amp;", "&")
		.replaceAll("&lt;", "<")
		.replaceAll("&gt;", ">")
		.replaceAll("&quot;", '"')
		.replaceAll("&#39;", "'")
}

function stripTags(html) {
	return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " "))
}

function normalizeWhitespace(text) {
	return text
		.replace(/\r/g, "")
		.replace(/\t/g, " ")
		.replace(/[  ]+/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim()
}

function htmlToMarkdown(html) {
	const withHeadings = html
		.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n\n")
		.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n\n")
		.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n\n")
		.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => `\n${stripTags(content).split("\n").map((line) => line.trim() ? `> ${line.trim()}` : ">" ).join("\n")}\n\n`)
		.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => `\n\
\
${decodeHtml(code).trim()}\n\
\
`)
		.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
		.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
		.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, "![$2]($1)")
		.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/gi, "![$1]($2)")

	return normalizeWhitespace(stripTags(withHeadings)
		.replace(/^# .*$/m, "")
	)
}

function extractTagContent(html, tagName) {
	const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"))
	return match ? normalizeWhitespace(stripTags(match[1])) : ""
}

function extractPrimaryContentHtml(html) {
	const candidates = [
		html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1],
		html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1],
		html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1],
	].filter(Boolean)

	return candidates[0] ?? ""
}

async function fetchArticle(url) {
	const response = await fetch(url)
	if (!response.ok) {
		fail(`页面访问失败：${response.status} ${response.statusText}`)
	}

	const html = await response.text()
	const extractedTitle = extractTagContent(html, "title")
	const primaryHtml = extractPrimaryContentHtml(html)
	const primaryMarkdown = htmlToMarkdown(primaryHtml)
	const fallbackMarkdown = htmlToMarkdown(html)
	const markdown = primaryMarkdown.length >= 200 ? primaryMarkdown : fallbackMarkdown

	if (markdown.length < 200) {
		fail("抓取到的正文内容过少，无法生成文章", extractedTitle || "未识别")
	}

	return {
		title: extractedTitle,
		markdown,
	}
}
```

- [ ] **Step 2: Replace the scaffold success path with article fetch logic**

```js
const article = await fetchArticle(options.url)
const finalTitle = options.title || article.title

if (!finalTitle) {
	fail("无法提取文章标题")
}

succeed(finalTitle)
```

- [ ] **Step 3: Run against a simple public article page**

Run: `pnpm publish-article https://example.com --target current`
Expected: likely FAIL with `抓取到的正文内容过少` because `example.com` is too short, confirming the content threshold works.

- [ ] **Step 4: Run against a real public article page you control or can access**

Run: `pnpm publish-article <real-public-article-url> --target current`
Expected: PASS through fetch and title extraction, even though file creation is not wired yet.

- [ ] **Step 5: Commit**

```bash
git add scripts/publish-article-from-url.mjs
git commit -m "feat: fetch and convert article content"
```

## Task 7: Generate a safe filename and locate the created post file

**Files:**
- Modify: `scripts/publish-article-from-url.mjs`
- Test: `scripts/publish-article-from-url.mjs`

- [ ] **Step 1: Add filename normalization and post path helpers**

```js
function toSafeFilename(title) {
	return title
		.replace(/[\\/:*?"<>|]/g, " ")
		.replace(/['’]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 80)
}

function resolvePostPath(projectRoot, filename) {
	return path.join(projectRoot, "src", "content", "posts", `${filename}.md`)
}
```

- [ ] **Step 2: Add the file path preparation to the main flow**

```js
const article = await fetchArticle(options.url)
const finalTitle = options.title || article.title

if (!finalTitle) {
	fail("无法提取文章标题")
}

const safeFilename = toSafeFilename(finalTitle)
if (!safeFilename) {
	fail("文章标题无法转换为有效文件名", finalTitle)
}

const postPath = resolvePostPath(projectRoot, safeFilename)
```

- [ ] **Step 3: Run with a title override containing special characters**

Run: `pnpm publish-article <real-public-article-url> --title "Claude Code: 发布 / 实践?" --target current`
Expected: the script continues past filename creation without failing on invalid characters.

- [ ] **Step 4: Commit**

```bash
git add scripts/publish-article-from-url.mjs
git commit -m "feat: normalize publish article filenames"
```

## Task 8: Run pnpm new-post and write the final Markdown into the generated file

**Files:**
- Modify: `scripts/publish-article-from-url.mjs`
- Test: `src/content/posts/<generated-file>.md`

- [ ] **Step 1: Add content rendering and post-writing helpers**

```js
function escapeYamlString(value) {
	return value.replaceAll("'", "''")
}

function buildPostContent(title, url, markdown) {
	const today = new Date().toISOString().slice(0, 10)
	const fetchedAt = formatTimestamp()

	return `---
title: '${escapeYamlString(title)}'
published: ${today}
description: ''
image: ''
tags: []
category: ''
draft: false
lang: 'zh-CN'
---

> 原文链接：${url}
> 抓取时间：${fetchedAt}

${markdown}
`
}

function createPost(projectRoot, filename, title) {
	runCommand("pnpm", ["new-post", filename], projectRoot)
	const postPath = resolvePostPath(projectRoot, filename)

	if (!fs.existsSync(postPath)) {
		fail("新文章文件创建后未找到", title)
	}

	return postPath
}

function removeFileIfExists(filePath) {
	if (fs.existsSync(filePath)) {
		fs.rmSync(filePath)
	}
}

function writePostFile(postPath, content, title) {
	fs.writeFileSync(postPath, content, "utf8")
	const written = fs.readFileSync(postPath, "utf8")
	if (!written.includes("> 原文链接：") || written.trim().length < 50) {
		fail("文章内容写入失败", title)
	}
}
```

- [ ] **Step 2: Wire creation and write-back into the main flow**

```js
const article = await fetchArticle(options.url)
const finalTitle = options.title || article.title

if (!finalTitle) {
	fail("无法提取文章标题")
}

const safeFilename = toSafeFilename(finalTitle)
if (!safeFilename) {
	fail("文章标题无法转换为有效文件名", finalTitle)
}

const postPath = resolvePostPath(projectRoot, safeFilename)

try {
	createPost(projectRoot, safeFilename, finalTitle)
	const postContent = buildPostContent(finalTitle, options.url, article.markdown)
	writePostFile(postPath, postContent, finalTitle)
	succeed(finalTitle)
} catch (error) {
	removeFileIfExists(postPath)
	fail(error instanceof Error ? error.message : "创建文章失败", finalTitle)
}
```

- [ ] **Step 3: Run current mode on a real article URL and inspect the generated file**

Run: `pnpm publish-article <real-public-article-url> --target current`
Expected:
- `文章标题：<抓取或覆盖标题>`
- `发布状态：成功`
- A new file exists at `src/content/posts/<safe-filename>.md`
- The file contains frontmatter with `lang: 'zh-CN'` and source metadata block.

- [ ] **Step 4: Read the generated file and verify the body is not empty**

Run: `python - <<'PY'
from pathlib import Path
latest = max(Path('src/content/posts').glob('*.md'), key=lambda p: p.stat().st_mtime)
print(latest)
print(latest.read_text(encoding='utf-8')[:400])
PY`
Expected: shows the newly generated file path and a non-empty markdown preview.

- [ ] **Step 5: Commit**

```bash
git add scripts/publish-article-from-url.mjs src/content/posts/<safe-filename>.md
git commit -m "feat: create posts from article urls"
```

## Task 9: Add the user-facing skill file and stable invocation contract

**Files:**
- Create: `data/skills/publish-article-from-url.md`
- Test: `data/skills/publish-article-from-url.md`

- [ ] **Step 1: Create the skill file**

```md
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
5. 执行 `pnpm publish-article ...`
6. 返回文章标题、发布状态、发布时间

## 命令
```bash
pnpm publish-article "$URL" [--target current|external] [--title "自定义标题"]
```
```

- [ ] **Step 2: Review the skill file for consistency with the spec**

Check:
- location is exactly `data/skills/publish-article-from-url.md`
- `external` repo URL matches the spec
- command uses `pnpm publish-article`
- output promise matches the script behavior

- [ ] **Step 3: Commit**

```bash
git add data/skills/publish-article-from-url.md
git commit -m "feat: add publish article skill contract"
```

## Task 10: Add support directories and maintenance record

**Files:**
- Create: `data/skills/logs/.gitkeep`
- Create: `data/skills/tmp/.gitkeep`
- Create: `data/2026-5-12/新增发布文章skills.md`

- [ ] **Step 1: Create the support directories**

Create empty files:
```text
data/skills/logs/.gitkeep
data/skills/tmp/.gitkeep
```

- [ ] **Step 2: Write the maintenance record**

```md
# 新增发布文章 skills

- 新增 `data/skills/publish-article-from-url.md`，作为“发布文章”技能入口
- 新增 `scripts/publish-article-from-url.mjs`，负责文章抓取、Markdown 转换、项目检查、创建文章与结果输出
- 在 `package.json` 中新增 `pnpm publish-article` 命令
- 新增 `data/skills/workspaces/Lewis.github.io` 作为 external 模式固定工作目录约定
- 新增 `data/skills/logs/` 与 `data/skills/tmp/` 目录占位
- 技能支持 `current` / `external` 双模式，默认自动提取标题，支持 `--title` 覆盖
- 发布成功后统一输出：文章标题、发布状态、发布时间
```

- [ ] **Step 3: Verify the maintenance record exists in the required date folder**

Run: `ls data/2026-5-12`
Expected: includes `新增发布文章skills.md`

- [ ] **Step 4: Commit**

```bash
git add data/skills/logs/.gitkeep data/skills/tmp/.gitkeep data/2026-5-12/新增发布文章skills.md
git commit -m "docs: record publish article skill maintenance"
```

## Task 11: Run final verification for the happy path and failure path

**Files:**
- Modify: none
- Test: `scripts/publish-article-from-url.mjs`, generated post file, skill file

- [ ] **Step 1: Verify invalid URL failure output**

Run: `pnpm publish-article invalid-url`
Expected:
- `发布状态：失败`
- `失败原因：文章链接格式无效`

- [ ] **Step 2: Verify current-mode success on a real article URL**

Run: `pnpm publish-article <real-public-article-url> --target current`
Expected:
- `发布状态：成功`
- new post file created under `src/content/posts/`

- [ ] **Step 3: Verify title override works**

Run: `pnpm publish-article <real-public-article-url> --target current --title "自定义发布标题"`
Expected:
- success output title is `自定义发布标题`
- generated file uses the normalized form of that title

- [ ] **Step 4: Verify fallback cleanup on write failure manually if needed**

If write failure is hard to trigger naturally, temporarily change the script to throw before `writePostFile(...)`, run once, confirm no half-created file remains, then revert before committing.
Expected: no leftover empty markdown file.

- [ ] **Step 5: Run formatting check on the new script**

Run: `pnpm lint`
Expected: PASS or auto-fix only the touched script.

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/publish-article-from-url.mjs data/skills/publish-article-from-url.md data/skills/logs/.gitkeep data/skills/tmp/.gitkeep data/2026-5-12/新增发布文章skills.md src/content/posts/*.md
git commit -m "feat: implement publish article skill"
```

## Self-review

### Spec coverage
- Skill location and invocation contract: Task 9
- Dual-mode current/external workflow: Tasks 4 and 5
- Environment version checks: Task 3
- Fetch正文优先、整页回退: Task 6
- `pnpm new-post` creation and write-back: Task 8
- Success/failure output contract: Task 2 and Task 8
- Maintenance log requirement: Task 10

### Placeholder scan
- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Commands are explicit, and code blocks are concrete.
- The only manual placeholder is `<real-public-article-url>`, which must be supplied at execution time because the plan cannot invent a target URL.

### Type consistency
- Script name is consistently `scripts/publish-article-from-url.mjs`
- package script name is consistently `publish-article`
- target values are consistently `current` and `external`
- external workspace path is consistently `data/skills/workspaces/Lewis.github.io`
