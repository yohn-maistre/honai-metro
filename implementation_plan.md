# ETNOS Implementation Plan

## ✅ Phase 1: Setup & Bugfixes (DONE)

- Git remote setup (upstream + origin)
- Honai Metro theme as default, Satoshi/Nunito fonts, scrollbar styling
- Fixed Windows `PostForm.svelte` / `postform.svelte.ts` case collision
- Fixed locale fallback hang in `+layout.ts`
- `.env` setup: `PUBLIC_INSTANCE_URL`, `PUBLIC_LOCK_TO_INSTANCE=true`

## ✅ Phase 2: i18n & Custom Pages (DONE)

- Indonesian (`id.json`) + Papuan Malay (`pmy.json`) language support
- Default language → Indonesian
- Upstream locales commented out (marked `// ETNOS:`)
- Wiki page placeholder, Dashboard page placeholder
- Sidebar + mobile popup menu buttons for Wiki & Dashboard

## ✅ Phase 3: Wiki + Dashboard + civic surfaces (DONE — branch `claude/etnos-explore-deploy-pwesg`)

### Batch A — Identity & shell
- ETNOS branding pass (manifest, lang="id", meta description)
- First-visit onboarding popup (reuses existing `Modal`)
- Thin About page at `/tentang` (reuses `Markdown`)
- i18n `etnos.*` keys across id/pmy/en
- `.env.example` (defaults: `piefed.social` / `piefedalpha`)

### Batch B — Wiki + Dashboard core
- WikiCarousel: "Hari Ini Dalam Sejarah Papua" (date-keyed `onthisday.json`)
  + "Kata Hari Ini" (rotating words, day-of-year index) with TTS via
  `SpeechSynthesis` (free, no key)
- `/wiki/[category]` routes rendering markdown from `src/lib/etnos/wiki/*.md`
  via `import.meta.glob`
- Dashboard: real stat cards + pure-SVG StatCard/BarChart/LineChart (no
  Chart.js, CSP-safe). Snapshot data clearly marked `demo: true`.
- **OTSUS tracker** as dedicated section citing UU 2/2021.

### Batch C — Community / civic surfaces
- `/jelajah` — curated Suku/Komunitas directory grouped by purpose
- `PapuaMap.svelte` — inline-SVG 6-province picker
- `/bahasa` — Ruang Bahasa hub (9 Papuan languages, endangerment badges)
- `/registry` — MCP Tool Registry (KYC / malware-scan / TKDN badges)
- Trust-tier / AI-agent badges on user profiles
- AI feed shortcut → `/c/ai-updates`

---

## 🔮 Phase 3b: LLM-powered content automation (PLANNED)

See `ETNOS_ROADMAP.md` → "Live data + LLM content automation".

Daily GitHub Action runs `scripts/generate-content.ts` (Anthropic API) to
refresh `onthisday.json` and dashboard narrative summaries. Wikipedia REST API
enrichment in `wiki/+page.ts` for province-specific articles.

---

## 🔮 Phase 4: AI Agent Feed (PLANNED)

Shortcut to `/c/ai-updates` is already in the nav. Future:
- Custom feed filter tab inside the home feed (extend `Location.svelte`).
- Agent authorization management UI.
- PNS Digital persona surfacing (memo §4.3): Staf / Operator / Bendahara /
  Sekretaris / Arsiparis Digital badges and signed provenance footers.

---

## 🔮 Phase 5: Access & sovereignty (PLANNED)

- Offline-first PWA (memo §2.3/§6.4)
- "Mode Hemat Data" low-bandwidth toggle
- WhatsApp deep-links throughout
- Voice/video/image upload with CARE consent labels (memo §6.4)
- Four-tier community vouching flow (memo §6.3)
- Two-mode trust (government/Dewan Adat) UI surfacing (memo §5.3)

Full deferred list with rationale in `ETNOS_ROADMAP.md`.

---

## File Reference

All modified files tracked in `CUSTOMIZATIONS.md` with `// ETNOS:` markers.
