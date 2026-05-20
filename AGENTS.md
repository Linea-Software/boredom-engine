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

- **Auto-Loading**: The project is configured to automatically reload the Tampermonkey script in the browser whenever \`bun run build\` is executed. This allows for a fast development cycle without manual script updates in the Tampermonkey dashboard.
- **Menu UI**: The Boredom Engine menu is built with Lit and is accessible via the FAB (Floating Action Button) on supported sites.

## Development Guidelines

- **Small Units**: Avoid creating huge source files, large functions, or massive classes. These are difficult to maintain.
- **Decomposition**: For complex problems, divide the solution into smaller sub-problems and solve them with focused classes or functions.
- **Type Safety**: Design data structures and types such that **invalid states are unrepresentable**.
- **Commits**: Always commit your changes using Git. Follow the Conventional Commits style. Messages must start with a prefix like `feat:`, `fix:`, `chore:`, `refactor:`, etc.

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

## External Documentation

- **Lit (lit-html)**: When working with Lit or lit-html, always refer to the local documentation stored in `docs/lit/`. These docs cover components, templates, data management, and API references.
