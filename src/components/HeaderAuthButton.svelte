<script lang="ts">
  import {
    currentUser,
    openAuthModal,
    openPostJobModal,
    openUpgradeModal,
    getCompanyMonthlyJobStats,
    logout
  } from '../stores/auth';
  import { url } from '../utils/url';

  let isDropdownOpen = $state(false);

  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }

  function handleLogout() {
    isDropdownOpen = false;
    logout();
  }
</script>

<svelte:window onclick={(e) => {
  const target = e.target as HTMLElement;
  if (!target.closest('#user-profile-menu-container')) {
    isDropdownOpen = false;
  }
}} />

{#if $currentUser}
  <div id="user-profile-menu-container" class="relative inline-flex items-center gap-2.5 text-left">
    {#if $currentUser.role === 'company'}
      <button
        type="button"
        onclick={() => openPostJobModal()}
        class="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-mint px-3.5 py-2 text-xs font-bold text-obsidian-900 border border-obsidian-900/20 hover:bg-mint-400 transition-all shadow-xs"
      >
        <span>+ Đăng tuyển</span>
      </button>
    {/if}

    <button
      type="button"
      id="user-profile-btn"
      onclick={toggleDropdown}
      class="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-obsidian-900 bg-alabaster-50 text-obsidian-900 transition-all duration-200 hover:ring-4 hover:ring-mint/40 focus:outline-none"
      aria-expanded={isDropdownOpen}
      aria-haspopup="true"
      title="{$currentUser.fullName} (@{$currentUser.username})"
    >
      {#if $currentUser.avatar}
        <img
          src={$currentUser.avatar}
          alt={$currentUser.fullName}
          class="h-full w-full rounded-full object-cover"
        />
      {:else}
        <div class="flex h-full w-full items-center justify-center rounded-full bg-obsidian-900 font-display text-xs font-bold text-mint">
          {$currentUser.fullName.charAt(0)}
        </div>
      {/if}
      <span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-alabaster-50 bg-mint"></span>
    </button>

    {#if isDropdownOpen}
      <div
        class="absolute right-0 mt-2.5 top-full w-72 origin-top-right rounded-2xl border border-obsidian-900/15 bg-alabaster-50 p-2 shadow-swiss-elevated z-50 animate-fade-in"
        role="menu"
      >
        <div class="px-3.5 py-3 border-b border-obsidian-900/10">
          <div class="flex items-center gap-3">
            {#if $currentUser.avatar}
              <img
                src={$currentUser.avatar}
                alt={$currentUser.fullName}
                class="h-10 w-10 rounded-full object-cover border border-obsidian-900 shrink-0"
              />
            {:else}
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-obsidian-900 font-display text-sm font-bold text-mint shrink-0">
                {$currentUser.fullName.charAt(0)}
              </div>
            {/if}
            <div class="min-w-0 flex-1">
              <span class="inline-block font-mono text-[10px] font-bold uppercase tracking-wider bg-mint text-obsidian-900 px-2 py-0.5 rounded-full">
                {$currentUser.role === 'company' ? 'Doanh nghiệp' : 'Sinh viên'}
              </span>
              <p class="text-sm font-bold text-obsidian-900 truncate mt-1">{$currentUser.fullName}</p>
              <p class="font-mono text-xs text-swiss-500 truncate">@{$currentUser.username}</p>
            </div>
          </div>
        </div>

        <div class="py-1.5 space-y-0.5">
          <a
            href={url(`/profile/@${$currentUser.username}`)}
            class="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-obsidian-800 hover:bg-mint/25 hover:text-obsidian-900 transition-colors"
            role="menuitem"
          >
            <div class="flex items-center gap-2.5">
              <svg class="h-4 w-4 text-obsidian-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Hồ sơ cá nhân công khai</span>
            </div>
            <span class="font-mono text-xs text-obsidian-900 font-bold">→</span>
          </a>

          {#if $currentUser.role !== 'company'}
            <a
              href={url(`/profile/@${$currentUser.username}?tab=applications`)}
              onclick={() => (isDropdownOpen = false)}
              class="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-obsidian-800 hover:bg-mint/25 hover:text-obsidian-900 transition-colors"
              role="menuitem"
            >
              <div class="flex items-center gap-2.5">
                <svg class="h-4 w-4 text-obsidian-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Lịch sử ứng tuyển ({$currentUser.appliedJobs?.length || 0})</span>
              </div>
              <span class="font-mono text-xs text-swiss-500 font-bold">→</span>
            </a>
          {/if}

          {#if $currentUser.role === 'company'}
            {@const stats = getCompanyMonthlyJobStats($currentUser.id)}
            <div class="mx-2 my-1.5 p-3 rounded-xl bg-alabaster-100 border border-obsidian-900/10 font-mono text-[11px] space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-swiss-500 uppercase text-[10px]">GÓI HIỆN TẠI:</span>
                <span class="font-bold text-obsidian-900 uppercase flex items-center gap-1">
                  {#if $currentUser.subscriptionTier === 'enterprise'}
                    <span>ENTERPRISE</span>
                  {:else if $currentUser.subscriptionTier === 'premium'}
                    <span class="text-amber-600">PREMIUM ✦</span>
                  {:else}
                    <span>GÓI FREE</span>
                  {/if}
                </span>
              </div>
              <div class="flex items-center justify-between text-[10px] text-swiss-600">
                <span>Đã đăng:</span>
                <span class="font-bold text-obsidian-900">{stats.usedCount} / {stats.maxPosts === Infinity ? '∞' : stats.maxPosts} bài</span>
              </div>

              {#if $currentUser.subscriptionTier !== 'enterprise'}
                <button
                  type="button"
                  onclick={() => { isDropdownOpen = false; openUpgradeModal(); }}
                  class="w-full mt-1 rounded-lg bg-obsidian-900 px-2.5 py-1.5 text-[10px] font-bold uppercase text-mint hover:bg-obsidian-800 transition-colors flex items-center justify-center gap-1"
                >
                  <span>✦ Nâng cấp gói Premium</span>
                </button>
              {/if}
            </div>
          {/if}

          <a
            href={url(`/profile/@${$currentUser.username}?tab=settings`)}
            onclick={() => (isDropdownOpen = false)}
            class="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-obsidian-800 hover:bg-mint/25 hover:text-obsidian-900 transition-colors"
            role="menuitem"
          >
            <div class="flex items-center gap-2.5">
              <svg class="h-4 w-4 text-obsidian-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{$currentUser.role === 'company' ? 'Cài đặt doanh nghiệp' : 'Cài đặt hồ sơ & CV'}</span>
            </div>
            <span class="font-mono text-xs text-swiss-500 font-bold">→</span>
          </a>
        </div>

        <div class="border-t border-obsidian-900/10 pt-1.5">
          <button
            type="button"
            onclick={handleLogout}
            class="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-bold text-signal-crimson hover:bg-red-500/10 transition-colors"
            role="menuitem"
          >
            <svg class="h-4 w-4 text-signal-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <!-- Not logged in state: Circular Avatar Button matching Sketch 1 -->
  <button
    type="button"
    id="header-auth-btn"
    onclick={() => openAuthModal('login')}
    class="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-obsidian-900/20 bg-alabaster-50 text-obsidian-900 hover:border-obsidian-900 hover:bg-mint/30 transition-all duration-200"
    aria-label="Đăng nhập / Tài khoản"
    title="Đăng nhập / Đăng ký tài khoản"
  >
    <svg class="h-5 w-5 text-obsidian-900 transition-transform duration-200 group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  </button>
{/if}
