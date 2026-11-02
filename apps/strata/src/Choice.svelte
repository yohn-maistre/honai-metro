<script lang="ts">
  import * as Select from '$lib/components/ui/select/index.js'
  let {
    value = $bindable(''),
    items,
    onchange,
    id,
    name,
    required = false,
    disabled = false,
    compact = false,
    'aria-label': label,
    class: className = '',
  }: {
    onchange?: (value: string) => void
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
  const choices = $derived(
    items.map((item) => ({ ...item, value: item.value || '__strata_empty__' })),
  )
</script>

<Select.Root
  type="single"
  {disabled}
  {required}
  name={name ?? (required ? 'choice-' + uid : undefined)}
  items={choices}
  value={value || ''}
  onValueChange={(next) => {
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
    <span>{items.find((item) => item.value === value)?.label ?? 'Pilih'}</span>
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
