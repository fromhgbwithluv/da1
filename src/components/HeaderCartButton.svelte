<script lang="ts">
  import { favoriteJobs, openDrawer } from '../stores/favorites';
  import { currentUser } from '../stores/auth';
</script>

{#if $currentUser?.role !== 'company'}
  <button
    type="button"
    id="header-saved-jobs-btn"
    onclick={openDrawer}
    class="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-swiss-md text-xs font-semibold transition-all duration-150 border
    {$favoriteJobs.length > 0 
      ? 'bg-black text-white border-black hover:bg-neutral-800' 
      : 'bg-white text-swiss-800 border-swiss-300 hover:border-black hover:text-black'}"
    aria-label="Xem danh sách việc đã ghim ({$favoriteJobs.length})"
  >
    <svg class="w-4 h-4 {$favoriteJobs.length > 0 ? 'text-white fill-white' : 'text-swiss-700'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>

    <span class="hidden sm:inline uppercase tracking-wide text-[11px] font-bold">Việc đã ghim</span>
    
    {#if $favoriteJobs.length > 0}
      <span class="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded-swiss-sm bg-signal-emerald text-white">
        {$favoriteJobs.length}
      </span>
    {/if}
  </button>
{/if}
