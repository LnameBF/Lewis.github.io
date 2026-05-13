# 2026-05-13 Friend Links Design

## Goal
Add a dedicated friend-links page to the Astro blog, expose it in the top navigation, and support link applications through GitHub Issues so the feature works cleanly on GitHub Pages without any backend.

## Scope
This design covers:
- a `/friends/` page
- a navigational entry for the page
- a structured friend-links data file
- a visible application section that routes users to create a GitHub Issue

This design does not include:
- backend form submission
- automatic approval or moderation
- admin management UI
- categorization, filtering, or sorting controls beyond simple code-level maintenance

## Recommended approach
Use a dedicated page plus a dedicated data file:
- `src/pages/friends.astro` renders the page
- `src/data/friends.ts` stores the friend-link entries
- `src/config.ts` only adds the navbar entry

This keeps navigation configuration small, avoids overloading `src/config.ts`, and matches the project’s current static-site architecture.

## Architecture
### Page
Create `src/pages/friends.astro` as a standalone route at `/friends/`.

The page should use the existing site layout pattern so it visually matches the rest of the blog. It should follow the same overall structure as existing standalone pages such as `src/pages/about.astro`, using `MainGridLayout` rather than introducing a separate layout.

### Data source
Create `src/data/friends.ts` as the single source of truth for friend-link entries.

The file should export a typed array of friend-link items. Each item should support the minimal fields needed for display:
- `name`: site name
- `url`: target site URL
- `avatar`: avatar or icon URL/path
- `description`: short site description

Optional fields can be included for future-ready but still simple extensibility:
- `owner`
- `tags`
- `rss`

The page should consume this file directly. No content collection is needed for the current scope.

### Navigation
Add a new navbar link in `src/config.ts` that points to `/friends/`.

This should be a normal custom nav item, consistent with the existing GitHub nav entry, rather than extending `LinkPreset` for a single project-specific route.

## Page design
The `/friends/` page should contain three sections in this order.

### 1. Intro section
A short heading and brief description explaining that this page lists partner sites / friend links.

This section is intentionally lightweight and should not become a long article.

### 2. Application section
A clearly visible block explaining how to apply for a friend link.

Because the site is deployed on GitHub Pages, applications should be handled entirely through GitHub Issues. This section should include:
- a short invitation to apply
- a statement that applications are handled via GitHub Issues
- application requirements
- the expected submission format
- a prominent button linking to the repository’s Issue creation flow

The application requirements should be explicit and stable. The page should state that applicants are expected to provide:
- site name
- site URL
- avatar/icon URL
- short description
- RSS URL if available

It should also state basic acceptance expectations such as:
- the site is accessible
- the content is non-malicious and non-violating
- the applicant has added or is willing to add this site first, if that is your intended policy

The button target should prefer a GitHub “new issue” URL if one is available and known. If that URL is not yet finalized, the design should still support a normal Issues page URL with the expectation that the final implementation uses the exact repository path provided by the user.

### 3. Friend-link list section
Render the friend links as cards.

Each card should include:
- avatar
- site name
- short description
- clickable link behavior to the target site

External links should open in a new tab. The presentation should stay visually aligned with the existing theme rather than introducing a radically different card style.

## Data flow
- Navigation points users to `/friends/`
- `src/pages/friends.astro` imports the friend-link list from `src/data/friends.ts`
- the page renders the application section and then maps the data into cards
- the Issue button sends users to GitHub for the application process

There is no runtime mutation, user submission handling, or persistence inside the blog itself.

## Error handling
Keep error handling minimal and boundary-focused.

The implementation should assume local friend-link data is valid because it is repository-maintained. No defensive validation layer is needed for impossible internal states.

Only user-facing robustness that matters here:
- external links should be rendered safely as standard anchors
- application URL should be a normal string config/value used by the page

If the list is empty, the page should still render cleanly with the application section visible and either an empty-state sentence or simply no cards, depending on the existing design style in the repo.

## Testing and verification
Verification should focus on behavior and rendering:
- the navbar contains a “友链” entry and routes to `/friends/`
- the page renders under the existing layout without breaking spacing or responsiveness
- friend-link cards render correctly from `src/data/friends.ts`
- external friend links open correctly
- the “申请友链” button routes to the intended GitHub Issues location
- the page looks correct in the browser on desktop and mobile widths

Because this repository has no dedicated test runner for page components, validation should primarily be:
- `pnpm check`
- local browser verification via `pnpm dev`

## File changes expected
- `src/config.ts`
- `src/pages/friends.astro`
- `src/data/friends.ts`

Potentially a small shared type addition is acceptable if it stays minimal and directly supports the new data file, but the default should be to keep the type near the data file unless reuse is clearly needed.

## Non-goals
Do not add:
- comment-based applications
- on-site submission forms
- API endpoints
- issue synchronization automation
- friend-link categories or filters
- a separate admin workflow

## Success criteria
The feature is complete when:
1. users can discover the friend-links page from the navbar
2. the page displays configured friend links clearly
3. users can follow a documented GitHub Issue workflow to request a link
4. the implementation fits the repo’s existing layout and static-site architecture with minimal, surgical changes
