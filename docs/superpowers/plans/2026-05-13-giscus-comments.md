# Giscus Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Giscus-powered comments section to post detail pages only, using centralized configuration and pathname-based discussion mapping.

**Architecture:** Keep Giscus integration isolated in a dedicated component and a dedicated config module. The article page will import the component and render it between the license block and prev/next navigation, while the component reads all widget settings from the centralized comment config.

**Tech Stack:** Astro 5, TypeScript, Giscus embed script, existing Fuwari layouts/components, pnpm

---

## File structure

- `src/config/comment.ts`
  - New centralized Giscus configuration surface
- `src/components/misc/Giscus.astro`
  - New reusable component that renders the Giscus widget from config
- `src/pages/posts/[...slug].astro`
  - Add the Giscus block in the approved position
- `data/2026-5-13/评论功能.md`
  - Maintenance note documenting the comment integration change

The plan assumes the user already enabled GitHub Discussions but still needs to supply real Giscus identifiers (`repoId`, `categoryId`, etc.). To avoid shipping a fake-success state, the implementation should support a clean disabled mode until those values are filled.

### Task 1: Add centralized Giscus configuration

**Files:**
- Create: `src/config/comment.ts`
- Test: `pnpm check`

- [ ] **Step 1: Create the comment config module**

Create `src/config/comment.ts` with this structure:

```ts
export type CommentConfig = {
	enable: boolean;
	repo: string;
	repoId: string;
	category: string;
	categoryId: string;
	mapping: "pathname";
	strict: "0" | "1";
	reactionsEnabled: "0" | "1";
	inputPosition: "top" | "bottom";
	lang: string;
	theme: string;
};

export const commentConfig: CommentConfig = {
	enable: false,
	repo: "LnameBF/Lewis.github.io",
	repoId: "",
	category: "General",
	categoryId: "",
	mapping: "pathname",
	strict: "0",
	reactionsEnabled: "1",
	inputPosition: "top",
	lang: "zh-CN",
	theme: "preferred_color_scheme",
};
```

Use disabled mode by default because the user has not yet provided the real Giscus identifiers.

- [ ] **Step 2: Run type checking for the new config file**

Run: `pnpm check`

Expected: The project still reports only the known baseline errors, with no new error coming from `src/config/comment.ts`.

- [ ] **Step 3: Commit the config task**

```bash
git add src/config/comment.ts
git commit -m "feat: add giscus comment config"
```

### Task 2: Build the reusable Giscus component

**Files:**
- Create: `src/components/misc/Giscus.astro`
- Test: `pnpm check`

- [ ] **Step 1: Create the component scaffold**

Create `src/components/misc/Giscus.astro` with this starter structure:

```astro
---
import { commentConfig } from "@/config/comment";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

const isConfigured =
	commentConfig.enable &&
	commentConfig.repo &&
	commentConfig.repoId &&
	commentConfig.category &&
	commentConfig.categoryId;
---

{isConfigured && (
	<section class="card-base px-6 py-5 mb-4 onload-animation">
		<h2 class="mb-4 text-xl font-bold">{i18n(I18nKey.comments)}</h2>
		<div id="giscus-container"></div>
	</section>
)}
```

This ensures non-post pages stay untouched and post pages can omit the section cleanly until configuration is ready.

- [ ] **Step 2: Add the embed script**

Replace the starter component with this full version:

```astro
---
import { commentConfig } from "@/config/comment";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

const isConfigured =
	commentConfig.enable &&
	commentConfig.repo &&
	commentConfig.repoId &&
	commentConfig.category &&
	commentConfig.categoryId;
---

{isConfigured && (
	<section class="card-base mb-4 px-6 py-5 onload-animation">
		<h2 class="mb-4 text-xl font-bold">{i18n(I18nKey.comments)}</h2>
		<script
			src="https://giscus.app/client.js"
			data-repo={commentConfig.repo}
			data-repo-id={commentConfig.repoId}
			data-category={commentConfig.category}
			data-category-id={commentConfig.categoryId}
			data-mapping={commentConfig.mapping}
			data-strict={commentConfig.strict}
			data-reactions-enabled={commentConfig.reactionsEnabled}
			data-input-position={commentConfig.inputPosition}
			data-theme={commentConfig.theme}
			data-lang={commentConfig.lang}
			crossorigin="anonymous"
			async
		></script>
	</section>
)}
```

Do not add custom client-side synchronization logic yet. Use the preferred-color-scheme mode directly.

- [ ] **Step 3: Run type checking for the component**

Run: `pnpm check`

Expected: The project still reports only the known baseline errors, with no new error from `src/components/misc/Giscus.astro`.

- [ ] **Step 4: Commit the component task**

```bash
git add src/components/misc/Giscus.astro
git commit -m "feat: add giscus comment component"
```

### Task 3: Insert comments into post detail pages

**Files:**
- Modify: `src/pages/posts/[...slug].astro:3-14,104-115`
- Test: `pnpm check`

- [ ] **Step 1: Import the Giscus component**

In `src/pages/posts/[...slug].astro`, add this import near the other component imports:

```ts
import Giscus from "@components/misc/Giscus.astro";
```

- [ ] **Step 2: Render the comment block in the approved location**

Insert the component after the existing `License` block and before the prev/next navigation wrapper.

The relevant section should end up like this:

```astro
			<Markdown class="mb-6 markdown-content onload-animation">
				<Content />
			</Markdown>

			{licenseConfig.enable && <License title={entry.data.title} slug={entry.slug} pubDate={entry.data.published} class="mb-6 rounded-xl license-container onload-animation"></License>}

			<Giscus></Giscus>

		</div>
	</div>

	<div class="flex flex-col md:flex-row justify-between mb-4 gap-4 overflow-hidden w-full">
```

Do not move the existing navigation block or license block.

- [ ] **Step 3: Run type checking for the page integration**

Run: `pnpm check`

Expected: The project still reports only the known baseline errors, with no new error from `src/pages/posts/[...slug].astro`.

- [ ] **Step 4: Commit the page integration task**

```bash
git add src/pages/posts/[...slug].astro
git commit -m "feat: render giscus on post pages"
```

### Task 4: Fill in real Giscus identifiers and enable comments

**Files:**
- Modify: `src/config/comment.ts`
- Test: local browser verification

- [ ] **Step 1: Replace the empty placeholder identifiers with the real Giscus values**

Update `src/config/comment.ts` once the user provides the real values from Giscus.

Replace this:

```ts
export const commentConfig: CommentConfig = {
	enable: false,
	repo: "LnameBF/Lewis.github.io",
	repoId: "",
	category: "General",
	categoryId: "",
	mapping: "pathname",
	strict: "0",
	reactionsEnabled: "1",
	inputPosition: "top",
	lang: "zh-CN",
	theme: "preferred_color_scheme",
};
```

With real configured values like this shape:

```ts
export const commentConfig: CommentConfig = {
	enable: true,
	repo: "LnameBF/Lewis.github.io",
	repoId: "REAL_REPO_ID",
	category: "General",
	categoryId: "REAL_CATEGORY_ID",
	mapping: "pathname",
	strict: "0",
	reactionsEnabled: "1",
	inputPosition: "top",
	lang: "zh-CN",
	theme: "preferred_color_scheme",
};
```

Do not guess the IDs. Use the exact values the user gets from Giscus.

- [ ] **Step 2: Run type checking after enabling comments**

Run: `pnpm check`

Expected: The project still reports only the known baseline errors, with no new error from `src/config/comment.ts`.

- [ ] **Step 3: Commit the final config task**

```bash
git add src/config/comment.ts
git commit -m "feat: enable giscus comments"
```

### Task 5: Verify in browser and record maintenance note

**Files:**
- Create: `data/2026-5-13/评论功能.md`
- Test: `pnpm check`, browser verification via `pnpm dev`

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`

Expected: Astro starts successfully and prints a local URL such as `http://localhost:4321/`.

- [ ] **Step 2: Verify a post page shows the comments section**

Open a real post route such as one under `/posts/...` and verify:
- the comments section appears below the license block
- the comments section appears above prev/next navigation
- the section heading uses the localized comments label
- the widget area visually fits the article flow

Expected: The comments block appears in the intended position with no layout breakage.

- [ ] **Step 3: Verify non-post pages do not show comments**

Open routes such as:
- `/`
- `/archive/`
- `/about/`
- `/friends/`

Expected: No Giscus section appears on any non-post page.

- [ ] **Step 4: Verify widget behavior**

On a post page, verify:
- the widget UI appears in Chinese
- the login prompt is visible when not authenticated
- different post routes resolve independently through pathname mapping

Expected: The Giscus frame loads and behaves like a normal discussion embed.

- [ ] **Step 5: Record the repository maintenance note**

Create `data/2026-5-13/评论功能.md` with concise content such as:

```md
# 评论功能

- 文章页新增 Giscus 评论区
- 评论区仅在文章详情页显示
- 评论配置已独立到单独配置文件中
- 评论映射基于文章路径进行关联
```
```

- [ ] **Step 6: Run the final check**

Run: `pnpm check`

Expected: The project still reports only the known baseline errors, with no new errors introduced by the comments feature.

- [ ] **Step 7: Commit the maintenance note**

```bash
git add data/2026-5-13/评论功能.md
git commit -m "docs: record giscus comments maintenance note"
```

## Self-review

### Spec coverage
- post-only comments: covered by Task 3 and Task 5
- centralized config: covered by Task 1 and Task 4
- dedicated Giscus component: covered by Task 2
- placement under license and above navigation: covered by Task 3 and Task 5
- pathname mapping: covered by Task 1 and Task 4
- maintenance note requirement: covered by Task 5

No spec gaps found.

### Placeholder scan
The only intentionally unresolved values are the real `repoId` and `categoryId`, which cannot be guessed and must come from the user’s Giscus setup. The plan explicitly blocks completion until those real values are inserted.

### Type consistency
The plan uses a single consistent config shape:
- `CommentConfig`
- `commentConfig`
- `mapping: "pathname"`
- `theme: "preferred_color_scheme"`

The component and page integration steps reference the same names consistently.
