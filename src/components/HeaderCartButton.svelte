<script lang="ts">
  import { favoriteJobs, openDrawer } from '../stores/favorites';
  import { currentUser } from '../stores/auth';
</script>

{#if $currentUser?.role !== 'company'}
  <button
    type="button"
    id="header-saved-jobs-btn"
    onclick={openDrawer}
    class="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200
    {$favoriteJobs.length > 0
      ? 'bg-obsidian-900 text-mint border-obsidian-900 shadow-sm hover:bg-obsidian-800'
      : 'bg-alabaster-50 text-obsidian-900 border-obsidian-900/15 hover:border-obsidian-900 hover:bg-mint/20'}"
    aria-label="Xem danh sách việc đã ghim ({$favoriteJobs.length})"
    title="Giỏ hồ sơ / Việc đã ghim ({$favoriteJobs.length})"
  >
    <svg
      class="h-5 w-5 transition-transform duration-200 group-hover:scale-105 {$favoriteJobs.length > 0 ? 'fill-mint text-mint' : 'text-obsidian-900'}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>

    {#if $favoriteJobs.length > 0}
      <span
        class="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-alabaster-50 bg-mint px-1 font-mono text-[10px] font-extrabold text-obsidian-900 shadow-xs"
      >
        {$favoriteJobs.length}
      </span>
    {/if}
  </button>
{/if}
