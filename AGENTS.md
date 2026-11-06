# AI Instructions

## Project Overview

This project contains a set of site-specific scripts aimed at transforming addictive websites (primarily social media) into boring or stressful experiences.

## Project Structure

- **/scripts**: Contains utility scripts. The most important is the **build** script, which builds the project for both Tampermonkey and generic injection.
- **/src**: Contains the source code for the scripts.
    - **/src/common**: Shared logic and utilities used across different sites.
    - **/src/sites**: Site-specific scripts organized using **reverse domain notation** (e.g., `com.youtube`, `com.instagram`).

## Project Setup & Package Manager

- This project uses **Bun** as the package manager and runtime.
- **ALWAYS** use `bun` instead of `npm`, `pnpm`, or `yarn`.
- Examples:
    - Install dependencies: `bun install`
    - Run scripts: `bun run build`
    - Add packages: \`bun add <package>\`

## Tampermonkey Development

- **Build and reload**: `bun run build` regenerates `dist/tampermonkey/`, but Tampermonkey caches `@require` files at userscript install/update time. Re-import or reinstall the generated `boredom-engine.user.js` after every build; reloading only the website does not pick up changed files. On Chrome, enable **Allow User Scripts** for Tampermonkey as described in the README.
- **Menu UI**: The Boredom Engine menu is built with Lit and is accessible via the FAB (Floating Action Button) on supported sites.

## Development Guidelines

- **Small Units**: Avoid creating huge source files, large functions, or massive classes. These are difficult to maintain.
- **Decomposition**: For complex problems, divide the solution into smaller sub-problems and solve them with focused classes or functions.
- **Type Safety**: Design data structures and types such that **invalid states are unrepresentable**.
- **Commits**: Always commit your changes using Git. Follow the Conventional Commits style. Messages must start with a prefix like `feat:`, `fix:`, `chore:`, `refactor:`, etc.

## Reference-first Site Development

For each website-specific action, research and download the source of existing
Chrome extensions and userscripts that already implement the same action on the
same website. Inspect their manifests, selectors, injection and SPA navigation
techniques as references before designing our own code. Follow
`docs/SITE_REFERENCE_RESEARCH.md`: treat downloads as untrusted, test in an
isolated browser profile, observe licenses and verify the live DOM rather than
copying code blindly. Apply this to repairs of existing scripts, not only new
sites.

## Researching New Sites

When implementing scripts for a new site, **use the browser to inspect the site live** before writing any code. This is critical for understanding the site's actual DOM structure:

1. **Navigate to the site** — Open the target site in the browser using `new_page` or `navigate_page`.
2. **Inspect the DOM** — Use `take_snapshot` and `evaluate_script` to understand the page structure, identify relevant CSS selectors, and observe how content is loaded (static vs. dynamic).
3. **Analyze patterns** — Look for:
   - Feed containers, video players, sidebar elements
   - CSS classes or attributes used for targeting
   - Network requests (feeds, recommendations, ads) using `list_network_requests`
   - How the site behaves on scroll, navigation, and dynamic content updates
4. **Model existing scripts** — Reference patterns from already-implemented sites (e.g., `com.instagram`, `com.youtube`) for reusable approaches.

This ensures the scripts are accurate and resilient to DOM changes rather than relying on assumptions.

## Policy for Sites Requiring an Account

Many addictive sites (Facebook, LinkedIn, X/Twitter, etc.) require logging in to access their main content. Since credentials are not available, follow this policy:

1. **Inspect what's accessible without login** — Many sites still expose:
   - Landing pages, login/signup screens
   - Public profiles, pages, or groups
   - Shared/embedded content (e.g., public posts, video embeds)
   - Generic navigation elements (header, footer, search)
   These often share CSS classes and DOM patterns with the logged-in experience.

2. **Leverage similar sites** — If the target site is similar to an already-implemented one, reuse its patterns:
   - **Facebook** is structurally similar to **Instagram** (feed, stories, reels, sidebar, notifications). Many of Instagram's selectors and approaches can be adapted.
   - **X/Twitter** shares patterns with **Reddit** and **TikTok** (timeline feed, trending sidebar, infinite scroll).
   - **LinkedIn** has feed and sidebar patterns similar to **Facebook**.

3. **Research the site's API and network layer** — Use `list_network_requests` to observe:
   - API endpoints that serve feed data, recommendations, or notifications
   - GraphQL/REST patterns the site uses for dynamic content
   - Request headers or response structures that can be used for `blockNetworkRequests`

4. **Use public documentation** — Check if the site has public developer docs or open-source UI libraries (e.g., Facebook's React, LinkedIn's Ember) that reveal component structure and CSS class naming conventions.

5. **Make reasonable inferences** — Based on patterns from similar sites, common social media UI patterns, and the publicly visible parts, implement scripts using well-known selectors and DOM structures. Logged-in testing can be done later by the developer.

6. **When in doubt, block broadly** — If you can't verify a specific selector, prefer broader CSS class patterns or attribute selectors that are less likely to change (e.g., `[role="feed"]`, `[data-testid]`, aria labels). These are more stable across logged-in/logged-out states.

## External Documentation

- **Lit (lit-html)**: When working with Lit or lit-html, always refer to the local documentation stored in `docs/lit/`. These docs cover components, templates, data management, and API references.
