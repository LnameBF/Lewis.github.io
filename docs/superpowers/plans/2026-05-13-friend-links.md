# Friend Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/friends/` page with a navbar entry, a repo-maintained friend-links data source, and a GitHub Issues-based application section that works on GitHub Pages.

**Architecture:** Keep the feature fully static. Store friend-link entries in a dedicated `src/data/friends.ts` file, render them from a new `src/pages/friends.astro` page using the existing `MainGridLayout`, and add a single custom navbar item in `src/config.ts`.

**Tech Stack:** Astro 5, TypeScript, Tailwind utility classes, existing Fuwari layout/components, pnpm

---

## File structure

- `src/config.ts`
  - Add a single custom navbar link pointing to `/friends/`
- `src/data/friends.ts`
  - New single-source-of-truth data file for friend-link entries and the GitHub issue URL
- `src/pages/friends.astro`
  - New standalone route that renders intro text, the application section, and friend-link cards
- `data/2026-5-13/` (existing date-based maintenance area)
  - Add one maintenance note documenting the feature after code changes are complete

No shared type extraction is planned unless the data file becomes awkward. Keep types close to the feature for now.

### Task 1: Add friend-links data source

**Files:**
- Create: `src/data/friends.ts`
- Test: `pnpm check`

- [ ] **Step 1: Create the typed data file**

```ts
export type FriendLink = {
	name: string;
	url: string;
	avatar: string;
	description: string;
	owner?: string;
	tags?: string[];
	rss?: string;
};

export const friendLinksIssueUrl = "<REPLACE_WITH_REPO_ISSUE_URL>";

export const friendLinks: FriendLink[] = [
	{
		name: "示例站点",
		url: "https://example.com",
		avatar: "https://example.com/avatar.png",
		description: "这里替换成你的第一条友链说明。",
	},
];
```

Use the exact exported names `FriendLink`, `friendLinksIssueUrl`, and `friendLinks`. Keep the file self-contained.

- [ ] **Step 2: Replace the placeholder issue URL and example entry with real project values**

Update the code from Step 1 so `friendLinksIssueUrl` points to the exact GitHub Issues or new-issue URL for this repository, and replace the placeholder sample friend link with the initial real entries you want to ship.

If there are no initial real friend links yet, keep `friendLinks` as an empty array instead:

```ts
export const friendLinks: FriendLink[] = [];
```

- [ ] **Step 3: Run type checking to verify the data file is valid**

Run: `pnpm check`

Expected: Astro/type checks complete successfully with no errors referring to `src/data/friends.ts`.

- [ ] **Step 4: Commit the data file task**

```bash
git add src/data/friends.ts
git commit -m "feat: add friend links data source"
```

### Task 2: Add navbar entry for the friend-links page

**Files:**
- Modify: `src/config.ts`
- Test: `pnpm check`

- [ ] **Step 1: Add the custom navbar link**

In `src/config.ts`, add a custom item to `navBarConfig.links` next to the other top-level navigation entries:

```ts
export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "友链",
			url: "/friends/",
		},
		{
			name: "GitHub",
			url: "https://github.com/LnameBF",
			external: true,
		},
	],
};
```

Do not extend `LinkPreset` for this one route.

- [ ] **Step 2: Run type checking to verify navbar config still passes**

Run: `pnpm check`

Expected: Astro/type checks complete successfully with no errors in `src/config.ts`.

- [ ] **Step 3: Commit the navbar task**

```bash
git add src/config.ts
git commit -m "feat: add friends page navigation"
```

### Task 3: Build the `/friends/` page

**Files:**
- Create: `src/pages/friends.astro`
- Test: `pnpm check`

- [ ] **Step 1: Create the page scaffold using existing layout patterns**

Create `src/pages/friends.astro` with this structure:

```astro
---
import MainGridLayout from "@layouts/MainGridLayout.astro";
import { friendLinks, friendLinksIssueUrl } from "@/data/friends";
---

<MainGridLayout title="友链" description="友情链接与申请方式">
	<!-- content goes here -->
</MainGridLayout>
```

Keep the page standalone and text-driven like `src/pages/about.astro` and `src/pages/archive.astro`.

- [ ] **Step 2: Add the intro section and application section**

Expand the page to include the intro copy and the GitHub-Issue-based application block:

```astro
---
import MainGridLayout from "@layouts/MainGridLayout.astro";
import { friendLinks, friendLinksIssueUrl } from "@/data/friends";
---

<MainGridLayout title="友链" description="友情链接与申请方式">
	<div class="space-y-6">
		<section class="card-base px-6 py-5">
			<h1 class="text-2xl font-bold text-[var(--primary)]">友情链接</h1>
			<p class="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
				这里收录了我常看、常逛、愿意推荐的朋友们的网站。
			</p>
		</section>

		<section class="card-base px-6 py-5">
			<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div class="space-y-3">
					<h2 class="text-xl font-bold">申请友链</h2>
					<p class="text-sm text-neutral-500 dark:text-neutral-400">
						本站部署在 GitHub Pages 上，友链申请通过 GitHub Issue 进行处理。
					</p>
					<div>
						<h3 class="font-semibold">申请要求</h3>
						<ul class="mt-2 list-disc pl-5 text-sm text-neutral-500 dark:text-neutral-400">
							<li>站点可以正常访问</li>
							<li>内容正常、非恶意、非违规</li>
							<li>如你有互链要求，请在申请中说明</li>
						</ul>
					</div>
					<div>
						<h3 class="font-semibold">申请格式</h3>
						<ul class="mt-2 list-disc pl-5 text-sm text-neutral-500 dark:text-neutral-400">
							<li>站点名称</li>
							<li>站点链接</li>
							<li>头像 / 图标链接</li>
							<li>站点描述</li>
							<li>RSS 地址（可选）</li>
						</ul>
					</div>
				</div>

				<a
					href={friendLinksIssueUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="btn-regular inline-flex h-11 items-center justify-center rounded-lg px-5 font-bold active:scale-95"
				>
					申请友链
				</a>
			</div>
		</section>
	</div>
</MainGridLayout>
```

Do not add forms, scripts, or submission handling.

- [ ] **Step 3: Add the friend-link cards and empty state**

Finish the page by rendering the list from `friendLinks`:

```astro
---
import MainGridLayout from "@layouts/MainGridLayout.astro";
import { friendLinks, friendLinksIssueUrl } from "@/data/friends";
---

<MainGridLayout title="友链" description="友情链接与申请方式">
	<div class="space-y-6">
		<section class="card-base px-6 py-5">
			<h1 class="text-2xl font-bold text-[var(--primary)]">友情链接</h1>
			<p class="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
				这里收录了我常看、常逛、愿意推荐的朋友们的网站。
			</p>
		</section>

		<section class="card-base px-6 py-5">
			<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div class="space-y-3">
					<h2 class="text-xl font-bold">申请友链</h2>
					<p class="text-sm text-neutral-500 dark:text-neutral-400">
						本站部署在 GitHub Pages 上，友链申请通过 GitHub Issue 进行处理。
					</p>
					<div>
						<h3 class="font-semibold">申请要求</h3>
						<ul class="mt-2 list-disc pl-5 text-sm text-neutral-500 dark:text-neutral-400">
							<li>站点可以正常访问</li>
							<li>内容正常、非恶意、非违规</li>
							<li>如你有互链要求，请在申请中说明</li>
						</ul>
					</div>
					<div>
						<h3 class="font-semibold">申请格式</h3>
						<ul class="mt-2 list-disc pl-5 text-sm text-neutral-500 dark:text-neutral-400">
							<li>站点名称</li>
							<li>站点链接</li>
							<li>头像 / 图标链接</li>
							<li>站点描述</li>
							<li>RSS 地址（可选）</li>
						</ul>
					</div>
				</div>

				<a
					href={friendLinksIssueUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="btn-regular inline-flex h-11 items-center justify-center rounded-lg px-5 font-bold active:scale-95"
				>
					申请友链
				</a>
			</div>
		</section>

		<section class="space-y-4">
			<h2 class="px-1 text-xl font-bold">已添加友链</h2>

			{friendLinks.length === 0 ? (
				<div class="card-base px-6 py-8 text-sm text-neutral-500 dark:text-neutral-400">
					暂时还没有添加友链，欢迎通过 GitHub Issue 申请。
				</div>
			) : (
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{friendLinks.map((friend) => (
						<a
							href={friend.url}
							target="_blank"
							rel="noopener noreferrer"
							class="card-base flex items-center gap-4 px-5 py-4 transition hover:scale-[1.01]"
						>
							<img
								src={friend.avatar}
								alt={`${friend.name} avatar`}
								class="h-14 w-14 rounded-full object-cover"
							/>
							<div class="min-w-0">
								<div class="truncate font-bold text-lg">{friend.name}</div>
								<p class="mt-1 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
									{friend.description}
								</p>
							</div>
						</a>
					))}
				</div>
			)}
		</section>
	</div>
</MainGridLayout>
```

Keep the card surface aligned with existing `card-base` styling. Do not add filtering, tags, or category UI.

- [ ] **Step 4: Run type checking to verify the page builds**

Run: `pnpm check`

Expected: Astro/type checks complete successfully with no errors in `src/pages/friends.astro`.

- [ ] **Step 5: Commit the page task**

```bash
git add src/pages/friends.astro
git commit -m "feat: add friends page"
```

### Task 4: Verify in the browser and record the maintenance note

**Files:**
- Create: `data/2026-5-13/友链功能.md`
- Test: local browser verification via dev server

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`

Expected: Astro dev server starts successfully and prints a local URL, typically `http://localhost:4321/`.

- [ ] **Step 2: Verify the navbar route and page rendering in a browser**

Open the local site and verify:
- the navbar shows `友链`
- clicking it goes to `/friends/`
- the intro, application block, and friend-link list are visible
- the layout matches the rest of the site on desktop width
- the layout still reads cleanly on a narrow/mobile width

Expected: All sections render with no obvious overlap, broken spacing, or missing content.

- [ ] **Step 3: Verify outbound links**

From `/friends/`, verify:
- the `申请友链` button opens the configured GitHub Issue destination in a new tab
- each friend-link card opens the correct external site in a new tab

Expected: Links point to the intended external destinations and do not navigate the current page away from the site.

- [ ] **Step 4: Add the maintenance note required by this repo**

Create `data/2026-5-13/友链功能.md` with concise content like:

```md
# 友链功能

- 新增 `/friends/` 友情链接页面
- 导航栏增加“友链”入口
- 新增独立友链数据文件，便于后续维护
- 友链申请改为通过 GitHub Issue 提交
```
```

Match the repo’s existing maintenance-note style if there is one in the same date directory.

- [ ] **Step 5: Run the final project check**

Run: `pnpm check`

Expected: All Astro/type checks pass after the maintenance note is added.

- [ ] **Step 6: Commit the verification and maintenance note**

```bash
git add data/2026-5-13/友链功能.md
git commit -m "docs: record friend links maintenance note"
```

## Self-review

### Spec coverage
- `/friends/` page: covered by Task 3
- navbar entry: covered by Task 2
- structured friend-links data file: covered by Task 1
- GitHub Issue application block: covered by Task 3
- browser verification on desktop/mobile: covered by Task 4
- maintenance note requirement from repo memory: covered by Task 4

No spec gaps found.

### Placeholder scan
One intentional placeholder remains in Task 1 code: `<REPLACE_WITH_REPO_ISSUE_URL>`. This is acceptable in the plan only as an explicit instruction to substitute the exact repository URL during implementation. The implementation itself must not ship with that placeholder.

### Type consistency
The exported names are consistent across tasks:
- `FriendLink`
- `friendLinksIssueUrl`
- `friendLinks`

The page import path and data names stay consistent throughout the plan.
