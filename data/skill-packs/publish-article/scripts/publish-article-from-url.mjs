import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const REQUIRED_NODE_VERSION = "v24.9.0"
const REQUIRED_NPM_VERSION = "11.6.0"
const REQUIRED_PNPM_VERSION = "9.14.4"
const EXTERNAL_REPO_URL = "git@github.com:LnameBF/Lewis.github.io.git"
const MIN_MARKDOWN_LENGTH = 200
const CODE_BLOCK_SENTINEL = "___PUBLISH_ARTICLE_CODE_BLOCK___"
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, "..")
const EXTERNAL_WORKSPACE = path.join(REPO_ROOT, "data", "skills", "workspaces", "Lewis.github.io")

class PublishError extends Error {
	constructor(message, title = "未识别") {
		super(message)
		this.name = "PublishError"
		this.title = title
	}
}

function formatTimestamp(date = new Date()) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	const hours = String(date.getHours()).padStart(2, "0")
	const minutes = String(date.getMinutes()).padStart(2, "0")
	const seconds = String(date.getSeconds()).padStart(2, "0")

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function printFailure(message, title = "未识别") {
	console.log(`文章标题：${title}`)
	console.log("发布状态：失败")
	console.log(`失败原因：${message}`)
	console.log(`发布时间：${formatTimestamp()}`)
}

function fail(message, title = "未识别") {
	throw new PublishError(message, title)
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

function runShellCommand(command, cwd = REPO_ROOT) {
	const shell = process.platform === "win32" ? "cmd.exe" : "bash"
	const shellArgs = process.platform === "win32" ? ["/d", "/s", "/c", command] : ["-lc", command]

	return execFileSync(shell, shellArgs, {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim()
}

function quoteShellArg(arg) {
	if (!/[\s"']/.test(arg)) {
		return arg
	}

	return `"${arg.replaceAll('"', '\\"')}"`
}

function runCommand(command, args, cwd) {
	const quoted = [command, ...args.map(quoteShellArg)].join(" ")
	return runShellCommand(quoted, cwd)
}

function readCommandVersion(command) {
	return runShellCommand(`${command} --version`).split(/\r?\n/).at(-1) ?? ""
}

function verifyEnvironment() {
	const nodeVersion = process.version
	const npmVersion = readCommandVersion("npm")
	const pnpmVersion = readCommandVersion("pnpm")

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
	return decodeHtml(
		html
			.replace(/<script[\s\S]*?<\/script>/gi, "")
			.replace(/<style[\s\S]*?<\/style>/gi, "")
			.replace(/<[^>]+>/g, " "),
	)
}

function normalizeWhitespace(text) {
	return text
		.replace(/\r/g, "")
		.replace(/\t/g, " ")
		.replace(/[  ]+/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim()
}

function normalizeForMatch(text) {
	return String(text ?? "")
		.toLowerCase()
		.replace(/[？！，。；：“”‘’（）【】《》、,:!?()[\]{}\/+.\-]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
}

function tokenizeForMatch(text) {
	return new Set(normalizeForMatch(text).split(" ").filter(Boolean))
}

function countKeywordMatches(text, keywords) {
	const normalized = normalizeForMatch(text)
	const tokens = tokenizeForMatch(text)

	return keywords.reduce((total, keyword) => {
		const normalizedKeyword = keyword.toLowerCase()
		const isAsciiKeyword = /^[a-z0-9.+-]+$/i.test(normalizedKeyword)

		if (isAsciiKeyword) {
			return total + (tokens.has(normalizedKeyword) ? 1 : 0)
		}

		return total + (normalized.includes(normalizedKeyword) ? 1 : 0)
	}, 0)
}

function htmlToMarkdown(html) {
	const withBlocks = html
		.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n\n")
		.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n\n")
		.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n\n")
		.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
			const lines = stripTags(content)
				.split(/\r?\n/)
				.map((line) => line.trim())
				.filter(Boolean)
				.map((line) => `> ${line}`)
			return `\n${lines.join("\n")}\n\n`
		})
		.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => `\n${CODE_BLOCK_SENTINEL}\n${decodeHtml(code).trim()}\n${CODE_BLOCK_SENTINEL}\n`)
		.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
		.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<a[^>]*href=[\"']([^\"']+)[\"'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
		.replace(/<img[^>]*src=[\"']([^\"']+)[\"'][^>]*alt=[\"']([^\"']*)[\"'][^>]*>/gi, "![$2]($1)")
		.replace(/<img[^>]*alt=[\"']([^\"']*)[\"'][^>]*src=[\"']([^\"']+)[\"'][^>]*>/gi, "![$1]($2)")

	return normalizeWhitespace(stripTags(withBlocks).replace(/^# .*$/m, "")).replaceAll(CODE_BLOCK_SENTINEL, "```")
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
	const markdown = primaryMarkdown.length >= MIN_MARKDOWN_LENGTH ? primaryMarkdown : fallbackMarkdown

	if (markdown.length < MIN_MARKDOWN_LENGTH) {
		fail("抓取到的正文内容过少，无法生成文章", extractedTitle || "未识别")
	}

	return {
		title: extractedTitle,
		markdown,
	}
}

function toSafeFilename(title) {
	return title
		.replace(/[\\/:*?"<>|]/g, " ")
		.replace(/[？！，。；：“”‘’（）【】《》、]/g, " ")
		.replace(/['’]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 80)
}

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

function extractImportantSections(markdown) {
	return markdown
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.slice(0, 12)
		.join("\n")
}

function detectCategory(title, markdown) {
	const importantContent = extractImportantSections(markdown)
	const scores = Object.entries(CATEGORY_RULES).map(([category, keywords]) => {
		const titleScore = countKeywordMatches(title, keywords) * 10
		const importantScore = countKeywordMatches(importantContent, keywords) * 4
		const bodyScore = countKeywordMatches(markdown, keywords)
		return {
			category,
			score: titleScore + importantScore + bodyScore,
		}
	})

	const ranked = scores.sort((left, right) => right.score - left.score)
	const best = ranked[0]
	const second = ranked[1]

	if (!best || best.score <= 0) {
		return summarizeFallbackCategory(title, markdown)
	}

	if (best.score < 2) {
		return summarizeFallbackCategory(title, markdown)
	}

	if (second && best.score - second.score < 2) {
		return summarizeFallbackCategory(title, markdown)
	}

	return best.category
}

function unique(items) {
	return [...new Set(items)]
}

function extractCandidateTags(title, markdown) {
	const importantContent = extractImportantSections(markdown)
	const text = `${title}\n${importantContent}`
	const keywordPool = unique(Object.values(CATEGORY_RULES).flat().concat([
		"Agent",
		"RAG",
		"MCP",
		"LLM",
		"Prompt",
		"MySQL",
		"Redis",
		"Docker",
		"Kubernetes",
		"React",
		"Vue",
		"Node",
		"TypeScript",
		"JavaScript",
		"Skill",
	]))

	return keywordPool.filter((keyword) => {
		const normalizedKeyword = keyword.toLowerCase()
		const isAsciiKeyword = /^[a-z0-9.+-]+$/i.test(normalizedKeyword)
		if (isAsciiKeyword) {
			return tokenizeForMatch(text).has(normalizedKeyword)
		}

		return normalizeForMatch(text).includes(normalizedKeyword)
	})
}

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

	const tags = unique(filtered).slice(0, 3)

	if (tags.length >= 2) {
		return tags
	}

	const fallbacks = category === "AI" ? ["Agent", "RAG"] : [category, "工程实践"]
	return unique([...tags, ...fallbacks]).filter((item) => item !== category || category === "AI").slice(0, 2)
}

function resolvePostPath(projectRoot, filename) {
	return path.join(projectRoot, "src", "content", "posts", `${filename}.md`)
}

function escapeYamlString(value) {
	return value.replaceAll("'", "''")
}

function buildPostContent(title, url, markdown, category, tags) {
	const today = new Date().toISOString().slice(0, 10)
	const fetchedAt = formatTimestamp()
	const renderedTags = tags.map((tag) => `'${escapeYamlString(tag)}'`).join(", ")

	return `---\ntitle: '${escapeYamlString(title)}'\npublished: ${today}\ndescription: ''\nimage: ''\ntags: [${renderedTags}]\ncategory: '${escapeYamlString(category)}'\ndraft: false\nlang: 'zh-CN'\n---\n\n> 原文链接：${url}\n> 抓取时间：${fetchedAt}\n\n${markdown}\n`
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

async function main() {
	const options = parseArgs(process.argv)
	verifyEnvironment()

	const projectRoot = resolveProjectRoot(options.target)
	if (options.target === "current") {
		ensureCurrentProject(projectRoot)
	} else {
		ensureExternalProject(projectRoot)
	}

	const article = await fetchArticle(options.url)
	const finalTitle = options.title || article.title

	if (!finalTitle) {
		fail("无法提取文章标题")
	}

	const category = detectCategory(finalTitle, article.markdown)
	const tags = generateTags(finalTitle, article.markdown, category)
	const safeFilename = toSafeFilename(finalTitle)
	if (!safeFilename) {
		fail("文章标题无法转换为有效文件名", finalTitle)
	}

	const postPath = resolvePostPath(projectRoot, safeFilename)

	try {
		createPost(projectRoot, safeFilename, finalTitle)
		const postContent = buildPostContent(finalTitle, options.url, article.markdown, category, tags)
		writePostFile(postPath, postContent, finalTitle)
		succeed(finalTitle)
	} catch (error) {
		removeFileIfExists(postPath)
		if (error instanceof PublishError) {
			throw error
		}
		fail(error instanceof Error ? error.message : "创建文章失败", finalTitle)
	}
}

try {
	await main()
} catch (error) {
	if (error instanceof PublishError) {
		printFailure(error.message, error.title)
		process.exitCode = 1
	} else {
		const message = error instanceof Error ? error.message : "发生未知错误"
		printFailure(message)
		process.exitCode = 1
	}
}
