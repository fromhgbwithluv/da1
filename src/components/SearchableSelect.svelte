<script lang="ts">
  import { normalizeVietnamese } from '../data/provinces';

  export interface SelectItem {
    value: string;
    label: string;
    subLabel?: string;
    group?: string;
    badge?: string;
  }

  let {
    items = [],
    value = $bindable(''),
    placeholder = 'Chọn hoặc tìm kiếm...',
    label = '',
    id = 'searchable-select-' + Math.random().toString(36).substring(2, 7),
    disabled = false,
    allowClear = false,
    required = false,
    onSelect
  }: {
    items: SelectItem[];
    value?: string;
    placeholder?: string;
    label?: string;
    id?: string;
    disabled?: boolean;
    allowClear?: boolean;
    required?: boolean;
    onSelect?: (val: string) => void;
  } = $props();

  let isOpen = $state(false);
  let searchQuery = $state('');
  let highlightedIndex = $state(0);
  let selectContainer: HTMLDivElement | null = $state(null);
  let searchInputRef: HTMLInputElement | null = $state(null);

  // Selected item object
  let selectedItem = $derived(items.find((item) => item.value === value));

  // Filter items based on search query
  let filteredItems = $derived.by(() => {
    if (!searchQuery.trim()) return items;
    const q = normalizeVietnamese(searchQuery);
    return items.filter((item) => {
      const matchLabel = normalizeVietnamese(item.label).includes(q);
      const matchSub = item.subLabel ? normalizeVietnamese(item.subLabel).includes(q) : false;
      const matchBadge = item.badge ? normalizeVietnamese(item.badge).includes(q) : false;
      return matchLabel || matchSub || matchBadge;
    });
  });

  // Group items if groups exist
  let groupedItems = $derived.by(() => {
    const map = new Map<string, SelectItem[]>();
    for (const item of filteredItems) {
      const g = item.group || '';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    }
    return map;
  });

  function toggleOpen() {
    if (disabled) return;
    isOpen = !isOpen;
    if (isOpen) {
      searchQuery = '';
      highlightedIndex = 0;
      setTimeout(() => searchInputRef?.focus(), 50);
    }
  }

  function handleSelect(val: string) {
    value = val;
    isOpen = false;
    searchQuery = '';
    if (onSelect) onSelect(val);
  }

  function handleClear(e: MouseEvent) {
    e.stopPropagation();
    value = '';
    searchQuery = '';
    if (onSelect) onSelect('');
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        toggleOpen();
      }
      return;
    }

    if (e.key === 'Escape') {
      isOpen = false;
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedIndex = (highlightedIndex + 1) % Math.max(1, filteredItems.length);
      scrollHighlightedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedIndex = (highlightedIndex - 1 + filteredItems.length) % Math.max(1, filteredItems.length);
      scrollHighlightedIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[highlightedIndex]) {
        handleSelect(filteredItems[highlightedIndex].value);
      }
    }
  }

  function scrollHighlightedIntoView() {
    setTimeout(() => {
      const el = selectContainer?.querySelector(`[data-index="${highlightedIndex}"]`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }, 10);
  }

  function handleClickOutside(e: MouseEvent) {
    if (selectContainer && !selectContainer.contains(e.target as Node)) {
      isOpen = false;
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative w-full text-left" bind:this={selectContainer}>
  {#if label}
    <label for={id} class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
      {label} {required ? '*' : ''}
    </label>
  {/if}

  <!-- Trigger Box -->
  <button
    type="button"
    {id}
    onclick={toggleOpen}
    onkeydown={handleKeyDown}
    {disabled}
    class="w-full flex items-center justify-between rounded-swiss-sm border px-3 py-2 text-xs font-semibold text-black transition-colors text-left
      {disabled ? 'bg-swiss-100 text-swiss-400 cursor-not-allowed border-swiss-200' : 'bg-white hover:border-black cursor-pointer border-swiss-300'}
      {isOpen ? 'border-black ring-1 ring-black' : ''}"
  >
    <div class="flex items-center gap-2 truncate">
      {#if selectedItem}
        {#if selectedItem.badge}
          <span class="font-mono text-[10px] font-bold uppercase bg-black text-white px-1.5 py-0.2 rounded-swiss-xs shrink-0">
            {selectedItem.badge}
          </span>
        {/if}
        <span class="truncate font-bold text-black">{selectedItem.label}</span>
        {#if selectedItem.subLabel}
          <span class="text-swiss-500 font-normal truncate text-[11px]">({selectedItem.subLabel})</span>
        {/if}
      {:else}
        <span class="text-swiss-400 font-normal truncate">{placeholder}</span>
      {/if}
    </div>

    <div class="flex items-center gap-1 shrink-0 ml-2">
      {#if allowClear && value && !disabled}
        <button
          type="button"
          onclick={handleClear}
          class="text-swiss-400 hover:text-black p-0.5 rounded-swiss-xs"
          title="Xóa lựa chọn"
        >
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
      <svg class="h-4 w-4 text-swiss-400 transition-transform duration-150 {isOpen ? 'rotate-180 text-black' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </button>

  <!-- Dropdown Popover -->
  {#if isOpen}
    <div class="absolute left-0 right-0 z-50 mt-1 rounded-swiss-sm border border-black bg-white shadow-swiss-elevated overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
      <!-- Search Box inside Popover -->
      <div class="p-2 border-b border-swiss-200 bg-swiss-50">
        <div class="relative">
          <svg class="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-swiss-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            bind:this={searchInputRef}
            bind:value={searchQuery}
            onkeydown={handleKeyDown}
            placeholder="Gõ để lọc tìm kiếm..."
            class="w-full rounded-swiss-xs border border-swiss-300 bg-white py-1.5 pl-8 pr-3 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      <!-- Items List -->
      <div class="max-h-60 overflow-y-auto p-1 divide-y divide-swiss-100">
        {#if filteredItems.length === 0}
          <div class="p-4 text-center font-mono text-xs text-swiss-400">
            Không tìm thấy kết quả khớp "{searchQuery}"
          </div>
        {:else}
          {#each Array.from(groupedItems.entries()) as [groupName, groupList]}
            <div>
              {#if groupName}
                <div class="px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-swiss-500 bg-swiss-50/80 sticky top-0">
                  {groupName} ({groupList.length})
                </div>
              {/if}
              {#each groupList as item}
                {@const itemIndex = filteredItems.indexOf(item)}
                {@const isSelected = item.value === value}
                {@const isHighlighted = itemIndex === highlightedIndex}
                <button
                  type="button"
                  data-index={itemIndex}
                  onclick={() => handleSelect(item.value)}
                  onmouseenter={() => (highlightedIndex = itemIndex)}
                  class="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left rounded-swiss-xs transition-colors
                    {isSelected ? 'bg-black text-white font-bold' : isHighlighted ? 'bg-swiss-100 text-black' : 'text-swiss-800'}"
                >
                  <div class="flex items-center gap-2 truncate">
                    {#if item.badge}
                      <span class="font-mono text-[9px] font-bold uppercase px-1 py-0.2 rounded-swiss-xs shrink-0
                        {isSelected ? 'bg-white text-black' : 'bg-black text-white'}">
                        {item.badge}
                      </span>
                    {/if}
                    <span class="truncate">{item.label}</span>
                    {#if item.subLabel}
                      <span class="text-[10px] shrink-0 {isSelected ? 'text-neutral-300' : 'text-swiss-500'}">
                        {item.subLabel}
                      </span>
                    {/if}
                  </div>

                  {#if isSelected}
                    <span class="font-mono text-xs shrink-0 text-signal-emerald">✓</span>
                  {/if}
                </button>
              {/each}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
