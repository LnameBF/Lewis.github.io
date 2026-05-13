# 发布文章技能可拷贝技能包 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static copyable skill pack for the publish-article capability so it can be copied to other devices or shared with other developers.

**Architecture:** The pack lives under `data/skill-packs/publish-article/` and contains only distribution copies, not the runtime source of truth. It includes a README for installation/use, a `package.json` snippet, and copies of the current skill and script files, while leaving the project’s existing `data/skills/` and `scripts/` entrypoints unchanged.

**Tech Stack:** Markdown documentation, JSON snippet, existing Claude Code skill file, existing Node.js `.mjs` publish script

---

## File structure

- Create: `data/skill-packs/publish-article/README.md`
  - Main installation and usage guide for developers/team members.
- Create: `data/skill-packs/publish-article/package.json.snippet`
  - Minimal script snippet to merge into a target project.
- Create: `data/skill-packs/publish-article/data/skills/publish-article-from-url.md`
  - Distribution copy of the current publish skill.
- Create: `data/skill-packs/publish-article/scripts/publish-article-from-url.mjs`
  - Distribution copy of the current publish script.
- Create: `data/2026-5-12/新增发布文章技能包.md`
  - Maintenance record for the new copyable skill pack.

## Task 1: Create the skill-pack directory and copy the runtime files

**Files:**
- Create: `data/skill-packs/publish-article/data/skills/publish-article-from-url.md`
- Create: `data/skill-packs/publish-article/scripts/publish-article-from-url.mjs`
- Test: current source files and copied files

- [ ] **Step 1: Copy the current skill file into the pack**

Source:
```text
data/skills/publish-article-from-url.md
```

Destination:
```text
data/skill-packs/publish-article/data/skills/publish-article-from-url.md
```

- [ ] **Step 2: Copy the current publish script into the pack**

Source:
```text
scripts/publish-article-from-url.mjs
```

Destination:
```text
data/skill-packs/publish-article/scripts/publish-article-from-url.mjs
```

- [ ] **Step 3: Verify the copied files exist**

Run: `ls "data/skill-packs/publish-article/data/skills" && ls "data/skill-packs/publish-article/scripts"`
Expected:
- `publish-article-from-url.md`
- `publish-article-from-url.mjs`

- [ ] **Step 4: Commit**

```bash
git add "data/skill-packs/publish-article/data/skills/publish-article-from-url.md" "data/skill-packs/publish-article/scripts/publish-article-from-url.mjs"
git commit -m "feat: add publish article skill pack files"
```

## Task 2: Add the package.json snippet

**Files:**
- Create: `data/skill-packs/publish-article/package.json.snippet`
- Test: `data/skill-packs/publish-article/package.json.snippet`

- [ ] **Step 1: Create the minimal package snippet**

```json
{
  "scripts": {
    "publish-article": "node scripts/publish-article-from-url.mjs"
  }
}
```

- [ ] **Step 2: Verify the snippet contains only the required script**

Check file content exactly includes:
```json
"publish-article": "node scripts/publish-article-from-url.mjs"
```
Expected: no unrelated scripts or full-package content included.

- [ ] **Step 3: Commit**

```bash
git add "data/skill-packs/publish-article/package.json.snippet"
git commit -m "docs: add publish article package snippet"
```

## Task 3: Write the README for developers and team members

**Files:**
- Create: `data/skill-packs/publish-article/README.md`
- Test: `data/skill-packs/publish-article/README.md`

- [ ] **Step 1: Write the README with the required sections**

Use this structure:

```md
# 发布文章技能包

## 简介
这个技能包用于把文章链接抓取为 Markdown，并在 Fuwari 项目中自动创建文章，同时自动补齐 `category` 和 `tags`。

## 适用项目
仅适用于 Fuwari 项目，且目标项目需要具备：
- `src/content/posts/`
- `pnpm new-post`
- 可修改 `package.json`

## 环境要求
- Node `v24.9.0`
- pnpm `9.14.4`
- npm `11.6.0`

## 安装步骤
1. 复制 `data/skills/publish-article-from-url.md` 到目标项目的 `data/skills/`
2. 复制 `scripts/publish-article-from-url.mjs` 到目标项目的 `scripts/`
3. 将 `package.json.snippet` 中的 script 合并进目标项目 `package.json`
4. 执行 `pnpm install`
5. 确认目标项目满足 Fuwari 结构前提

## 使用方式
```bash
pnpm publish-article "https://example.com/article" --target current
pnpm publish-article "https://example.com/article" --title "自定义标题"
pnpm publish-article "https://example.com/article" --target external
```

## 自动元数据说明
- 自动生成 `category`
- 分类优先从固定分类池中匹配
- 没有合适分类时会回退短分类
- 自动生成 2~3 个 `tags`
- 这些元数据会写入 frontmatter

## external 模式说明
- 默认目标仓库：`git@github.com:LnameBF/Lewis.github.io.git`
- 需要当前设备具备对应 git 权限
- 使用固定工作目录
- 若目标项目不是可用 Fuwari 项目，脚本会尝试初始化

## 常见问题
### 为什么会提示版本不匹配？
因为脚本会严格校验 Node / pnpm / npm 版本。

### 为什么只能用于 Fuwari？
因为依赖 `pnpm new-post` 和 `src/content/posts/` 目录结构。

### 为什么 external 模式失败？
通常是 git 权限不足、clone 失败，或目标仓库不是可用的 Fuwari 项目。

## 分享方式
可以直接压缩整个 `data/skill-packs/publish-article/` 目录后发送给其他设备或其他人使用。

## 同步说明
当主文件 `data/skills/publish-article-from-url.md` 或 `scripts/publish-article-from-url.mjs` 更新后，需要同步更新本技能包中的对应副本。
```

- [ ] **Step 2: Review the README against the spec**

Check that it explicitly covers:
- intro
- applicable project scope
- environment versions
- install steps
- usage examples
- auto category/tags behavior
- external mode limits
- FAQ
- sharing by compressing the pack directory
- sync note for distribution copies

- [ ] **Step 3: Commit**

```bash
git add "data/skill-packs/publish-article/README.md"
git commit -m "docs: add publish article skill pack guide"
```

## Task 4: Add the required maintenance record

**Files:**
- Create: `data/2026-5-12/新增发布文章技能包.md`

- [ ] **Step 1: Create the maintenance record**

```md
# 新增发布文章技能包

- 新增 `data/skill-packs/publish-article/` 目录，作为可拷贝技能包
- 技能包包含 README、`package.json.snippet`、skill 副本和 script 副本
- 技能包用于跨设备使用或分享给其他开发者
- 运行主入口仍然保留在项目原有的 `data/skills/` 和 `scripts/` 中
```

- [ ] **Step 2: Verify the maintenance file exists**

Run: `ls "data/2026-5-12"`
Expected: includes `新增发布文章技能包.md`

- [ ] **Step 3: Commit**

```bash
git add "data/2026-5-12/新增发布文章技能包.md"
git commit -m "docs: record publish article skill pack"
```

## Task 5: Run final verification on the pack structure

**Files:**
- Modify: none
- Test: `data/skill-packs/publish-article/**`

- [ ] **Step 1: Verify the final directory tree exists**

Run: `ls "data/skill-packs/publish-article" && ls "data/skill-packs/publish-article/data/skills" && ls "data/skill-packs/publish-article/scripts"`
Expected:
- root contains `README.md` and `package.json.snippet`
- `data/skills` contains `publish-article-from-url.md`
- `scripts` contains `publish-article-from-url.mjs`

- [ ] **Step 2: Verify the snippet and copied files are readable**

Run: `python - <<'PY'
from pathlib import Path
for p in [
    Path('data/skill-packs/publish-article/README.md'),
    Path('data/skill-packs/publish-article/package.json.snippet'),
    Path('data/skill-packs/publish-article/data/skills/publish-article-from-url.md'),
    Path('data/skill-packs/publish-article/scripts/publish-article-from-url.mjs'),
]:
    print(p, p.exists(), p.stat().st_size)
PY`
Expected: all files exist and sizes are non-zero.

- [ ] **Step 3: Commit**

```bash
git add "data/skill-packs/publish-article" 
git commit -m "feat: package publish article skill for sharing"
```

## Self-review

### Spec coverage
- static pack directory under `data/skill-packs/publish-article/`: Task 1 and Task 5
- README for developers/team members: Task 3
- `package.json.snippet`: Task 2
- skill/script distribution copies: Task 1
- maintenance record: Task 4
- copy-based distribution strategy and sync note: Task 3

### Placeholder scan
- No `TODO`, `TBD`, or “implement later” placeholders remain.
- All created file contents are concrete and complete.
- Verification commands are explicit.

### Type consistency
- Pack path is consistently `data/skill-packs/publish-article/`
- Copied runtime files are consistently `data/skills/publish-article-from-url.md` and `scripts/publish-article-from-url.mjs`
- Snippet script name is consistently `publish-article`
