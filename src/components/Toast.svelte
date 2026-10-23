<script lang="ts">
  import { toastNotification } from '../stores/favorites';
</script>

{#if $toastNotification}
  <div
    class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-swiss-sm shadow-swiss-elevated border border-black transition-all duration-200 animate-fade-in
    {$toastNotification.type === 'success' ? 'bg-black text-white' : ''}
    {$toastNotification.type === 'remove' ? 'bg-black text-white' : ''}
    {$toastNotification.type === 'info' ? 'bg-white text-black' : ''}"
    role="status"
    aria-live="polite"
  >
    <span class="font-mono text-[11px] font-black shrink-0
      {$toastNotification.type === 'success' ? 'text-signal-emerald' : ''}
      {$toastNotification.type === 'remove' ? 'text-signal-crimson' : ''}
      {$toastNotification.type === 'info' ? 'text-black' : ''}">
      {#if $toastNotification.type === 'success'}
        [OK]
      {:else if $toastNotification.type === 'remove'}
        [DEL]
      {:else}
        [INFO]
      {/if}
    </span>

    <div class="font-mono text-xs font-medium">
      {$toastNotification.message}
    </div>
  </div>
{/if}
