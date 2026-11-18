<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'black',
    size = 'xs',
    text = '',
    dot = false,
    uppercase = true,
    class: customClass = '',
    children,
  } = $props<{
    variant?: 'black' | 'white' | 'emerald' | 'amber' | 'crimson' | 'outline' | 'gray';
    size?: 'xs' | 'sm' | 'md';
    text?: string;
    dot?: boolean;
    uppercase?: boolean;
    class?: string;
    children?: Snippet;
  }>();

  const variantClasses = {
    black: 'bg-obsidian-900 text-mint border-obsidian-900',
    white: 'bg-alabaster-50 text-obsidian-900 border-obsidian-900/20',
    emerald: 'bg-mint text-obsidian-900 border-obsidian-900/20',
    amber: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
    crimson: 'bg-signal-crimson/15 text-signal-crimson border-signal-crimson/30',
    outline: 'bg-transparent text-obsidian-900 border-obsidian-900',
    gray: 'bg-alabaster-100 text-obsidian-700 border-obsidian-900/10',
  };

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 rounded-full',
    sm: 'text-[11px] px-2.5 py-0.5 rounded-full',
    md: 'text-xs px-3 py-1 rounded-full',
  };
</script>

<span
  class="inline-flex items-center gap-1 font-mono font-bold tracking-wide border transition-colors {variantClasses[variant]} {sizeClasses[size]} {uppercase ? 'uppercase' : ''} {customClass}"
>
  {#if dot}
    <span
      class="h-1.5 w-1.5 rounded-full shrink-0 {variant === 'emerald' ? 'bg-obsidian-900' : variant === 'amber' ? 'bg-amber-500' : variant === 'crimson' ? 'bg-signal-crimson' : 'bg-current'}"
    ></span>
  {/if}

  {#if text}
    <span>{text}</span>
  {/if}

  {#if children}
    {@render children()}
  {/if}
</span>
