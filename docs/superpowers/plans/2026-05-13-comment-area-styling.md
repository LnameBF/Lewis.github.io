# Comment Area Styling Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the post comment area visually match the site's existing card and panel language without changing Giscus behavior.

**Architecture:** Keep the Giscus embed behavior unchanged and limit the work to the existing wrapper component around the comments section. Reuse the site's established card, spacing, divider, and muted text patterns so the comments block feels like a natural part of the article page instead of a separate widget.

**Tech Stack:** Astro 5, Tailwind utility classes, existing Fuwari component styles, pnpm

---

## File structure

- `src/components/misc/Giscus.astro`
  - Tighten the section structure and add a lightweight inner wrapper around the embed area.
- `src/styles/main.css`
  - Add one or two small component-layer utility classes only if the existing utility classes are not enough.
- `data/2026-5-13/评论区域样式美化.md`
  - Maintenance note documenting the visual refinement.

The scope is intentionally narrow: no config changes, no Giscus script changes, no post layout restructuring, and no new interactive behavior.

### Task 1: Refresh the comment card structure

**Files:**
- Modify: `src/components/misc/Giscus.astro`
- Test: `pnpm check`

- [ ] **Step 1: Write the failing verification target**

Use the browser and current markup as the baseline. The failure condition is: the comment block looks like a plain card with only a title and embedded script, with no visual separation between heading and embed content.

Document the target structure before editing:

```astro
<section class="card-base mb-4 px-6 py-5 onload-animation">
	<h2 class="mb-4 text-xl font-bold">{i18n(I18nKey.comments)}</h2>
	<script ...></script>
</section>
```

This is considered insufficient because it does not provide a distinct heading area, divider, or inner surface for the embedded content.

- [ ] **Step 2: Verify the current state is missing the target styling**

Run: `pnpm dev`

Then open a post page in the browser and confirm these failures:
- The title is visually attached directly to the widget.
- There is no muted supporting text or subtle separator.
- The embedded area does not sit inside a softer inner container.

Expected: The current design clearly fails the desired “restrained, site-native panel” standard.

- [ ] **Step 3: Write the minimal wrapper refinement**

Update `src/components/misc/Giscus.astro` to this structure:

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
	<section class="card-base card-shadow mb-6 px-6 py-5 onload-animation">
		<div class="mb-4 flex items-end justify-between gap-3 border-b border-dashed border-[var(--line-divider)] pb-3">
			<div>
				<h2 class="text-xl font-bold text-90">{i18n(I18nKey.comments)}</h2>
				<p class="mt-1 text-sm text-50">在这里留下你的看法，版式会与站点主题自动适配。</p>
			</div>
		</div>
		<div class="rounded-[calc(var(--radius-large)-0.25rem)] bg-[var(--btn-regular-bg)]/60 px-3 py-3 md:px-4">
			<script
				is:inline
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
				data-loading="lazy"
				crossorigin="anonymous"
				async
			></script>
		</div>
	</section>
)}
```

Keep the script attributes unchanged except for preserving the existing lazy-load setup. Do not add client-side theme sync logic or extra controls.

- [ ] **Step 4: Run project checks**

Run: `pnpm check`

Expected: PASS, or only the known baseline warnings/errors unrelated to this component. No new error from `src/components/misc/Giscus.astro`.

### Task 2: Add a tiny shared style helper only if needed

**Files:**
- Modify: `src/styles/main.css`
- Test: `pnpm check`

- [ ] **Step 1: Check whether existing utilities are enough**

If the updated component reads clearly with existing classes only, skip this task entirely.

Expected: No CSS helper is added unless it removes obvious duplication while staying single-purpose.

- [ ] **Step 2: Add the smallest possible helper if duplication remains**

If needed, add one helper in `src/styles/main.css` under `@layer components`, like this:

```css
.comment-surface {
	@apply rounded-[calc(var(--radius-large)-0.25rem)] bg-[var(--btn-regular-bg)]/60 px-3 py-3 md:px-4;
}
```

Only do this if the wrapper classes would otherwise be repeated or become hard to read. Do not extract heading styles.

- [ ] **Step 3: Run project checks again**

Run: `pnpm check`

Expected: No new style or type issues.

### Task 3: Verify in the browser and record maintenance note

**Files:**
- Create: `data/2026-5-13/评论区域样式美化.md`
- Test: browser verification

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`

Expected: Local Astro dev server starts successfully.

- [ ] **Step 2: Verify the comment area on a post page**

Open a post detail page and verify:
- The comment section reads as a site-native card.
- The title area has clearer separation from the embed area.
- The inner wrapper softens the transition into the Giscus iframe.
- The block does not visually overpower the article body or prev/next navigation.
- Light and dark theme both remain visually coherent.

Expected: The styling feels integrated and restrained, with no layout breakage.

- [ ] **Step 3: Write the maintenance note**

Create `data/2026-5-13/评论区域样式美化.md` with a short note covering:
- What changed
- Which files changed
- How it was verified

Use this content:

```md
# 评论区域样式美化

- 时间：2026-05-13
- 目的：让文章页评论区域更贴合站点现有卡片与分隔风格，不改动评论功能逻辑。
- 变更文件：`src/components/misc/Giscus.astro`（以及如有需要的 `src/styles/main.css`）
- 验证方式：`pnpm check`，本地文章页浏览确认亮色/暗色下的视觉一致性。
```

- [ ] **Step 4: Commit the finished change**

```bash
git add src/components/misc/Giscus.astro src/styles/main.css data/2026-5-13/评论区域样式美化.md
git commit -m "style: refine comment section appearance"
```
