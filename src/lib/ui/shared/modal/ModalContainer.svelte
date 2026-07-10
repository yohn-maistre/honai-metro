<script lang="ts">
  import { Button, Modal } from 'mono-svelte'
  import { Icon } from 'svelte-hero-icons/dist'
  import { shownModal } from './modal'

  // Instance of the currently shown Modal, so action buttons can dismiss
  // through its close() path (which pops the history entry it pushed).
  let modalRef = $state<{ close: () => void }>()
</script>

{#key $shownModal}
  {#if $shownModal}
    <Modal
      bind:this={modalRef}
      title={$shownModal.title}
      dismissable={$shownModal.dismissable}
      ondismissed={() => shownModal.set(undefined)}
      open={true}
    >
      {#if $shownModal.snippet}
        {@render $shownModal.snippet?.()}
      {/if}
      {#if $shownModal.body}
        <p>{$shownModal.body}</p>
      {/if}
      {#if $shownModal.actions}
        <div
          class="flex items-center gap-2 {$shownModal.actions.length >= 3
            ? 'flex-col'
            : 'flex-row'}"
        >
          {#each $shownModal.actions as action (action)}
            <Button
              size="lg"
              class="flex-1 w-full"
              onclick={() => {
                action.action()
                if (action.close) modalRef?.close()
              }}
              color={action.type}
            >
              {#if action.icon}
                <Icon src={action.icon} mini size="16" />
              {/if}
              {action.content}
            </Button>
          {/each}
        </div>
      {/if}
    </Modal>
  {/if}
{/key}
