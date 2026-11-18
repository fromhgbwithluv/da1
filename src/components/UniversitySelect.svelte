<script lang="ts">
  import universities from '../data/universities.json';
  import SearchableSelect, { type SelectItem } from './SearchableSelect.svelte';

  let {
    value = $bindable(''),
    id = 'university-select',
    placeholder = 'Chọn hoặc tìm kiếm trường ĐH / CĐ (327 cơ sở)...',
    label = 'Trường Đại học / Cao đẳng',
    required = false,
  }: {
    value?: string;
    id?: string;
    placeholder?: string;
    label?: string;
    required?: boolean;
  } = $props();

  const universityItems: SelectItem[] = (universities as Array<{ id: number; name: string; code: string }>).map((u) => ({
    value: u.name,
    label: u.name,
    badge: u.code,
    subLabel: `Mã: ${u.code}`,
  }));
</script>

<SearchableSelect
  items={universityItems}
  bind:value={value}
  {id}
  {placeholder}
  {label}
  {required}
  allowClear={true}
/>
