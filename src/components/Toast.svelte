<script lang="ts">
  import { toastNotification } from '../stores/favorites';
</script>

{#if $toastNotification}
  <div
    class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-swiss-elevated border border-obsidian-900/20 bg-obsidian-900 text-alabaster-50 transition-all duration-200 animate-fade-in"
    role="status"
    aria-live="polite"
  >
    <span class="flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-black shrink-0
      {$toastNotification.type === 'success' ? 'bg-mint text-obsidian-900' : ''}
      {$toastNotification.type === 'remove' ? 'bg-signal-crimson text-alabaster-50' : ''}
      {$toastNotification.type === 'info' ? 'bg-alabaster-200 text-obsidian-900' : ''}">
      {#if $toastNotification.type === 'success'}
        ✓
      {:else if $toastNotification.type === 'remove'}
        ×
      {:else}
        i
      {/if}
    </span>

    <div class="text-xs font-semibold">
      {$toastNotification.message}
    </div>
  </div>
{/if}
