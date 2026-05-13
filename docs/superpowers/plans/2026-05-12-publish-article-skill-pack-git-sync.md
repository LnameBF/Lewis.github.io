# 发布文章技能包 external 模式 git 自动化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the publish-article skill pack so `external` mode automatically pulls `origin/main`, creates the article, commits it, and pushes it back to `origin/main`, while leaving `current` mode unchanged.

**Architecture:** Keep all git automation inside the packaged script at `data/skill-packs/publish-article/scripts/publish-article-from-url.mjs` and guard it behind the existing `external` mode branch. Update the packaged skill file and packaged README so the copyable bundle accurately describes the new behavior and failure boundaries.

**Tech Stack:** Existing Node.js `.mjs` publish script, packaged Claude Code skill markdown, packaged README markdown, git CLI invoked through the existing shell helper

---

## File structure

- Modify: `data/skill-packs/publish-article/scripts/publish-article-from-url.mjs`
  - Add pull/check/commit/push helpers and wire them into `external` mode only.
- Modify: `data/skill-packs/publish-article/data/skills/publish-article-from-url.md`
  - Document that `external` mode now pulls, commits, and pushes.
- Modify: `data/skill-packs/publish-article/README.md`
  - Document the new `external` mode behavior and failure handling.
- Create: `data/2026-5-12/增强技能包external模式git自动化.md`
  - Maintenance record for this enhancement.

## Task 1: Add external git sync helpers to the packaged script

**Files:**
- Modify: `data/skill-packs/publish-article/scripts/publish-article-from-url.mjs:180-260`
- Test: `data/skill-packs/publish-article/scripts/publish-article-from-url.mjs`

- [ ] **Step 1: Add the pull helper**

```js
function syncExternalMain(projectRoot) {
	runCommand("git", ["pull", "origin", "main"], projectRoot)
}
```

- [ ] **Step 2: Add the git-change detector**

```js
function hasGitChanges(projectRoot) {
	return runCommand("git", ["status", "--short"], projectRoot).trim().length > 0
}
```

- [ ] **Step 3: Add commit-and-push helper with bounded commit title**

```js
function toCommitTitle(title) {
	return title.replace(/\s+/g, " ").trim().slice(0, 60)
}

function commitAndPushExternal(projectRoot, title, postPath) {
	runCommand("git", ["add", postPath], projectRoot)
	runCommand("git", ["commit", "-m", `feat: publish article ${toCommitTitle(title)}`], projectRoot)
	runCommand("git", ["push", "origin", "main"], projectRoot)
}
```

- [ ] **Step 4: Verify the script still rejects invalid URLs before any git work**

Run: `node "data/skill-packs/publish-article/scripts/publish-article-from-url.mjs" not-a-url`
Expected:
- `发布状态：失败`
- `失败原因：文章链接格式无效`

- [ ] **Step 5: Commit**

```bash
git add "data/skill-packs/publish-article/scripts/publish-article-from-url.mjs"
git commit -m "feat: add external git helpers to publish skill pack"
```

## Task 2: Wire pull, change check, commit, and push into external mode only

**Files:**
- Modify: `data/skill-packs/publish-article/scripts/publish-article-from-url.mjs:360-460`
- Test: `data/skill-packs/publish-article/scripts/publish-article-from-url.mjs`

- [ ] **Step 1: Sync `main` immediately after external project preparation**

Update the external branch in the main flow to:

```js
const projectRoot = resolveProjectRoot(options.target)
if (options.target === "current") {
	ensureCurrentProject(projectRoot)
} else {
	ensureExternalProject(projectRoot)
	syncExternalMain(projectRoot)
}
```

- [ ] **Step 2: Guard git automation so `current` mode remains local-only**

After article file writing succeeds, add:

```js
		if (options.target === "external") {
			if (!hasGitChanges(projectRoot)) {
				fail("external 模式未检测到有效 git 变更", finalTitle)
			}

			commitAndPushExternal(projectRoot, finalTitle, postPath)
		}
```

- [ ] **Step 3: Keep article-file cleanup only for generation failures, not git-stage failures**

Restructure the success path into two stages:

```js
		createPost(projectRoot, safeFilename, finalTitle)
		const postContent = buildPostContent(finalTitle, options.url, article.markdown, category, tags)
		writePostFile(postPath, postContent, finalTitle)
	} catch (error) {
		removeFileIfExists(postPath)
		...
	}

	if (options.target === "external") {
		if (!hasGitChanges(projectRoot)) {
			fail("external 模式未检测到有效 git 变更", finalTitle)
		}

		commitAndPushExternal(projectRoot, finalTitle, postPath)
	}

	succeed(finalTitle)
```

This preserves the generated article when commit/push fails.

- [ ] **Step 4: Review the main flow to confirm `current` mode still does not call pull/commit/push**

Check code paths manually:
- `current` mode must only prepare project, create file, write file, return success.
- `external` mode alone should call `syncExternalMain`, `hasGitChanges`, and `commitAndPushExternal`.

Expected: no git automation in the `current` branch.

- [ ] **Step 5: Commit**

```bash
git add "data/skill-packs/publish-article/scripts/publish-article-from-url.mjs"
git commit -m "feat: automate external publish git flow"
```

## Task 3: Update the packaged skill description

**Files:**
- Modify: `data/skill-packs/publish-article/data/skills/publish-article-from-url.md`
- Test: `data/skill-packs/publish-article/data/skills/publish-article-from-url.md`

- [ ] **Step 1: Update the execution flow and behavior notes**

Replace the execution-order section with one that explicitly includes:

```md
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
```

And add behavior notes like:

```md
- `current` 模式只在本地创建文章，不会自动 push
- `external` 模式会自动 `git pull origin main`、commit 和 push
```

- [ ] **Step 2: Review the packaged skill doc for accuracy**

Check:
- it still documents `current` / `external`
- it does not claim git automation for `current`
- it explicitly describes pull/commit/push only for `external`

- [ ] **Step 3: Commit**

```bash
git add "data/skill-packs/publish-article/data/skills/publish-article-from-url.md"
git commit -m "docs: describe external git automation in skill pack"
```

## Task 4: Update the packaged README

**Files:**
- Modify: `data/skill-packs/publish-article/README.md`
- Test: `data/skill-packs/publish-article/README.md`

- [ ] **Step 1: Add `external` git automation details to the README**

In the `external` mode section or a new subsection, add lines covering:

```md
- `external` 模式会在发文前自动执行 `git pull origin main`
- 发文成功后会自动执行 commit 和 `git push origin main`
- 如果 pull 失败，会直接中止，不创建文章
- 如果 commit 或 push 失败，会保留本地成果供人工处理
```

- [ ] **Step 2: Ensure the README still reflects copyable-pack usage**

Check it still covers:
- applicable project scope
- environment requirements
- install steps
- usage examples
- metadata generation
- sharing/sync notes

Expected: the new git automation note is additive, not a rewrite of the pack guide.

- [ ] **Step 3: Commit**

```bash
git add "data/skill-packs/publish-article/README.md"
git commit -m "docs: explain external git automation in skill pack guide"
```

## Task 5: Add the required maintenance record

**Files:**
- Create: `data/2026-5-12/增强技能包external模式git自动化.md`

- [ ] **Step 1: Create the maintenance record**

```md
# 增强技能包 external 模式 git 自动化

- 增强 `data/skill-packs/publish-article/scripts/publish-article-from-url.mjs`
- `external` 模式新增 `git pull origin main`
- `external` 模式新增 git 变更检查、自动 commit 与 `git push origin main`
- `current` 模式保持仅本地创建文章，不自动 push
- 同步更新技能包中的 skill 文案与 README
```

- [ ] **Step 2: Verify the file exists in the date folder**

Run: `ls "data/2026-5-12"`
Expected: includes `增强技能包external模式git自动化.md`

- [ ] **Step 3: Commit**

```bash
git add "data/2026-5-12/增强技能包external模式git自动化.md"
git commit -m "docs: record external git automation enhancement"
```

## Task 6: Run final verification of the packaged behavior and structure

**Files:**
- Modify: none
- Test: `data/skill-packs/publish-article/**`

- [ ] **Step 1: Re-run invalid URL failure against the packaged script**

Run: `node "data/skill-packs/publish-article/scripts/publish-article-from-url.mjs" not-a-url`
Expected:
- `发布状态：失败`
- `失败原因：文章链接格式无效`

- [ ] **Step 2: Verify the packaged documentation files exist and are non-empty**

Run: `python - <<'PY'
from pathlib import Path
for p in [
    Path('data/skill-packs/publish-article/README.md'),
    Path('data/skill-packs/publish-article/data/skills/publish-article-from-url.md'),
    Path('data/skill-packs/publish-article/scripts/publish-article-from-url.mjs'),
]:
    print(p, p.exists(), p.stat().st_size)
PY`
Expected: all files exist and sizes are non-zero.

- [ ] **Step 3: Review packaged script code paths manually for git behavior separation**

Check that:
- `current` mode does not call pull/commit/push
- `external` mode does call pull/check/commit/push
- article generation cleanup still applies only to generation failures

Expected: behavior separation is visible in the packaged script.

- [ ] **Step 4: Commit**

```bash
git add "data/skill-packs/publish-article" "data/2026-5-12/增强技能包external模式git自动化.md"
git commit -m "feat: add external git automation to publish skill pack"
```

## Self-review

### Spec coverage
- external-only git automation: Task 1 and Task 2
- `current` mode unchanged: Task 2 and Task 6
- helper functions for pull/check/commit/push: Task 1
- skill doc update: Task 3
- README update: Task 4
- maintenance record: Task 5

### Placeholder scan
- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Code-changing steps include concrete snippets.
- Verification commands are explicit.

### Type consistency
- helper names are consistently `syncExternalMain`, `hasGitChanges`, `commitAndPushExternal`
- path scope stays under `data/skill-packs/publish-article/`
- git automation is consistently described as `external`-only
