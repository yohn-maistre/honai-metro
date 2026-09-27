<script lang="ts">
  import { browser } from '$app/environment'
  import { page } from '$app/state'
  import { site } from '$lib/api/client.svelte'
  import { t } from '$lib/app/i18n'
  import { settings, SSR_ENABLED } from '$lib/app/settings.svelte'
  import Location from '$lib/feature/filter/Location.svelte'
  import Sort from '$lib/feature/filter/Sort.svelte'
  import ViewSelect from '$lib/feature/filter/ViewSelect.svelte'
  import PostFeed from '$lib/feature/post/feed/PostFeed.svelte'
  import VirtualFeed from '$lib/feature/post/feed/VirtualFeed.svelte'
  import Skeleton from '$lib/ui/generic/Skeleton.svelte'
  import { Pageination } from '$lib/ui/layout'
  import { Button } from 'mono-svelte'
  import { ArrowRight, Icon } from 'svelte-hero-icons/dist'

  let { data = $bindable() } = $props()

  $effect(() => {
    if (data.filters.value.sort)
      settings.defaultSort.sort = data.filters.value.sort
    if (data.filters.value.type_)
      settings.defaultSort.feed = data.filters.value.type_
  })

  const FeedComponent = $derived(
    settings.infiniteScroll && browser && !settings.posts.noVirtualize
      ? VirtualFeed
      : PostFeed,
  )

  const feedLabel = $derived(
    data.filters.value.type_ === 'Subscribed'
      ? 'Mengikuti'
      : data.filters.value.type_ === 'Local'
        ? 'Sekitar'
        : data.filters.value.type_ === 'All'
          ? 'Jaringan'
          : 'Untukmu',
  )
</script>

<svelte:head>
  <title>
    {SSR_ENABLED && site.data
      ? site.data.site_view.site.name
      : $t('routes.frontpage.title')}
  </title>
</svelte:head>

<header class="signal-feed-head">
  <details class="signal-feed-mode">
    <summary>{feedLabel}<span aria-hidden="true">⌄</span></summary>
    <div class="signal-feed-menu">
      <a href="?type=All">Jaringan</a>
      <a href="?type=Subscribed">Mengikuti</a>
      <a href="?type=Local">Sekitar</a>
    </div>
  </details>
  <a class="signal-feed-explore" href="/explore">Jelajah →</a>
</header>

<a class="signal-composer" href="/create">
  <span class="signal-composer-avatar">＋</span>
  <span>Bagikan sesuatu ke komunitas…</span>
</a>

<details class="signal-feed-tools">
  <summary>Atur feed</summary>
  <form
    class="contents"
    method="get"
    action={page.url.pathname}
  >
    <div
      class="flex flex-row items-center gap-x-4 gap-y-2 max-w-full flex-wrap justify-end"
    >
      <Location
        name="type"
        navigate
        baseClass="flex flex-row items-center gap-2 *:my-0"
        bind:selected={data.filters.value.type_!}
      />
      <Sort
        placement="bottom"
        name="sort"
        navigate
        baseClass="flex flex-row items-center gap-2 *:my-0"
        bind:selected={data.filters.value.sort!}
      />
      <ViewSelect
        placement="bottom"
        baseClass="flex flex-row items-center gap-2 *:my-0"
      />

      <noscript>
        <Button class="h-8.5 aspect-square" size="custom" submit>
          <Icon src={ArrowRight} size="16" micro />
        </Button>
      </noscript>
    </div>
  </form>
</details>

{#await data.feed.value}
  <div class="space-y-4">
    {#each new Array(5) as _, index}{_}
      <div
        class="animate-pop-in"
        style="animation-delay: {index * 50}ms; opacity: 0; width: {(1 /
          ((index + 1) % 3)) *
          100}%"
      >
        <Skeleton />
      </div>
    {/each}
  </div>
{:then feed}
  <FeedComponent
    bind:posts={feed.posts}
    bind:lastSeen={
      () => feed.client.lastSeen ?? 0, (v) => (feed.client.lastSeen = v)
    }
    bind:params={feed.params}
    virtualList={{ itemHeights: feed.client?.itemHeights ?? [] }}
  />
  <svelte:element
    this={settings.infiniteScroll && !settings.posts.noVirtualize
      ? 'noscript'
      : 'div'}
  >
    <Pageination
      cursor={{ next: feed.next_page }}
      href={(page) =>
        typeof page == 'number' ? `?page=${page}` : `?cursor=${page}`}
      back={false}
    />
  </svelte:element>
{/await}

<style>
  .signal-feed-head {
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--etnos-line-strong);
  }
  .signal-feed-mode { position: relative; }
  .signal-feed-mode summary {
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 690;
    letter-spacing: -0.025em;
  }
  .signal-feed-mode summary::-webkit-details-marker { display: none; }
  .signal-feed-menu {
    position: absolute;
    z-index: 40;
    top: calc(100% + 10px);
    left: 0;
    width: 170px;
    padding: 6px;
    border: 1px solid var(--etnos-line-strong);
    border-radius: 10px;
    background: var(--etnos-panel);
    box-shadow: 0 18px 60px rgba(0,0,0,.3);
  }
  .signal-feed-menu a {
    display: block;
    padding: 9px 10px;
    border-radius: 7px;
    color: inherit;
    text-decoration: none;
    font-size: .78rem;
  }
  .signal-feed-menu a:hover { background: rgba(255,255,255,.055); }
  .signal-feed-explore { color: var(--etnos-muted); text-decoration: none; font-size: .7rem; font-weight: 650; }

  .signal-composer {
    min-height: 62px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--etnos-line);
    color: var(--etnos-muted);
    text-decoration: none;
    font-size: .82rem;
  }
  .signal-composer-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    background: var(--etnos-panel-2);
    color: var(--etnos-ink);
    font-size: 1.05rem;
  }
  .signal-feed-tools { border-bottom: 1px solid var(--etnos-line); padding: 8px 0; }
  .signal-feed-tools summary { cursor: pointer; list-style: none; color: var(--etnos-muted); font-size: .65rem; font-weight: 650; }
  .signal-feed-tools summary::-webkit-details-marker { display: none; }
  .signal-feed-tools form > div { padding-top: 8px; }

  :global(.signal-main .post-container) { border-color: var(--etnos-line) !important; }
  :global(.signal-main .post-container > article) {
    padding-top: 18px !important;
    padding-bottom: 18px !important;
    background: transparent !important;
  }
  :global(.signal-main .post-container h3) {
    font-size: clamp(1.12rem, 2.6vw, 1.35rem) !important;
    line-height: 1.18 !important;
    letter-spacing: -0.03em !important;
    font-weight: 650 !important;
  }
  :global(.signal-main .post-container section) { line-height: 1.62; }
  :global(.signal-main .post-container .meta) { color: var(--etnos-muted) !important; }

  @media (max-width: 760px) {
    .signal-feed-head { min-height: 44px; }
    .signal-composer { min-height: 58px; }
    :global(.signal-main .post-container > article) { padding-left: 0 !important; padding-right: 0 !important; }
  }
</style>
