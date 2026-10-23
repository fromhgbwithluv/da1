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
    black: 'bg-black text-white border-black',
    white: 'bg-white text-black border-swiss-300',
    emerald: 'bg-signal-emerald/10 text-signal-emerald border-signal-emerald/30',
    amber: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    crimson: 'bg-signal-crimson/10 text-signal-crimson border-signal-crimson/30',
    outline: 'bg-transparent text-black border-black',
    gray: 'bg-swiss-100 text-swiss-700 border-swiss-200',
  };

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 rounded-swiss-xs',
    sm: 'text-[10px] px-2 py-0.5 rounded-swiss-sm',
    md: 'text-xs px-2.5 py-1 rounded-swiss-sm',
  };
</script>

<span
  class="inline-flex items-center gap-1 font-mono font-bold tracking-wider border transition-colors {variantClasses[variant]} {sizeClasses[size]} {uppercase ? 'uppercase' : ''} {customClass}"
>
  {#if dot}
    <span
      class="h-1.5 w-1.5 rounded-full shrink-0 {variant === 'emerald' ? 'bg-signal-emerald' : variant === 'amber' ? 'bg-amber-500' : variant === 'crimson' ? 'bg-signal-crimson' : 'bg-current'}"
    ></span>
  {/if}

  {#if text}
    <span>{text}</span>
  {/if}

  {#if children}
    {@render children()}
  {/if}
</span>
