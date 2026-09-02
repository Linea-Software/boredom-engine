# Boredom Engine — Site Roadmap

This document tracks which sites are currently supported and which ones are planned for future implementation.

## Legend

- ✅ **Done** — Fully implemented with scripts
- 🔄 **In Progress** — Being worked on
- 📋 **Planned** — Identified as a good candidate, not yet started
- ❌ **Not Planned** — Considered but decided against

---

## Currently Supported

| Site | Domain | Scripts | Status |
|------|--------|---------|--------|
| **YouTube** | `com.youtube` | 8 scripts | ✅ Done |
| **Instagram** | `com.instagram` | 9 scripts | ✅ Done |
| **Reddit** | `com.reddit` | 6 scripts | ✅ Done |
| **TikTok** | `com.tiktok` | 5 scripts | ✅ Done |
| **Twitch** | `tv.twitch` | 7 scripts | ✅ Done |
| **Facebook** | `com.facebook` | 10 scripts | ✅ Done |

---

## Planned Sites

### Social Media Platforms

| Site | Domain Path | Priority | Notes | Status |
|------|-------------|----------|-------|--------|
| **Facebook** | `com.facebook` | 🔴 High | Feed blocking, reels/stories removal, grayscale, captcha, hide reactions/comments, sidebar removal, scrolling limits. | ✅ Done |
| **X / Twitter** | `com.x` | 🔴 High | Timeline blocking, trending topics removal, scrolling limits, captcha. | 📋 Planned |
| **LinkedIn** | `com.linkedin` | 🔴 High | Feed blocking, notification reduction, scroll limits, captcha. Increasingly addictive. | 📋 Planned |
| **Pinterest** | `com.pinterest` | 🟡 Medium | Infinite visual discovery feed — natural fit for content blocking, desaturation, scroll limits, captcha. | 📋 Planned |
| **Snapchat** | `com.snapchat` | 🟡 Medium | Stories, streaks, and discovery content. Web version is limited though. | 📋 Planned |
| **WhatsApp** | `com.whatsapp` | 🟢 Low | Mostly utilitarian messaging; status updates are the main addictive element. Web version only. | 📋 Planned |

### Content & Communities

| Site | Domain Path | Priority | Notes | Status |
|------|-------------|----------|-------|--------|
| **9GAG** | `com.9gag` | 🟡 Medium | Infinite meme scrolling, addictive by design. | 📋 Planned |
| **Imgur** | `com.imgur` | 🟡 Medium | Image-based infinite scroll, gallery browsing loops. | 📋 Planned |
| **BuzzFeed** | `com.buzzfeed` | 🟢 Low | Clickbait and listicles; less relevant today. | 📋 Planned |
| **Hacker News** | `news.ycombinator.com` | 🟡 Medium | Addictive tech news cycle. Could use feed blocking, scroll limits. | 📋 Planned |
| **Product Hunt** | `com.producthunt` | 🟢 Low | Daily dopamine hit of new products, but less time-sink overall. | 📋 Planned |
| **Medium** | `com.medium` | 🟡 Medium | Infinite reading recommendations. | 📋 Planned |
| **Quora** | `com.quora` | 🟢 Low | Addictive Q&A feed, but lower traffic nowadays. | 📋 Planned |

### Video & Streaming

| Site | Domain Path | Priority | Notes | Status |
|------|-------------|----------|-------|--------|
| **Netflix** | `com.netflix` | 🟡 Medium | Auto-play and binge-watching loops. Patterns reusable from YouTube/Twitch. | 📋 Planned |
| **Hulu** | `com.hulu` | 🟢 Low | Similar to Netflix but smaller audience. | 📋 Planned |
| **Dailymotion** | `com.dailymotion` | 🟢 Low | Lower priority — smaller user base. | 📋 Planned |

---

## Script Patterns by Category

When implementing a new site, these common scripts can be adapted:

### Common Patterns (reusable via `$common`)
- Grayscale / desaturation
- Scroll limiting
- Content blocking (feed, sidebar, recommendations)
- Network request blocking
- CSS injection
- Random captcha
- Media quality downgrade
- Video/audio delay

### Site-Specific Patterns
- Reels / Shorts removal
- Stories blocking
- Comment hiding
- Like count hiding
- Explore tab blocking
- Featured carousel removal

---

## Contribution Notes

- Use **reverse domain notation** for directory names (e.g., `com.facebook`, `com.x`).
- Each script file needs a JSDoc comment with `@id`, `@name`, `@description`, `@version`.
- Import shared utilities from `$common`.
- The build system auto-discovers scripts — no config changes needed.
- Run `bun run build` to bundle and test.
- Follow the patterns in existing sites (e.g., `com.instagram`) as a reference.
