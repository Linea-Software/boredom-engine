# Boredom Engine

A set of scripts designed to make the web less dopaminic and more boring.

This project uses **Bun** and **TypeScript** to generate and manage userscripts/styles that modify the appearance and behavior of popular websites to reduce their addictive nature.

## Development

### Install Dependencies

```bash
bun install
```

### Build Scripts

To build the scripts and generate the metadata:

```bash
bun run build
```

(Or `bun run index.ts` if that is the main entry point currently).

## Project Structure

Scripts are organized using Reverse Domain Name Notation in `src/sites`:
- `src/sites/com/youtube/...`
- `src/sites/tv/twitch/...`

Common utilities are located in `src/common`.
