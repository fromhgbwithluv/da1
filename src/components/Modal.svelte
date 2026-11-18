<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    isOpen = false,
    onClose = () => {},
    title = '',
    subtitle = '',
    iconText = '',
    maxWidth = '2xl',
    hideHeader = false,
    bodyClass = 'p-6',
    ariaLabel = '',
    children,
    headerExtra,
    footer,
  } = $props<{
    isOpen: boolean;
    onClose?: () => void;
    title?: string;
    subtitle?: string;
    iconText?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    hideHeader?: boolean;
    bodyClass?: string;
    ariaLabel?: string;
    children?: Snippet;
    headerExtra?: Snippet;
    footer?: Snippet;
  }>();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
    <!-- Backdrop button -->
    <button
      type="button"
      class="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-default w-full h-full border-none transition-opacity"
      onclick={onClose}
      aria-label="Đóng cửa sổ"
    ></button>

    <!-- Modal Dialog (Swiss Architectural Box) -->
    <div
      class="relative my-8 w-full {maxWidthClasses[maxWidth]} rounded-swiss-md bg-white shadow-swiss-elevated border border-black overflow-hidden transition-all duration-200 z-10"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title || 'Hộp thoại'}
      tabindex="-1"
    >
      {#if !hideHeader && (title || iconText)}
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-black px-6 py-4 bg-swiss-50">
          <div class="flex items-center gap-3">
            {#if iconText}
              <div class="flex h-8 w-8 items-center justify-center rounded-swiss-sm bg-black text-white font-mono font-bold text-xs shrink-0">
                {iconText}
              </div>
            {/if}
            <div>
              <h2 class="text-sm font-black uppercase tracking-tight text-black">
                {title}
              </h2>
              {#if subtitle}
                <p class="font-mono text-[11px] text-swiss-500 uppercase tracking-wide">
                  {subtitle}
                </p>
              {/if}
            </div>
          </div>

          <div class="flex items-center gap-2">
            {#if headerExtra}
              {@render headerExtra()}
            {/if}

            <button
              type="button"
              onclick={onClose}
              class="rounded-swiss-sm p-1.5 text-black hover:bg-swiss-200 transition-colors border border-transparent hover:border-black"
              aria-label="Đóng"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      {/if}

      <!-- Modal Body -->
      <div class="{bodyClass}">
        {#if children}
          {@render children()}
        {/if}
      </div>

      {#if footer}
        <!-- Modal Footer -->
        <div class="border-t border-black bg-swiss-50 px-6 py-3.5">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
