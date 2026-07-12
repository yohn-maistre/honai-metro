<script lang="ts">
  import type { PrivateMessageView } from '$lib/api/types'
  import { t } from '$lib/app/i18n'
  import Markdown from '$lib/app/markdown/Markdown.svelte'
  import { publishedToDate } from '$lib/ui/util/date'
  import { Button, Menu, MenuButton } from 'mono-svelte'
  import RelativeDate from 'mono-svelte/util/RelativeDate.svelte'
  import { EllipsisVertical, Flag, Icon, Trash } from 'svelte-hero-icons/dist'

  interface Props {
    message: PrivateMessageView
    primary?: boolean
    ondelete?: (shouldDelete: boolean) => void
    onreport?: (report: boolean) => void
    showTimestamp?: boolean
  }

  let {
    message,
    primary = false,
    ondelete,
    onreport,
    showTimestamp = true,
  }: Props = $props()
</script>

<div
  class="group relative w-full flex gap-1 items-center {primary
    ? 'flex-row-reverse'
    : 'flex-row'}"
>
  <div>
    <div
      class="{primary
        ? 'bg-primary-900 text-slate-50 dark:bg-primary-100 dark:text-zinc-900 rounded-br-md'
        : 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 rounded-bl-md'} rounded-2xl w-full px-3.5 py-2"
    >
      <Markdown
        rendererOptions={{ autoloadImages: false }}
        source={message.private_message.content}
        class="w-full"
      />
    </div>
    {#if showTimestamp}
      <RelativeDate
        class="text-[11px] block mt-0.5 text-slate-500 dark:text-zinc-400 {primary
          ? 'mr-1 text-right'
          : 'ml-1'}"
        date={publishedToDate(message.private_message.published)}
      />
    {/if}
  </div>
  <Menu>
    {#snippet target(attachment)}
      <Button
        {@attach attachment}
        color="tertiary"
        class="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all shrink-0"
        size="square-md"
        rounding="pill"
        title={$t('post.actions.more.actions')}
      >
        <Icon src={EllipsisVertical} size="16" micro />
      </Button>
    {/snippet}
    {#if primary}
      <MenuButton
        color="danger-subtle"
        onclick={() => ondelete?.(true)}
        icon={Trash}
      >
        {$t('post.actions.more.delete')}
      </MenuButton>
    {:else}
      <MenuButton
        color="danger-subtle"
        onclick={() => onreport?.(true)}
        icon={Flag}
      >
        {$t('moderation.report')}
      </MenuButton>
    {/if}
  </Menu>
</div>
