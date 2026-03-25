# ETNOS Implementation Plan

## ✅ Phase 1: Setup & Bugfixes (DONE)

- Git remote setup (upstream + origin)
- Honai Metro theme as default, Satoshi/Nunito fonts, scrollbar styling
- Fixed Windows `PostForm.svelte` / `postform.svelte.ts` case collision (upstream bug)
- Fixed locale fallback hang in `+layout.ts`
- `.env` setup: `PUBLIC_INSTANCE_URL=lemmy.ml`, `PUBLIC_LOCK_TO_INSTANCE=true`

## ✅ Phase 2: i18n & Custom Pages (DONE)

- Indonesian (`id.json`) + Papuan Malay (`pmy.json`) language support
- Default language → Indonesian
- Upstream locales commented out (marked `// ETNOS:`)
- Wiki page (`/wiki`) — provincial knowledge base with placeholder content
- Dashboard page (`/dashboard`) — provincial data with placeholder cards
- Sidebar + mobile popup menu buttons for Wiki & Dashboard

---

## 🔮 Phase 3: LLM-Powered Content (PLANNED)

### Wiki Carousel Header
- **Component:** `src/lib/etnos/WikiCarousel.svelte`
- **Content:** "Hari Ini Dalam Sejarah Papua" — fun facts generated daily by LLM
- **Source:** Wikipedia API (`id.wikipedia.org`), curated historical databases
- **Refresh:** Daily for stories/facts
- Carousel sits at the top of the wiki page as a prominent header
- Could also reuse on the dashboard or frontpage

### Wiki Content System
- **Categories:** Tempat, Sejarah, Biodiversitas, Suku & Bahasa, Kuliner
- **Content sources:**
  - Static markdown files in `src/lib/etnos/wiki/` (one-time, updated manually)
  - Wikipedia API for province-specific articles
  - Community posts via Lemmy `c/wiki` community (interactive: comments + upvotes)
- **Refresh:** One-time for static content, unless manually updated
- **Federation:** Each wiki article = a Lemmy post → federates to other ETNOS provincial instances

### Dashboard Data & Charts
- **AI-generated charts:** LLM generates Chart.js/D3 configs from real data
- **Data sources:**
  - BPS Provinsi Papua (`papua.bps.go.id`) — demographics, economy, education
  - Pemerintah Provinsi Papua (`papua.go.id`) — government data
  - Satu Data Indonesia (`satudata.go.id`) — open data portal
- **Categories:**
  - Pendidikan (school participation, literacy, teachers)
  - Ekonomi & APBD (budget, OTSUS funds, investment, PDRB)
  - Infrastruktur (roads, electricity, water, telecom)
  - Kualitas Hidup (IPM, health, life expectancy, poverty)
- **OTSUS tracker** (Papua-specific): transparency dashboard for otonomi khusus funds
- **Refresh:** Weekly for data charts, daily for news summaries

### Provincial Deployment Model
- Each ETNOS instance = one province
- Instances can federate with each other
- Wiki and Dashboard content is province-specific
- Shared components, different data sources per deployment

---

## 🔮 Phase 4: AI Agent Feed (PLANNED)

### Concept
Authorized AI agents post to the ETNOS instance via bot accounts.

### Implementation path
1. **Start:** Create `c/ai-updates` community (zero client code needed)
2. **Later:** Custom tab filter in frontpage sort bar (All / Local / Subscribed / AI)
3. **Future:** Agent authorization management API

### Pyfedi Backend
- AI agents post via Lemmy API using bot accounts
- No custom backend mods needed initially
- Future: custom endpoint for agent authorization

---

## File Reference

All modified files tracked in `CUSTOMIZATIONS.md` with `// ETNOS:` markers.

| Translation files | Purpose |
|---|---|
| `src/lib/app/i18n/id.json` | Bahasa Indonesia (~85% coverage, English fallback) |
| `src/lib/app/i18n/pmy.json` | Melayu Papua (copy of id.json, refine as needed) |
