# Boredom Engine Site Roadmap

This document lists supported websites and websites planned for future work.

## Status Key

- ✅ **Done** — The scripts and tests are complete.
- 🔄 **In Progress** — Work has started.
- 📋 **Planned** — The website is a candidate. Work has not started.
- ❌ **Not Planned** — The website was considered and rejected.

---

## Supported Websites

| Site | Domain Path | Scripts | Status |
|------|-------------|---------|--------|
| **YouTube** | `com.youtube` | 7 scripts | ✅ Done |
| **Instagram** | `com.instagram` | 8 scripts | ✅ Done |
| **Reddit** | `com.reddit` | 5 scripts | ✅ Done |
| **TikTok** | `com.tiktok` | 5 scripts | ✅ Done |
| **Twitch** | `tv.twitch` | 6 scripts | ✅ Done |
| **Facebook** | `com.facebook` | 9 scripts | ✅ Done |
| **X / Twitter** | `com.x` | 7 scripts | ✅ Done |
| **LinkedIn** | `com.linkedin` | 7 scripts | ✅ Done |
| **Pinterest** | `com.pinterest` | 7 scripts | ✅ Done |
| **Threads** | `net.threads` | 6 scripts | ✅ Done |
| **Netflix** | `com.netflix` | 6 scripts | ✅ Done |
| **Hacker News** | `com.ycombinator.news` | 6 scripts | ✅ Done |
| **Snapchat Web** | `com.snapchat` | 6 scripts | ✅ Done |

---

## Planned Websites

### Social Media

| Site | Domain Path | Priority | Notes | Status |
|------|-------------|----------|-------|--------|
| **WhatsApp** | `com.whatsapp` | 🟢 Low | Mainly used for messages. Status updates can encourage repeated visits. Web version only. | 📋 Planned |

### Content and Communities

| Site | Domain Path | Priority | Notes | Status |
|------|-------------|----------|-------|--------|
| **9GAG** | `com.9gag` | 🟡 Medium | Continuous meme feeds encourage long scrolling sessions. | 📋 Planned |
| **Imgur** | `com.imgur` | 🟡 Medium | Continuous image feeds and galleries encourage repeated browsing. | 📋 Planned |
| **BuzzFeed** | `com.buzzfeed` | 🟢 Low | Attention-grabbing articles and lists. Lower current relevance. | 📋 Planned |
| **Product Hunt** | `com.producthunt` | 🟢 Low | New products appear daily and encourage repeated visits. | 📋 Planned |
| **Medium** | `com.medium` | 🟡 Medium | Continuous article recommendations. | 📋 Planned |
| **Quora** | `com.quora` | 🟢 Low | Question-and-answer feed. Lower traffic than before. | 📋 Planned |

### Video and Streaming

| Site | Domain Path | Priority | Notes | Status |
|------|-------------|----------|-------|--------|
| **Hulu** | `com.hulu` | 🟢 Low | Similar repeated-viewing problems and intervention options to Netflix. | 📋 Planned |
| **Dailymotion** | `com.dailymotion` | 🟢 Low | Lower priority because its audience is smaller. | 📋 Planned |

---

## Common Script Patterns

When you add a website, check whether these patterns apply.
Use shared utilities from `$common` where possible.

### Reusable Patterns

- Grayscale and color reduction
- Scroll limits
- Blocking feeds, sidebars, or recommendations
- Blocking network requests
- CSS injection
- Random CAPTCHA checks or other interruptions
- Lower media quality
- Video or audio delay

### Website-Specific Patterns

- Removal of Reels or Shorts
- Blocking stories
- Hiding comments
- Hiding likes or engagement counts
- Blocking Explore or algorithm-selected tabs
- Removal of featured carousels and recommendations
- Prevention of automatic video previews
- Interruptions between consecutive videos

---

## Contribution Rules

- Use reverse-domain directory names. Examples: `src/sites/com/facebook`, `src/sites/net/threads`, `src/sites/com/ycombinator/news`.
- Add a JSDoc comment to each script file.
- Include `@id`, `@name`, `@description`, and `@version` in that comment.
- Import shared utilities from `$common` or a focused `$common/*` module.
- Let the build system find new reverse-domain directories automatically.
- Do not add configuration for a new directory unless the build system requires it.
- Before you mark a website Done, run `bun run build`, `bun run test`, `bun run test:artifact`, and `bun run test:smoke`.
- Follow existing website patterns. Do not make a separate framework.
