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
    - Add packages: `bun add <package>`

## Development Guidelines

- **Small Units**: Avoid creating huge source files, large functions, or massive classes. These are difficult to maintain.
- **Decomposition**: For complex problems, divide the solution into smaller sub-problems and solve them with focused classes or functions.
- **Type Safety**: Design data structures and types such that **invalid states are unrepresentable**.
- **Commits**: Always commit your changes using Git. Follow the Conventional Commits style. Messages must start with a prefix like `feat:`, `fix:`, `chore:`, `refactor:`, etc.
