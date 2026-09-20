# Boredom Engine — Site Roadmap

This document tracks which sites are currently supported and which ones remain planned for future implementation.

## Legend

- ✅ **Done** — Fully implemented with scripts and tests
- 🔄 **In Progress** — Being worked on
- 📋 **Planned** — Identified as a good candidate, not yet started
- ❌ **Not Planned** — Considered but decided against

---

## Currently Supported

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

## Planned Sites

### Social Media Platforms

| Site | Domain Path | Priority | Notes | Status |
|------|-------------|----------|-------|--------|
| **WhatsApp** | `com.whatsapp` | 🟢 Low | Mostly utilitarian messaging; status updates are the main addictive element. Web version only. | 📋 Planned |

### Content & Communities

| Site | Domain Path | Priority | Notes | Status |
|------|-------------|----------|-------|--------|
| **9GAG** | `com.9gag` | 🟡 Medium | Infinite meme scrolling, addictive by design. | 📋 Planned |
| **Imgur** | `com.imgur` | 🟡 Medium | Image-based infinite scroll and gallery browsing loops. | 📋 Planned |
| **BuzzFeed** | `com.buzzfeed` | 🟢 Low | Clickbait and listicles; less relevant today. | 📋 Planned |
| **Product Hunt** | `com.producthunt` | 🟢 Low | Daily novelty loop around new products. | 📋 Planned |
| **Medium** | `com.medium` | 🟡 Medium | Infinite reading recommendations. | 📋 Planned |
| **Quora** | `com.quora` | 🟢 Low | Addictive Q&A feed, but lower traffic nowadays. | 📋 Planned |

### Video & Streaming

| Site | Domain Path | Priority | Notes | Status |
|------|-------------|----------|-------|--------|
| **Hulu** | `com.hulu` | 🟢 Low | Similar binge/friction opportunities to Netflix. | 📋 Planned |
| **Dailymotion** | `com.dailymotion` | 🟢 Low | Lower priority due to smaller audience. | 📋 Planned |

---

## Script Patterns by Category

When implementing a new site, these common scripts can be adapted:

### Common Patterns (reusable via `$common`)
- Grayscale / desaturation
- Scroll limiting
- Content blocking (feed, sidebar, recommendations)
- Network request blocking
- CSS injection
- Random captcha / friction
- Media quality downgrade
- Video/audio delay

### Site-Specific Patterns
- Reels / Shorts removal
- Stories blocking
- Comment hiding
- Like / engagement count hiding
- Explore / algorithmic-tab blocking
- Featured carousel and recommendation removal
- Autoplay-preview suppression
- Binge playback friction

---

## Contribution Notes

- Use **reverse domain notation** for directory names (for example `src/sites/com/facebook`, `src/sites/net/threads`, and `src/sites/com/ycombinator/news`).
- Each script file needs a JSDoc comment with `@id`, `@name`, `@description`, `@version`.
- Import shared utilities from `$common` or a focused `$common/*` module.
- The build system auto-discovers scripts — no config changes are needed for a new reverse-domain directory.
- Run `bun run build`, `bun run test`, `bun run test:artifact`, and `bun run test:smoke` before marking a site Done.
- Follow the patterns in existing sites rather than creating a parallel framework.
