# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Install dependencies: `pnpm install`  
  - `package.json` enforces pnpm via `preinstall`; README states Node >= 20 and pnpm >= 9.
- Start local dev server: `pnpm dev`
- Start local dev server (alias): `pnpm start`
- Build production site: `pnpm build`  
  - Runs `astro build` and then `pagefind --site dist` to generate search indexes.
- Preview production build: `pnpm preview`
- Astro project checks: `pnpm check`
- TypeScript-only check: `pnpm type-check`
- Lint and apply fixes in `src/`: `pnpm lint`
- Format `src/` with Biome: `pnpm format`
- Create a new post scaffold: `pnpm new-post <filename>`
- Run Astro CLI directly: `pnpm astro ...`

### Single-test note

This repository does not currently define a test runner or test scripts in `package.json`, so there is no project-specific “run one test” command to document.

## Project structure and architecture

This is an Astro 5 static blog template with Tailwind styling, a small amount of Svelte for interactive widgets, and Astro Content Collections for all site content.

### Content model

- Blog posts live in the `posts` collection under `src/content/posts/`.
- The About page is not hardcoded; it is rendered from the `spec` collection entry at `src/content/spec/about.md` via `src/pages/about.astro`.
- `src/content/config.ts` is the schema boundary for content. It defines post frontmatter fields and also includes internal navigation metadata fields (`prevTitle`, `prevSlug`, `nextTitle`, `nextSlug`) that are populated later in the content pipeline.

### Rendering flow

There are two main page-generation flows:

1. **Post list / homepage pagination**  
   `src/pages/[...page].astro` calls `getSortedPosts()` from `src/utils/content-utils.ts`, then uses Astro `paginate()` with `PAGE_SIZE`, and renders the results through `src/components/PostPage.astro` inside `src/layouts/MainGridLayout.astro`.

2. **Individual post pages**  
   `src/pages/posts/[...slug].astro` also starts from `getSortedPosts()`, maps entries to static paths, renders the entry body with `entry.render()`, and passes `headings` into `MainGridLayout` so the TOC can be built.

`src/utils/content-utils.ts` is the central content aggregation layer. It:
- filters out draft posts in production only,
- sorts posts by published date,
- mutates each post’s data to wire previous/next navigation,
- derives tag and category lists used by sidebar/archive-style views.

### Layout hierarchy

The layout stack is important:

- `src/layouts/Layout.astro` is the global document shell. It owns:
  - page metadata / OG tags / RSS link,
  - early inline theme + hue initialization from `localStorage`,
  - global client-side behavior for Swup transitions, scroll state, custom scrollbars, KaTeX overflow containers, and PhotoSwipe image lightbox.
- `src/layouts/MainGridLayout.astro` builds the visible page chrome:
  - navbar,
  - optional banner,
  - sidebar,
  - main content panel,
  - footer,
  - TOC column,
  - back-to-top control.

If a change affects page-level behavior, inspect both layout files before editing individual components.

### Configuration-driven site behavior

`src/config.ts` is the main runtime configuration surface for the site. It controls:
- site metadata,
- theme hue behavior,
- banner enablement and credit,
- TOC enablement/depth,
- navbar links,
- profile/social links,
- license footer,
- Expressive Code theme choice.

A large share of visible behavior is driven from this file rather than from page code.

### Markdown and content-processing pipeline

The markdown pipeline is assembled in `astro.config.mjs` and is a key part of the project’s architecture.

Remark plugins add:
- math support,
- reading time / word count frontmatter,
- excerpt generation,
- GitHub-style admonitions converted to directives,
- directive parsing,
- section wrapping.

Rehype plugins add:
- KaTeX rendering,
- heading slugs and anchor links,
- custom component rendering for directives.

Custom directive/component hooks are implemented under `src/plugins/`, notably:
- custom admonition rendering,
- GitHub repo card rendering,
- directive-to-rehype conversion,
- reading-time and excerpt helpers,
- Expressive Code extensions such as language badges and copy-button customization.

When editing markdown behavior, treat `astro.config.mjs` plus `src/plugins/` as one system.

### Search, feeds, and generated artifacts

- Search is static and build-time generated with Pagefind; this is why `pnpm build` runs an extra indexing step after Astro builds `dist/`.
- RSS is generated in `src/pages/rss.xml.ts` from the same sorted post source. It renders markdown to HTML with `markdown-it` and sanitizes the result before emitting feed items.
- `src/pages/robots.txt.ts` builds `robots.txt` from `import.meta.env.SITE`.
- Sitemap generation is enabled via `@astrojs/sitemap` in `astro.config.mjs`.

### Interactive UI pieces

Most pages are Astro components, but interactive controls are selectively implemented with Svelte and client-side scripts:
- Svelte is enabled through `@astrojs/svelte` and `vitePreprocess`.
- Search, theme/display controls, and some archive/navigation widgets are Svelte components.
- Page transitions use `@swup/astro`, configured in `astro.config.mjs` to swap `main` and `#toc` containers.

Because transitions are global, bugs that look component-local may actually come from the Swup hooks in `Layout.astro`.

### Styling and conventions

- Tailwind is the main styling system.
- Biome is the formatter/linter, but it intentionally excludes CSS and several generated/static directories from its main include set.
- The codebase uses tabs for indentation and double quotes in JS/TS per `biome.json`.
- Path aliases are defined in `tsconfig.json` (`@components/*`, `@utils/*`, `@/*`, etc.) and are used heavily across the repo.

## Repo-specific notes from project docs

- README directs users to customize the site primarily through `src/config.ts` and content under `src/content/posts/`.
- `scripts/new-post.js` scaffolds new markdown files directly inside `src/content/posts/`, supports nested paths, and auto-adds `.md` if omitted.
- `CONTRIBUTING.md` asks contributors to discuss major feature or design changes before starting, keep PRs single-purpose, and prefer Conventional Commit messages.
