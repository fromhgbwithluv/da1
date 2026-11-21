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
    triggerClass = '',
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
    triggerClass?: string;
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
      setTimeout(() => searchInputRef?.focus(), 40);
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
      e.preventDefault();
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
    <label for={id} class="block text-xs font-bold text-obsidian-800 mb-1.5">
      {label}
      {#if required}
        <span class="text-signal-crimson">*</span>
      {/if}
    </label>
  {/if}

  <!-- Trigger Wrapper (Sibling clear button avoids invalid nested <button>) -->
  <div class="relative flex items-center w-full">
    <button
      type="button"
      {id}
      onclick={toggleOpen}
      onkeydown={handleKeyDown}
      {disabled}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      class={triggerClass
        ? `w-full flex items-center justify-between text-left transition-all ${triggerClass} ${
            allowClear && value && !disabled ? 'pr-14' : ''
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${
            isOpen ? 'border-obsidian-900 bg-alabaster-50 ring-2 ring-mint/50' : ''
          }`
        : `w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-medium text-obsidian-900 transition-all text-left ${
            allowClear && value && !disabled ? 'pr-14' : 'pr-9'
          } ${
            disabled
              ? 'bg-alabaster-200/70 text-swiss-400 cursor-not-allowed border-obsidian-900/10'
              : 'bg-alabaster-100/60 hover:border-obsidian-900/40 cursor-pointer border-obsidian-900/15'
          } ${isOpen ? 'border-obsidian-900 bg-alabaster-50 ring-2 ring-mint/50' : ''}`}
    >
      <div class="flex items-center gap-2 min-w-0 flex-1">
        {#if selectedItem}
          {#if selectedItem.badge}
            <span class="rounded-md border border-mint-500/35 bg-mint/25 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-obsidian-900 shrink-0">
              {selectedItem.badge}
            </span>
          {/if}
          <span class="truncate font-semibold text-obsidian-900">{selectedItem.label}</span>
          {#if selectedItem.subLabel}
            <span class="text-obsidian-600 font-normal truncate text-[11px] shrink-0">
              ({selectedItem.subLabel})
            </span>
          {/if}
        {:else}
          <span class="text-swiss-400 font-normal truncate">{placeholder}</span>
        {/if}
      </div>
    </button>

    <!-- Sibling Clear & Chevron Controls -->
    <div class="pointer-events-none absolute right-2.5 flex items-center gap-1">
      {#if allowClear && value && !disabled}
        <button
          type="button"
          onclick={handleClear}
          class="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full text-obsidian-600 hover:bg-obsidian-900/10 hover:text-obsidian-900 transition-colors cursor-pointer"
          title="Xóa lựa chọn"
          aria-label="Xóa lựa chọn"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
      <svg
        class="h-4 w-4 text-obsidian-600 transition-transform duration-200 {isOpen ? 'rotate-180 text-obsidian-900' : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>

  <!-- Dropdown Popover -->
  {#if isOpen}
    <div
      class="absolute left-0 right-0 z-50 mt-2 rounded-2xl border-2 border-obsidian-900 bg-alabaster-50 shadow-[0_16px_40px_rgba(14,20,18,0.16)] overflow-hidden"
      role="listbox"
      data-lenis-prevent
    >
      <!-- Search Box inside Popover -->
      <div class="p-2.5 border-b border-obsidian-900/10 bg-alabaster-100/80">
        <div class="relative flex items-center">
          <svg
            class="pointer-events-none absolute left-3 h-3.5 w-3.5 text-obsidian-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            bind:this={searchInputRef}
            bind:value={searchQuery}
            onkeydown={handleKeyDown}
            placeholder="Gõ để tìm nhanh..."
            class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-50 py-2 pl-9 pr-8 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
          />
          {#if searchQuery}
            <button
              type="button"
              onclick={() => {
                searchQuery = '';
                highlightedIndex = 0;
                searchInputRef?.focus();
              }}
              class="absolute right-2 flex h-5 w-5 items-center justify-center rounded-full text-obsidian-600 hover:bg-obsidian-900/10 hover:text-obsidian-900 transition-colors cursor-pointer"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>

        {#if searchQuery.trim()}
          <div class="mt-1.5 flex items-center justify-between px-1 font-mono text-[10px] font-semibold text-obsidian-600">
            <span>Tìm thấy {filteredItems.length} kết quả</span>
            <span>Enter để chọn</span>
          </div>
        {/if}
      </div>

      <!-- Items List -->
      <div class="max-h-64 overflow-y-auto p-1.5 space-y-0.5" data-lenis-prevent>
        {#if filteredItems.length === 0}
          <div class="px-4 py-6 text-center space-y-1">
            <p class="font-display text-xs font-bold text-obsidian-800">
              Không tìm thấy kết quả phù hợp
            </p>
            <p class="text-[11px] text-obsidian-600">
              Thử từ khóa khác thay cho "{searchQuery}"
            </p>
          </div>
        {:else}
          {#each Array.from(groupedItems.entries()) as [groupName, groupList]}
            <div>
              {#if groupName}
                <div class="sticky top-0 z-10 flex items-center justify-between px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-obsidian-600 bg-alabaster-100/95 backdrop-blur-sm rounded-lg mb-0.5">
                  <span>{groupName}</span>
                  <span class="rounded-full bg-alabaster-50 px-1.5 py-0.5 text-[9px] text-obsidian-700 border border-obsidian-900/10">
                    {groupList.length}
                  </span>
                </div>
              {/if}
              {#each groupList as item}
                {@const itemIndex = filteredItems.indexOf(item)}
                {@const isSelected = item.value === value}
                {@const isHighlighted = itemIndex === highlightedIndex}
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-index={itemIndex}
                  onclick={() => handleSelect(item.value)}
                  onmouseenter={() => (highlightedIndex = itemIndex)}
                  class="w-full flex items-center justify-between gap-2.5 px-3 py-2 text-xs text-left rounded-xl transition-colors cursor-pointer
                    {isSelected
                      ? 'bg-mint/25 border border-mint-500/40 text-obsidian-900 font-bold'
                      : isHighlighted
                        ? 'bg-alabaster-100 text-obsidian-900 border border-transparent'
                        : 'text-obsidian-800 border border-transparent hover:bg-alabaster-100'}"
                >
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    {#if item.badge}
                      <span
                        class="rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase shrink-0
                        {isSelected
                          ? 'border-mint-500/40 bg-alabaster-50 text-mint-800'
                          : 'border-obsidian-900/10 bg-alabaster-200/75 text-obsidian-700'}"
                      >
                        {item.badge}
                      </span>
                    {/if}
                    <span class="truncate">{item.label}</span>
                    {#if item.subLabel}
                      <span class="text-[11px] shrink-0 text-obsidian-600 font-normal">
                        {item.subLabel}
                      </span>
                    {/if}
                  </div>

                  {#if isSelected}
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-500 text-[10px] font-black text-alabaster-50">
                      ✓
                    </span>
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
