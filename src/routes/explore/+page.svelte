<script lang="ts">
  import bahasa from '$lib/etnos/data/bahasa.json'
  import PetaSimpul from '$lib/etnos/PetaSimpul.svelte'

  let { data } = $props()

  type DirCommunity = {
    name: string
    slug: string
    subtitle?: string
    region?: string
  }
  type DirGroup = {
    category: string
    description?: string
    communities: DirCommunity[]
  }

  const groups = data.directory.groups as DirGroup[]
  const totalKomunitas = groups.reduce((n, group) => n + group.communities.length, 0)
  const regionCounts: Record<string, number> = {}
  for (const group of groups)
    for (const community of group.communities)
      if (community.region)
        regionCounts[community.region] = (regionCounts[community.region] ?? 0) + 1

  const highlights = groups.slice(0, 5)
</script>

<svelte:head>
  <title>Jelajah · ETNOS</title>
</svelte:head>

<section class="signal-explore">
  <header class="signal-explore-hero">
    <div>
      <span class="signal-eyebrow">Jelajahi ruang publik</span>
      <h1>Jelajah<em>.</em></h1>
      <p>Tempat, komunitas, pengetahuan, perkembangan, institusi, data, dan kerja publik yang saling terhubung.</p>
    </div>

    <form class="signal-explore-search" action="/search" method="get">
      <span aria-hidden="true">⌕</span>
      <input name="q" type="search" placeholder="Cari orang, komunitas, post, atau institusi…" aria-label="Cari ETNOS" />
      <button type="submit">Cari</button>
    </form>
  </header>

  <div class="signal-explore-map">
    <PetaSimpul {regionCounts} />
  </div>

  <nav class="signal-object-grid" aria-label="Jelajah utama">
    <a href="/explore/communities">
      <span>Komunitas</span>
      <strong>{totalKomunitas}</strong>
      <p>Ruang diskusi yang ditemukan atau dikurasi untuk deployment ini.</p>
      <b>Jelajahi →</b>
    </a>
    <a href="/explore/topics">
      <span>Kategori</span>
      <strong>Topics</strong>
      <p>Pengelompokan komunitas hierarkis milik PieFed, ditampilkan dengan bahasa ETNOS.</p>
      <b>Buka →</b>
    </a>
    <a href="/explore/feeds">
      <span>Ruang saya</span>
      <strong>Feeds</strong>
      <p>Lensa multi-komunitas dari PieFed untuk ruang yang ingin kamu ikuti dekat-dekat.</p>
      <b>Buka →</b>
    </a>
    <a href="/explore/watch" class="signal-watch-tile">
      <span>Pantauan</span>
      <strong>Watch</strong>
      <p>Perkembangan berbasis bukti dan sumber. Ini grammar editorial, bukan feed sosial kedua.</p>
      <b>Lihat →</b>
    </a>
  </nav>

  <section class="signal-explore-section">
    <header>
      <div><span class="signal-eyebrow">Ruang yang ada</span><h2>Komunitas dan kategori</h2></div>
      <a href="/explore/communities">Semua komunitas →</a>
    </header>
    <div class="signal-ledger">
      {#each highlights as group}
        <a href={`/search?type=Communities&q=${encodeURIComponent(group.category)}`}>
          <strong>{group.category}</strong>
          <span>{group.communities.length} ruang</span>
          <p>{group.description || group.communities.slice(0, 3).map((c) => c.name).join(' · ')}</p>
          <b>→</b>
        </a>
      {/each}
    </div>
  </section>

  <section class="signal-explore-section">
    <header>
      <div><span class="signal-eyebrow">Konteks publik</span><h2>Pengetahuan, sinyal, dan kerja</h2></div>
    </header>
    <div class="signal-context-grid">
      <a href="/wiki"><span>Pengetahuan</span><strong>Wiki</strong><p>Referensi yang dipelihara sebagai pengetahuan tahan lama, bukan posting yang tenggelam.</p></a>
      <a href="/explore/pantauan"><span>Sinyal</span><strong>Peta sinyal</strong><p>Lapisan publik yang sudah dimiliki Honai, sekarang ditempatkan sebagai instrumen Explore.</p></a>
      <a href="/work"><span>Koordinasi</span><strong>Kerja publik</strong><p>Prototype PublicWork untuk status, artefak, kontributor dan jejak publik yang aman.</p></a>
      <div><span>Bahasa</span><strong>{bahasa.languages.length}</strong><p>Bahasa yang sudah tercatat di direktori deployment saat ini.</p></div>
    </div>
  </section>
</section>

<style>
  .signal-explore { display:flex; flex-direction:column; gap:34px; padding:26px 0 54px; }
  .signal-explore-hero { display:grid; grid-template-columns:minmax(0,1fr) minmax(320px,.72fr); gap:34px; align-items:end; }
  .signal-eyebrow { display:block; color:var(--etnos-muted); font-size:.58rem; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }
  .signal-explore h1 { margin:.3rem 0 0; font-size:clamp(4.8rem,10vw,8.8rem); line-height:.78; letter-spacing:-.085em; font-weight:720; }
  .signal-explore h1 em { font-family:Georgia,serif; font-weight:400; color:var(--etnos-accent); }
  .signal-explore-hero p { max-width:680px; margin:1.1rem 0 0; color:var(--etnos-muted); font-size:.96rem; line-height:1.55; }
  .signal-explore-search { min-height:48px; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:10px; padding:0 8px 0 14px; border:1px solid var(--etnos-line-strong); border-radius:13px; background:var(--etnos-panel); }
  .signal-explore-search input { min-width:0; border:0; outline:0; background:transparent; color:var(--etnos-ink); }
  .signal-explore-search input::placeholder { color:var(--etnos-muted); }
  .signal-explore-search button { border:0; border-radius:8px; padding:8px 11px; background:var(--etnos-ink); color:var(--etnos-bg); font-weight:700; font-size:.7rem; }

  .signal-explore-map { overflow:hidden; border-block:1px solid var(--etnos-line-strong); padding:14px 0 4px; }
  .signal-explore-map :global(section > div:first-child) { margin-bottom:4px; }
  .signal-explore-map :global(h2) { font-size:.78rem !important; color:var(--etnos-muted); }
  .signal-explore-map :global(canvas) { height:280px !important; }

  .signal-object-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1px; background:var(--etnos-line); border:1px solid var(--etnos-line); }
  .signal-object-grid > a { min-height:210px; display:flex; flex-direction:column; padding:18px; background:var(--etnos-bg); color:inherit; text-decoration:none; }
  .signal-object-grid > a:hover { background:var(--etnos-panel); }
  .signal-object-grid span,.signal-context-grid span { color:var(--etnos-muted); font-size:.57rem; font-weight:700; letter-spacing:.13em; text-transform:uppercase; }
  .signal-object-grid strong { margin-top:34px; font-size:clamp(1.8rem,3vw,2.75rem); line-height:.92; letter-spacing:-.055em; }
  .signal-object-grid p { margin:.8rem 0 0; color:var(--etnos-muted); font-size:.76rem; line-height:1.5; }
  .signal-object-grid b { margin-top:auto; padding-top:20px; font-size:.68rem; font-weight:700; }
  .signal-watch-tile { background:radial-gradient(circle at 85% 10%,rgba(197,200,255,.13),transparent 34%),var(--etnos-bg) !important; }

  .signal-explore-section { display:flex; flex-direction:column; gap:14px; }
  .signal-explore-section > header { display:flex; justify-content:space-between; align-items:end; gap:20px; border-bottom:1px solid var(--etnos-line-strong); padding-bottom:11px; }
  .signal-explore-section h2 { margin:.25rem 0 0; font-size:clamp(1.65rem,3.5vw,2.8rem); line-height:.95; letter-spacing:-.05em; }
  .signal-explore-section > header a { color:var(--etnos-muted); text-decoration:none; font-size:.68rem; }
  .signal-ledger { border-top:1px solid var(--etnos-line); }
  .signal-ledger a { display:grid; grid-template-columns:minmax(170px,.45fr) 90px minmax(0,1fr) auto; gap:18px; align-items:start; padding:15px 0; border-bottom:1px solid var(--etnos-line); color:inherit; text-decoration:none; }
  .signal-ledger strong { font-size:.9rem; }.signal-ledger span,.signal-ledger p { color:var(--etnos-muted); font-size:.72rem; }.signal-ledger p { margin:0; }.signal-ledger b { font-size:.75rem; }
  .signal-context-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
  .signal-context-grid > * { min-height:170px; display:flex; flex-direction:column; padding:16px; border:1px solid var(--etnos-line); border-radius:12px; background:var(--etnos-panel); color:inherit; text-decoration:none; }
  .signal-context-grid strong { margin-top:24px; font-size:1.35rem; letter-spacing:-.04em; }.signal-context-grid p { margin:.6rem 0 0; color:var(--etnos-muted); font-size:.75rem; line-height:1.5; }

  @media (max-width:980px) {
    .signal-explore-hero { grid-template-columns:1fr; }
    .signal-object-grid,.signal-context-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
  }
  @media (max-width:680px) {
    .signal-explore { padding-top:14px; gap:25px; }
    .signal-explore h1 { font-size:clamp(4.4rem,21vw,6.5rem); }
    .signal-object-grid,.signal-context-grid { grid-template-columns:1fr; }
    .signal-object-grid > a { min-height:175px; }
    .signal-ledger a { grid-template-columns:1fr auto; gap:6px 14px; }
    .signal-ledger p { grid-column:1 / -1; }
    .signal-explore-map :global(canvas) { height:230px !important; }
  }
</style>
