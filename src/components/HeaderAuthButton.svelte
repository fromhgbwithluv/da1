<script lang="ts">
  import {
    currentUser,
    openAuthModal,
    openPostJobModal,
    openUpgradeModal,
    openApplicationHistoryModal,
    getCompanyMonthlyJobStats,
    logout
  } from '../stores/auth';

  let isDropdownOpen = $state(false);

  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }

  function handleOpenProfileSettings() {
    isDropdownOpen = false;
    openAuthModal('profile');
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
  <!-- Logged in state (Swiss Minimalist) -->
  <div id="user-profile-menu-container" class="relative inline-flex items-center gap-2 text-left">
    <!-- If company, show quick post job button in header -->
    {#if $currentUser.role === 'company'}
      <button
        type="button"
        onclick={openPostJobModal}
        class="hidden sm:inline-flex items-center gap-1 rounded-swiss-sm bg-signal-emerald px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase text-white hover:bg-emerald-700 transition-colors shadow-xs"
      >
        <span>+ Đăng tin việc</span>
      </button>
    {/if}

    <button
      type="button"
      id="user-profile-btn"
      onclick={toggleDropdown}
      class="inline-flex items-center gap-2 rounded-swiss-md border border-swiss-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-black transition-colors hover:border-black"
      aria-expanded={isDropdownOpen}
      aria-haspopup="true"
    >
      <!-- Square mono avatar -->
      {#if $currentUser.avatar}
        <img
          src={$currentUser.avatar}
          alt={$currentUser.fullName}
          class="h-6 w-6 rounded-swiss-sm object-cover border border-black shrink-0"
        />
      {:else}
        <div class="flex h-6 w-6 items-center justify-center rounded-swiss-sm bg-black font-mono text-[10px] font-bold text-white shrink-0">
          {$currentUser.fullName.charAt(0)}
        </div>
      {/if}

      <div class="hidden text-left sm:block">
        <span class="block text-xs font-bold text-black leading-tight max-w-[120px] truncate">
          {$currentUser.fullName}
        </span>
        <span class="block font-mono text-[9px] uppercase tracking-wide text-swiss-500 leading-none">
          @{$currentUser.username} • {$currentUser.role === 'company' ? 'DOANH NGHIỆP' : 'SINH VIÊN'}
        </span>
      </div>

      <svg class="h-3 w-3 text-swiss-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {#if isDropdownOpen}
      <div
        class="absolute right-0 mt-2 top-full w-64 origin-top-right rounded-swiss-md border border-black bg-white p-2 shadow-swiss-elevated z-50 animate-fade-in"
        role="menu"
      >
        <div class="px-3 py-2 border-b border-swiss-200">
          <div class="flex items-center gap-2.5">
            {#if $currentUser.avatar}
              <img
                src={$currentUser.avatar}
                alt={$currentUser.fullName}
                class="h-9 w-9 rounded-swiss-sm object-cover border border-black shrink-0"
              />
            {:else}
              <div class="flex h-9 w-9 items-center justify-center rounded-swiss-sm bg-black font-mono text-xs font-bold text-white shrink-0">
                {$currentUser.fullName.charAt(0)}
              </div>
            {/if}
            <div class="min-w-0 flex-1">
              <span class="font-mono text-[9px] font-bold uppercase tracking-wider bg-black text-white px-1.5 py-0.2 rounded-swiss-sm">
                {$currentUser.role === 'company' ? 'DOANH NGHIỆP' : 'SINH VIÊN'}
              </span>
              <p class="text-xs font-bold text-black truncate mt-0.5">{$currentUser.fullName}</p>
              <p class="font-mono text-[10px] text-swiss-500 truncate">@{$currentUser.username}</p>
            </div>
          </div>
        </div>

        <div class="py-1">
          <!-- Direct public profile link as requested: https://website.com/profile/@username -->
          <a
            href="/profile/@{$currentUser.username}"
            class="flex w-full items-center justify-between rounded-swiss-sm px-3 py-2 text-xs font-medium text-swiss-800 hover:bg-swiss-100 hover:text-black transition-colors"
            role="menuitem"
          >
            <div class="flex items-center gap-2">
              <svg class="h-3.5 w-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Xem trang cá nhân công khai</span>
            </div>
            <span class="font-mono text-[9px] text-signal-emerald font-bold">→</span>
          </a>

          {#if $currentUser.role !== 'company'}
            <button
              type="button"
              onclick={() => { isDropdownOpen = false; openApplicationHistoryModal(); }}
              class="flex w-full items-center justify-between rounded-swiss-sm px-3 py-2 text-xs font-medium text-swiss-800 hover:bg-swiss-100 hover:text-black transition-colors"
              role="menuitem"
            >
              <div class="flex items-center gap-2">
                <svg class="h-3.5 w-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Lịch sử ứng tuyển ({$currentUser.appliedJobs?.length || 0})</span>
              </div>
              <span class="font-mono text-[9px] text-swiss-500 font-bold">→</span>
            </button>
          {/if}

          {#if $currentUser.role === 'company'}
            <button
              type="button"
              onclick={() => { isDropdownOpen = false; openPostJobModal(); }}
              class="flex w-full items-center justify-between rounded-swiss-sm px-3 py-2 text-xs font-medium text-swiss-800 hover:bg-swiss-100 hover:text-black transition-colors"
              role="menuitem"
            >
              <div class="flex items-center gap-2">
                <svg class="h-3.5 w-3.5 text-signal-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span class="font-bold text-signal-emerald">Đăng tin tuyển dụng mới</span>
              </div>
            </button>

            <!-- Company Subscription Status Widget -->
            {@const stats = getCompanyMonthlyJobStats($currentUser.id)}
            <div class="mx-2 my-1.5 p-2.5 rounded-swiss-sm bg-swiss-50 border border-swiss-300 font-mono text-[11px] space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-swiss-500 uppercase text-[10px]">GÓI HIỆN TẠI:</span>
                <span class="font-bold text-black uppercase flex items-center gap-1">
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
                <span class="font-bold text-black">{stats.usedCount} / {stats.maxPosts === Infinity ? '∞' : stats.maxPosts} bài</span>
              </div>

              {#if $currentUser.subscriptionTier !== 'enterprise'}
                <button
                  type="button"
                  onclick={() => { isDropdownOpen = false; openUpgradeModal(); }}
                  class="w-full mt-1 rounded-swiss-sm bg-black px-2 py-1 text-[10px] font-bold uppercase text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1"
                >
                  <span class="text-amber-400">✦</span>
                  <span>Nâng cấp gói Premium</span>
                </button>
              {/if}
            </div>
          {/if}

          <button
            type="button"
            onclick={handleOpenProfileSettings}
            class="flex w-full items-center justify-between rounded-swiss-sm px-3 py-2 text-xs font-medium text-swiss-800 hover:bg-swiss-100 hover:text-black transition-colors"
            role="menuitem"
          >
            <div class="flex items-center gap-2">
              <svg class="h-3.5 w-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Chỉnh sửa thông tin & CV</span>
            </div>
          </button>
        </div>

        <div class="border-t border-swiss-200 pt-1">
          <button
            type="button"
            onclick={handleLogout}
            class="flex w-full items-center gap-2 rounded-swiss-sm px-3 py-1.5 text-xs font-semibold text-signal-crimson hover:bg-red-50 transition-colors"
            role="menuitem"
          >
            <svg class="h-3.5 w-3.5 text-signal-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <!-- Not logged in state -->
  <button
    type="button"
    id="header-auth-btn"
    onclick={() => openAuthModal('login')}
    class="inline-flex items-center gap-1.5 rounded-swiss-md border border-swiss-300 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:border-black transition-colors"
  >
    <svg class="h-3.5 w-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
    <span class="hidden sm:inline uppercase tracking-wide text-[11px] font-bold">Đăng nhập / Đăng ký</span>
    <span class="sm:hidden font-bold">Tài khoản</span>
  </button>
{/if}
