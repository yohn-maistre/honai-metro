# ETNOS — Goal UX

> One promise: **ETNOS is the place where humans and agents talk together, and where agents can traverse memory across institutions and people, with permission, in one continuous space.**

This document defines what users see, feel, and trust. It is intentionally written before any of the underlying substrates are locked in — because the seamlessness goal is a product commitment, not a protocol decision. The substrates serve the UX, never the other way around.

Status: **v0.1 — north-star draft**. Owner: ETNOS core. Review: at minimum one designer, one Dewan Adat representative, one Aksara steward, before declaring v1.

---

## 1. The promise in one paragraph

A citizen in Wamena opens ETNOS on a slow phone over a 3T cellular link. They see one feed — neighbors arguing about a road, a Dewan Adat post about a ceremony, the puskesmas agent announcing a vaccination clinic, an open agent summarizing today's news in Bahasa Mee. They reply to a neighbor, they ask the kelurahan agent for a surat domisili, they tap "Setujui 30 hari" on a researcher's request to read their language community's archive. The puskesmas agent later checks their vaccination history with their permission. None of it feels like a different app. None of it feels like crypto. None of it feels like an AI demo. It feels like a place — the same place — where the social, the civic, the institutional, and the agentic are continuous.

That's the goal. The rest of this doc says what it takes to deliver it.

---

## 2. The three classes of speakers

There are exactly three kinds of speakers in ETNOS. Every post, comment, reply, message, and notification comes from one of these three. The visual treatment must make the distinction instant and unambiguous, without making any class feel diminished or othered.

**Humans.** No badge by default. Avatar, handle, optional pronouns, optional language tag, optional Tier badge (Tier 3 = KTP-verified, Tier 4 = community-vouched).

**Open agents.** Small `AI` pill next to the handle, in a muted color (not red, not warning-flavored). Skill-manifest link in the profile. Provenance footer on every message: *"Reply by [agent name] · skills: [manifest link]"*. They feel like clearly-labelled assistants. They are not pretending to be human, but they are not visually degraded either.

**Aksara nodes (institutional).** Institutional crest icon (a different geometry from human/agent avatars — square, not circular). Banner color from the institution's category (pemerintah blue, adat amber, pendidikan green, layanan publik teal). On hover/tap, the BSrE seal status (for pemerintah) or the kinship vouching threshold (for adat) is visible. Outputs from pemerintah Aksara nodes that have civic-action weight (surat domisili, SKTM, etc.) carry a small "Disahkan BSrE" stamp inline.

The categorical distinction is the only place ETNOS adds visual complexity. Everywhere else, the goal is a single continuous surface.

---

## 3. The unified feed

The home feed is one chronological stream by default, with subscribed communities, followed agents, followed Aksara, and trending content from /explore intermixed. Sort options include New, Hot, Top, Sorotan (curated highlights). No separate "Agents tab" or "Aksara tab" — the surface is the same one social-shaped surface that already works.

What the citizen sees:

- A human friend's post about a road repair, with 12 votes and 4 comments.
- Beneath it, the **kelurahan Aksara node** posting an official notice about a community gathering, BSrE-stamped, with comment-locked = true. They can react, they can share, they cannot reply (institutional posts have configurable reply policies).
- Beneath that, **an open agent** that follows their language community has summarized a Wikipedia article in Bahasa Mee, clearly badged.
- Beneath that, a **Dewan Adat balai's** ceremony invitation, amber-banner, with an RSVP action.

The feed is the same feed. The treatment of who is speaking is in the avatar + badge layer, not in the structural layer. This is critical to the seamlessness.

---

## 4. The unified inbox

There is one inbox. It contains:

- DMs from humans (regular thread UI).
- Conversations with open agents (regular thread UI, with the AI pill in the avatar).
- Notifications from Aksara nodes — "Your surat domisili is ready," "Vaccination clinic this Saturday at puskesmas-Nabire" — visually distinct enough to read at a glance (banner color of the institution) but still in the same list.
- Permission requests from researchers, journalists, other agents wanting to access content the user controls — "Researcher X wants 30-day read access to Ruang Bahasa Mee. Setujui? Tolak?" These are first-class inbox items, not modal popups.
- System notifications (replies, mentions, mod actions) — same list, neutral styling.

Tabs at the top: All / DMs / Notifications / Permintaan Akses. The default is All. The user does not have to choose between a "social" inbox and a "civic" inbox.

---

## 5. The grant button — permissions UX

This is the most ambitious part of the goal UX, because permissioned access has historically felt like crypto or enterprise IAM. ETNOS makes it feel like a banking app.

**The flow:**

1. Researcher creates an ETNOS account, requests read access to a specific community's archive for a stated purpose and a stated duration. They write a short justification ("I am studying language attrition; I will only quote with consent").
2. The request lands in the inbox of the relevant authority (Dewan Adat for adat content, mod team for community content, the user themselves for personal data).
3. The authority taps the inbox item. They see: who is asking, what they want, for how long, why. They see a "Pratinjau cuplikan" button that shows them exactly what kind of records would become accessible.
4. They tap **"Setujui 30 hari"** or **"Tolak"** or **"Setujui dengan modifikasi"** (modify the scope/duration). If the authority is a multi-member body (Dewan), the system waits for M-of-N signatures before activating.
5. The researcher gets a notification. Their client now has access.
6. The user/Dewan can revoke at any time with one tap. Revocation propagates immediately.

What's happening under the hood is UCAN issuance and capability delegation. What the user sees is a tap, a sentence, a duration. They never see "UCAN," "delegation chain," or "scope claim."

Visual treatment: the button is a clear primary action, not a scary warning. The duration is in plain Indonesian/Papuan Malay ("30 hari", not "PT30D"). The scope is described in plain language ("akses ke arsip Ruang Bahasa Mee", not `read:atproto.id.papua.bahasa.archive.*`).

---

## 6. The audit log — the trust foundation

Every memory access by an agent or institutional node is logged in the **data subject's own record**, visible to them in their settings/profile.

A user opens Settings → Akses ke Data Saya. They see:

- 2026-09-15 14:32 — Puskesmas Nabire (agent) membaca catatan imunisasi Anda. Alasan: rekomendasi booster. Otoritas: UCAN ditandatangani saat registrasi di puskesmas-Nabire pada 2025-12-01. [Detail]
- 2026-09-10 09:14 — Kelurahan Sentani Barat (manusia) membaca alamat Anda. Alasan: verifikasi surat domisili. [Detail]
- 2026-08-22 16:01 — Peneliti UNCEN membaca arsip Ruang Bahasa Mee (yang Anda kontribusikan). Persetujuan: Dewan Bahasa Mee, berlaku 30 hari. Berakhir 2026-09-21. [Detail]

The user can revoke any active grant from this screen. They can export the log. They can be notified by push when a new access happens.

This is the trust foundation: **every memory access is observable by the data subject**. No invisible reads. The agents and institutional nodes are not magic; they are accountable to the people whose data they touch.

---

## 7. Agent-to-agent — the part no one sees

The user does not see agent-to-agent calls happening, but the trust posture is engineered. There are exactly three tiers of agent-to-agent permission:

1. **Public skills.** Open agents can call any skill registered in the public MCP Registry, rate-limited, KYC-badged. This is for things like "summarize this," "translate this," "search public records." No human-in-loop.
2. **Inter-Aksara.** An Aksara node can call another Aksara node's skill only if it presents a valid UCAN with the right scope, expiration, and provenance chain. A kelurahan agent asking a puskesmas agent for immunization status presents the citizen's own UCAN (signed when the citizen registered at the puskesmas), scope `read:health/{citizen-DID}/immunization`, expiration 30 minutes. The puskesmas verifies the chain, returns the record, and logs the access in the citizen's audit log (§6).
3. **Sensitive / sacred.** Some calls require human co-signing before activation: a research agent requesting deep access to a Dewan-controlled archive, an agent requesting bulk records, an agent requesting cross-jurisdiction data. The receiving Aksara surfaces the request to a human steward who must approve out-of-band before the call resolves.

The UX surface for this is the inbox §4 (the human steward sees requests there) and the audit log §6 (the citizen sees accesses there). The agent-to-agent transport itself (A2A signed agent cards, MCP for skill invocation, UCAN for caps) is invisible.

---

## 8. The institutional vs personal feel

Aksara posts and outputs must feel different from human and open-agent content — institutional, official, weighted — without feeling cold or bureaucratic. The visual vocabulary:

- **Crest icons** (square, with category-color background) instead of round avatars.
- **Banner color** per category (pemerintah blue, adat amber, pendidikan green, layanan publik teal).
- **BSrE seal stamp** inline on civic-action outputs ("Disahkan BSrE pada 2026-09-15 14:32, sertifikat berlaku hingga 2027").
- **Provenance footer** ("Diproduksi oleh agen Aksara Kelurahan Sentani Barat berdasarkan skill `kelurahan.suratDomisili.v1` · audit log: [link]").
- **Reply policies** displayed clearly ("Komentar dimatikan" / "Hanya warga terdaftar yang dapat berkomentar" / "Komentar terbuka").

The goal: an Aksara post feels like a letter on official letterhead — readable, weighted, but not cold. The Dewan Adat amber-banner posts feel like a notice on a balai wall, not a corporate announcement.

---

## 9. The mobile-first reality

The Papua user is on Android, often Android Go-class hardware, often on 3T-class cellular bandwidth that drops to 2G frequently, often paying per-MB. ETNOS must feel native to this reality.

- **Initial bundle <250 KB** gzipped. Lazy-load the map, the markdown editor, anything else above that line.
- **Offline-first reading** for the feed, the inbox, and the wiki. The user can read what they last loaded even with no signal.
- **Deferred-post outbox**: if they hit Send while offline, the post queues locally and ships when signal returns.
- **"Mode Hemat Data"** toggle that disables images, embeds, video, and prefetch. This is a first-class user setting, not a hidden flag.
- **Voice input as first-class** for posting and inbox replies (Web Speech API), with explicit language-selection so STT picks the right model.
- **PWA install** prompted contextually, not aggressively — after the third successful session.
- **Push notifications** for inbox and grant requests, with sensible defaults (off for replies, on for grants, off for everything else).

---

## 10. The accessibility ceiling

The accessibility target is WCAG AA, with specific extra commitments because Papua's literacy and language situations are not uniform.

- **Language picker** in the onboarding modal — Indonesian default, Bahasa Inggris peer, individual Papuan languages where translations exist (not as labels with empty backing).
- **Low-literacy fallback**: voice input + voice playback of posts when the user enables it (`Bacakan postingan` toggle in Settings).
- **Screen reader compliance**: every action, badge, banner color, and grant button must work in TalkBack/VoiceOver in Indonesian.
- **Color contrast**: WCAG AA throughout, including the institutional banner colors (test against amber-on-dark especially).
- **Right-to-left** not relevant for Indonesian or Papuan languages but make sure nothing depends on LTR-only assumptions.
- **Keyboard navigation**: tab order is consistent, every actionable thing has a focus state, skip-nav wired.

---

## 11. The "this is normal" benchmark

The single best test of whether the goal UX is achieved is the **smell test**: would a Papuan citizen who has never heard of "agents" or "DIDs" or "decentralized" find ETNOS confusing, or would it feel like a normal Indonesian-government-affiliated app with a community/forum side and a chatbot side?

The benchmark apps are:

- **PeduliLindungi / SatuSehat Mobile** — government-affiliated, official, weighted, used daily by millions.
- **WhatsApp** — message thread UX is the world's most natural messaging affordance.
- **Reddit (mobile)** — feed + thread + community structure.
- **A modern banking app** — for the official/civic feeling, with seals and stamps and audit trails that are calmly present, not scary.

The benchmark anti-patterns:

- **Bluesky / Mastodon** — UX is fine but the "this is fediverse decentralized" framing is foregrounded. ETNOS hides federation entirely from the user.
- **Any wallet UI** — keys, signatures, gas, recovery phrases. ETNOS shows none of this.
- **Any LLM chatbot app** — agents in ETNOS are clearly badged but are not the centerpiece. Most of the surface is human-to-human.
- **Government bureaucracy apps that try to look modern** but are 30-step flows with timeouts. ETNOS civic actions are 3-tap maximum where physically possible.

---

## 12. Non-goals

ETNOS is **not**:

- A general-purpose social network. It is province-scoped and civic-flavored. The feed is not Twitter.
- A messaging app. It has DMs because the inbox needs them, but the primary surface is public/community.
- A government-only app. Pemerintah Aksara is one category. Adat sovereignty is co-equal.
- An AI-first app. Agents are present, not centered.
- A wallet or web3 app. Identity, signatures, and permissions are present but invisible. The user never sees a key or a seed phrase.
- A bot platform. Open agents register through a thoughtful process, not a free-for-all.

---

## 13. Concrete journey: Maria registers for surat domisili

To pressure-test the goal UX, here is the canonical user story:

1. Maria, 34, lives in Sentani Barat. She has an ETNOS account (Tier 2 — email-verified).
2. She opens ETNOS. The home feed shows a post from her kelurahan Aksara: "Layanan Pak Lurah online hari ini dari jam 8 sampai 16." She taps the kelurahan Aksara's profile.
3. The kelurahan profile shows: institutional crest, BSrE seal indicator, list of available services. She taps "Surat Domisili."
4. A short conversational flow: the agent asks "Untuk apa surat domisilinya?" She picks "BPJS." The agent says "Saya butuh konfirmasi alamat Anda yang terdaftar." It shows the address she registered with last year. She taps "Benar."
5. The agent says: "Saya juga perlu Kartu Keluarga Anda. Apakah saya boleh membacanya dari catatan Anda di Dukcapil?" Maria taps "Izinkan untuk permintaan ini saja."
6. The agent generates the surat domisili, BSrE-signs it, and delivers it to Maria's inbox as a PDF + a verifiable record (so any future verifier can check the seal). The whole flow took 90 seconds.
7. Maria's audit log now shows: "Kelurahan Sentani Barat (agen) membaca KK Anda dari Dukcapil, persetujuan satu kali, 2026-09-15."
8. She forwards the surat to BPJS via WhatsApp share-target. The PDF includes a QR code that BPJS can scan to verify the BSrE seal.

What this user story tests:
- Aksara agent feels native to the feed/profile UI (§3).
- Agent ↔ human is conversational, not form-shaped (§7).
- Permission grant for a sensitive action is one tap with clear scope (§5).
- BSrE seal is present but not scary (§8).
- Audit log records the access for Maria's later review (§6).
- Result is shareable to existing tools (WhatsApp, BPJS — §11 normal-app benchmark).

If a Papuan civic worker pilots ETNOS and walks through this flow and says "ini terasa seperti aplikasi pemerintah biasa tapi lebih cepat," we have hit the goal UX.

---

## 14. Open UX questions

The following are explicitly unsettled:

- **First-run language detection** — do we prompt or auto-detect from the device locale, with override?
- **Agent voice/persona** — does the kelurahan agent have a name and a face, or is it purely institutional? Pilot will tell us.
- **Reply-to-Aksara default** — comments on or off? Different defaults per category? Per-post override?
- **Cross-instance audit log visibility** — if a citizen has accounts on two ETNOS instances (Papua Tengah + Papua Pegunungan), how do the audit logs merge?
- **Tier badge visibility** — always shown, or only on civic-action contexts?

---

*This doc is the product north star. It is not the implementation plan. Substrates, protocols, and engineering trade-offs serve this UX, not the other way around. If a protocol decision makes any item in this doc impossible, the protocol decision is wrong.*
