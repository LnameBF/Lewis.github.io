# 2026-05-13 Giscus Comments Design

## Goal
Add a Giscus-powered comment section to post detail pages in the Fuwari-based static blog, modeled after the reference site’s article-page discussion experience and compatible with GitHub Pages deployment.

## Scope
This design covers:
- rendering comments only on article detail pages
- using Giscus backed by GitHub Discussions
- centralizing comment configuration
- placing the comment section below article content and license information, above prev/next navigation

This design does not include:
- multiple comment providers
- article-level per-post comment toggles
- comment count badges elsewhere in the site
- automation for creating or managing GitHub Discussions categories
- custom backend services or API routes

## Recommended approach
Use a dedicated Giscus component plus a dedicated comment configuration module.

- `src/pages/posts/[...slug].astro` remains responsible for article-page composition
- a new reusable component renders the embedded Giscus widget
- a dedicated config module stores Giscus settings and external identifiers

This keeps the article page readable, isolates third-party embed logic, and fits the repo’s existing configuration-driven structure.

## Architecture
### Article-page integration
Integrate comments only in `src/pages/posts/[...slug].astro`.

The insertion point should be:
1. article markdown content
2. license block
3. Giscus comments block
4. prev/next navigation

This matches the reference site’s reading flow and keeps comments attached to post-level context rather than to generic layout infrastructure.

### Giscus component
Create a dedicated component such as `src/components/misc/Giscus.astro`.

This component should:
- render the Giscus `<script>` embed with the required attributes
- read values from centralized configuration
- remain presentation-focused and not contain page-routing logic beyond receiving the current mapping term if needed

The component should be reusable but only invoked from article pages for now.

### Centralized config
Create a dedicated config module such as `src/config/comment.ts`.

It should contain at least:
- `enable`
- `repo`
- `repoId`
- `category`
- `categoryId`
- `mapping`
- `strict`
- `reactionsEnabled`
- `inputPosition`
- `lang`
- `theme`

Using a separate file is preferred over expanding `src/config.ts`, because Giscus has enough parameters to justify an isolated config surface.

## Mapping strategy
Use a stable path-based mapping strategy, preferably `pathname`.

Why:
- titles may change over time
- descriptions may change over time
- article paths derived from slugs are more stable in a static blog
- Giscus works well when each route consistently maps to one discussion thread

This means each article page automatically resolves to its own comment thread without manual per-post configuration.

## External configuration prerequisites
The user has already enabled GitHub Discussions in the repository, but the following Giscus values are still required before the integration can be fully wired:
- `repo`
- `repoId`
- `category`
- `categoryId`

Without these identifiers, the code structure can be prepared but the live comment widget cannot be connected successfully. The final implementation should therefore either:
- wait for the real values before completion, or
- support clearly marked temporary placeholders during intermediate development only, with the understanding that the feature is not complete until real values are inserted.

For the approved implementation, the preferred path is to use the real values once the user provides them.

## Page behavior
### Where comments appear
Comments appear only on post detail pages.

They do not appear on:
- homepage pagination
- archive pages
- about page
- friends page
- any other non-post route

### Fallback behavior
If comments are disabled in config, the article page should render normally and simply omit the comment section.

This keeps the page resilient without adding unnecessary complexity.

## Theme and language
### Language
Set Giscus language to Chinese by default.

### Theme
Use a theme mode that follows the blog’s light/dark presentation rather than hardcoding a single theme.

The preferred default is to use Giscus support for preferred color scheme so that the widget visually aligns with the site out of the box. More advanced runtime synchronization is not required in this scope unless existing site behavior makes it trivial.

## Data flow
1. article route resolves through `src/pages/posts/[...slug].astro`
2. the article page renders markdown and metadata
3. the page imports and renders the Giscus component after the license block
4. the Giscus component reads centralized settings
5. Giscus maps the current article route to a GitHub Discussion thread through pathname-based mapping

No server-side persistence or custom API flow is needed in this repo.

## Error handling
Keep error handling minimal and boundary-focused.

Assume the local config is valid once the required Giscus identifiers are filled in. Do not add heavy defensive logic for impossible internal states.

Reasonable safeguards for this scope:
- if `enable` is false, do not render comments
- if required config is intentionally left empty during setup, treat the feature as not ready rather than inventing fallback behavior

No client-side retry or custom loading framework is needed.

## Verification and testing
Because this repo does not have a dedicated component test runner, verification should center on:
- `pnpm check`
- browser verification in a local dev server

Verify:
- a post page shows the Giscus block in the correct location
- non-post pages do not show the Giscus block
- the widget displays in Chinese
- the widget visually fits under the license block and above prev/next navigation
- the login / comment UI is visible when not authenticated
- different post routes resolve to distinct discussions by pathname mapping

Note: if there are pre-existing `pnpm check` failures in the repository, success for this task means not introducing new failures while also verifying the comment UI in the browser.

## Expected file changes
- Create: `src/components/misc/Giscus.astro`
- Create: `src/config/comment.ts`
- Modify: `src/pages/posts/[...slug].astro`
- Create or update maintenance note under `data/2026-5-13/` as required by repo memory if code changes are completed

## Non-goals
Do not add:
- comments on non-post pages
- comment counters in cards, sidebars, or archive lists
- GitHub Discussion management automation
- custom styling system just for Giscus
- multi-provider abstraction
- article-specific overrides

## Success criteria
The feature is complete when:
1. post detail pages render a Giscus comments section
2. non-post pages remain unchanged
3. the widget is configured through centralized comment settings
4. the widget uses stable pathname-based thread mapping
5. the widget is positioned below the article/license content and above article navigation
6. the integration works with the repository’s GitHub Discussions configuration once real Giscus identifiers are supplied
