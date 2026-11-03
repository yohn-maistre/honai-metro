<script lang="ts">
  import * as Select from '$lib/components/ui/select/index.js'
  let {
    value = $bindable(''),
    items,
    onchange,
    onbeforechange,
    id,
    name,
    required = false,
    disabled = false,
    compact = false,
    'aria-label': label,
    class: className = '',
  }: {
    onchange?: (value: string) => void
    onbeforechange?: (value: string) => boolean
    value?: string
    items: { value: string; label: string; disabled?: boolean }[]
    id?: string
    name?: string
    required?: boolean
    disabled?: boolean
    compact?: boolean
    'aria-label'?: string
    class?: string
  } = $props()
  const uid = $props.id()
  let selectionVersion = $state(0)
  const choices = $derived(
    items.map((item) => ({ ...item, value: item.value || '__strata_empty__' })),
  )
</script>

{#key selectionVersion}<Select.Root
    type="single"
    {disabled}
    {required}
    name={name ?? (required ? 'choice-' + uid : undefined)}
    items={choices}
    value={value || ''}
    onValueChange={(next) => {
      const proposed = next === '__strata_empty__' ? '' : next
      if (onbeforechange && !onbeforechange(proposed)) {
        selectionVersion++
        return
      }
      value = next === '__strata_empty__' ? '' : next
      onchange?.(value)
    }}
    allowDeselect={false}
  >
    <Select.Trigger
      {id}
      aria-label={label}
      class={'app-choice ' + (compact ? 'app-choice-compact ' : '') + className}
    >
      <span>
        {items.find((item) => item.value === value)?.label ?? 'Pilih'}
      </span>
    </Select.Trigger>
    <Select.Content
      class={compact
        ? 'app-choice-menu app-choice-menu-compact'
        : 'app-choice-menu'}
    >
      {#each choices as item}<Select.Item
          value={item.value}
          label={item.label}
          disabled={item.disabled}
        />{/each}
    </Select.Content>
  </Select.Root>
{/key}
