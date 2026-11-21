<script lang="ts">
  import { onMount } from 'svelte';
  import {
    databaseStore,
    currentUser,
    getUserByUsername,
    openPostJobModal,
    openUpgradeModal,
    getCompanyMonthlyJobStats,
    getUserCVs,
    updateProfile,
    uploadCVFile,
    removeCVFile,
    setPrimaryCV,
    uploadAvatar,
    removeAvatar,
    addPortfolioProject,
    removePortfolioProject,
    exportDatabaseJSON
  } from '../stores/auth';
  import { showToast } from '../stores/toast';
  import type { UserProfile } from '../types/user';
  import JobCard from './JobCard.svelte';
  import Badge from './Badge.svelte';
  import UniversitySelect from './UniversitySelect.svelte';
  import { formatDate, isValidVietnamesePhone } from '../utils/formatters';
  import { url } from '../utils/url';

  let rawUsername = $state('');
  let profileUser = $state<UserProfile | null>(null);
  let isLoaded = $state(false);

  // Owner tab & settings form state
  let activeTab = $state<'overview' | 'settings'>('overview');
  let requestedSettingsTab = $state(false);

  let editFullName = $state('');
  let editPhone = $state('');
  let editUniversity = $state('');
  let editAcademicYear = $state('Năm 1');
  let editMajor = $state('');
  let editBio = $state('');
  let editPortfolioLink = $state('');
  let editIndustry = $state('');
  let editAddress = $state('');
  let editWebsite = $state('');

  // Student portfolio & CV vault state
  let showAddProject = $state(false);
  let newProjectTitle = $state('');
  let newProjectDesc = $state('');
  let newProjectLink = $state('');
  let cvUploadLabel = $state('');

  let ownerCVs = $derived(getUserCVs($currentUser));
  let publicCVs = $derived(getUserCVs(profileUser));

  onMount(() => {
    // Extract username from URL path: e.g. /profile/@an.nguyen or /profile/an.nguyen
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1] || '';

    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get('tab') === 'settings' ||
      window.location.hash === '#settings' ||
      window.location.hash === '#cai-dat'
    ) {
      requestedSettingsTab = true;
    }

    if (lastPart && lastPart !== 'profile') {
      rawUsername = decodeURIComponent(lastPart);
    } else {
      rawUsername = urlParams.get('u') || ($currentUser ? '@' + $currentUser.username : '');
    }

    if (rawUsername) {
      profileUser = getUserByUsername(rawUsername);
    }
    isLoaded = true;
  });

  // Re-sync when database updates
  $effect(() => {
    if (rawUsername && $databaseStore) {
      profileUser = getUserByUsername(rawUsername);
    }
  });

  // All jobs posted by this company if role is company
  let companyJobs = $derived(
    profileUser && profileUser.role === 'company'
      ? ($databaseStore.jobs || []).filter(
          (j) =>
            j.authorId === profileUser?.id ||
            j.companyUsername.toLowerCase() === ('@' + profileUser?.username).toLowerCase()
        )
      : []
  );

  let isOwner = $derived(
    Boolean($currentUser && profileUser && $currentUser.id === profileUser.id)
  );

  // Enforce ownership for settings tab & handle ?tab=settings deep link
  $effect(() => {
    if (!isOwner) {
      activeTab = 'overview';
    } else if (requestedSettingsTab) {
      activeTab = 'settings';
      requestedSettingsTab = false;
    }
  });

  // Sync edit form values whenever currentUser changes for the logged-in owner
  $effect(() => {
    if (isOwner && $currentUser) {
      editFullName = $currentUser.fullName;
      editPhone = $currentUser.phone;
      editBio = $currentUser.bio || '';
      if ($currentUser.role === 'student') {
        editUniversity = $currentUser.university || '';
        editAcademicYear = $currentUser.academicYear || 'Năm 1';
        editMajor = $currentUser.major || '';
        editPortfolioLink = $currentUser.portfolioLink || '';
      } else {
        editIndustry = $currentUser.industry || '';
        editAddress = $currentUser.address || '';
        editWebsite = $currentUser.website || '';
      }
    }
  });

  function setTab(tab: 'overview' | 'settings') {
    activeTab = tab;
    if (typeof window !== 'undefined') {
      const nextUrl = new URL(window.location.href);
      if (tab === 'settings') {
        nextUrl.searchParams.set('tab', 'settings');
      } else {
        nextUrl.searchParams.delete('tab');
        if (nextUrl.hash === '#settings' || nextUrl.hash === '#cai-dat') {
          nextUrl.hash = '';
        }
      }
      window.history.replaceState({}, '', nextUrl.toString());
    }
  }

  function handleSaveProfile(e: SubmitEvent) {
    e.preventDefault();
    if (!isOwner || !$currentUser) return;

    if (editPhone && !isValidVietnamesePhone(editPhone)) {
      showToast(
        'Số điện thoại không đúng định dạng di động Việt Nam (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)!',
        'remove'
      );
      return;
    }

    if ($currentUser.role === 'student') {
      updateProfile({
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        university: editUniversity.trim(),
        academicYear: editAcademicYear,
        major: editMajor.trim(),
        bio: editBio.trim(),
        portfolioLink: editPortfolioLink.trim(),
      });
    } else {
      updateProfile({
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        industry: editIndustry.trim(),
        address: editAddress.trim(),
        website: editWebsite.trim(),
        bio: editBio.trim(),
      });
    }
  }

  async function handleCVUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    for (const file of Array.from(input.files)) {
      await uploadCVFile(file, cvUploadLabel);
    }
    cvUploadLabel = '';
    input.value = '';
  }

  function getFileExt(name: string): string {
    const ext = name.split('.').pop()?.toUpperCase();
    return ext && ext.length <= 5 ? ext : 'FILE';
  }

  function handleAddProject(e: SubmitEvent) {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    addPortfolioProject(newProjectTitle.trim(), newProjectDesc.trim(), newProjectLink.trim());
    newProjectTitle = '';
    newProjectDesc = '';
    newProjectLink = '';
    showAddProject = false;
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
</script>

<div class="mx-auto max-w-5xl px-4 py-10 sm:py-12 sm:px-6 lg:px-8">
  {#if !isLoaded}
    <div class="py-20 text-center font-mono text-xs text-swiss-500">
      Đang tải dữ liệu hồ sơ từ hệ thống...
    </div>
  {:else if profileUser}
    <!-- Profile Container (Warm Alabaster + Obsidian + Mint Theme) -->
    <div class="rounded-3xl border-2 border-obsidian-900 bg-alabaster-50 shadow-[0_20px_50px_rgba(14,20,18,0.10)] overflow-hidden">
      <!-- Branded Header Band -->
      <div class="relative overflow-hidden border-b border-obsidian-900/10 bg-alabaster-100/80 bg-organic-dots-light p-6 sm:p-8">
        <div class="pointer-events-none absolute -top-20 right-10 h-48 w-48 rounded-full bg-mint/25 blur-3xl"></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div class="flex items-start gap-4 sm:gap-5">
            <!-- Avatar Container -->
            <div class="relative group/avatar shrink-0">
              {#if profileUser.avatar}
                <img
                  src={profileUser.avatar}
                  alt={profileUser.fullName}
                  class="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-obsidian-900/20 bg-alabaster-50 shadow-xs"
                />
              {:else}
                <div class="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-obsidian-900 text-mint font-display text-2xl sm:text-3xl font-extrabold shadow-xs border-2 border-obsidian-900">
                  {profileUser.fullName.charAt(0)}
                </div>
              {/if}

              {#if isOwner}
                <label class="absolute inset-0 bg-obsidian-950/65 rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-alabaster-50">
                  <svg class="h-4 w-4 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class="font-mono text-[9px] font-bold uppercase mt-1">Đổi ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    onchange={async (e) => {
                      const input = e.target as HTMLInputElement;
                      if (input.files && input.files[0]) {
                        await uploadAvatar(input.files[0]);
                      }
                    }}
                    class="sr-only"
                  />
                </label>
              {/if}
            </div>

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-1.5">
                <Badge variant="black" size="xs">
                  {profileUser.role === 'company' ? 'Doanh nghiệp' : 'Sinh viên'}
                </Badge>
                <span class="font-mono text-xs font-bold text-obsidian-900 bg-alabaster-50 border border-obsidian-900/15 px-2.5 py-0.5 rounded-full">
                  @{profileUser.username}
                </span>

                {#if profileUser.role === 'company'}
                  {#if profileUser.subscriptionTier === 'enterprise'}
                    <Badge variant="emerald" size="xs">ENTERPRISE ✦</Badge>
                  {:else if profileUser.subscriptionTier === 'premium'}
                    <Badge variant="amber" size="xs">PREMIUM ✦</Badge>
                  {:else}
                    <Badge variant="gray" size="xs">GÓI FREE (10 BÀI/THÁNG)</Badge>
                  {/if}
                {/if}
              </div>

              <h1 class="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-obsidian-900 leading-tight">
                {profileUser.fullName}
              </h1>

              <p class="mt-1 text-xs sm:text-sm text-obsidian-700 font-medium">
                {profileUser.role === 'company'
                  ? `${profileUser.industry || 'Lĩnh vực chung'} • ${profileUser.address || 'Việt Nam'}`
                  : `${profileUser.university || 'Đại học / Cao đẳng'} • ${profileUser.major || 'Chuyên ngành'} (${profileUser.academicYear || 'Sinh viên'})`}
              </p>

              {#if profileUser.website}
                <a
                  href={profileUser.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-obsidian-900 underline decoration-mint decoration-2 underline-offset-4 hover:text-obsidian-700"
                >
                  <span>Website: {profileUser.website}</span>
                  <span>→</span>
                </a>
              {/if}
            </div>
          </div>

          <!-- Header Action Buttons -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            {#if isOwner && profileUser.role === 'company'}
              <button
                type="button"
                onclick={openUpgradeModal}
                class="rounded-full border border-obsidian-900/20 bg-alabaster-50 px-4 py-2 font-display text-xs font-bold text-obsidian-900 hover:border-obsidian-900 hover:bg-mint/25 transition-all flex items-center gap-1.5"
              >
                <span class="text-amber-600">✦</span>
                <span>Nâng cấp gói</span>
              </button>
              <button
                type="button"
                onclick={() => openPostJobModal()}
                class="rounded-full bg-obsidian-900 px-4 py-2 font-display text-xs font-bold text-mint hover:bg-obsidian-800 hover:shadow-mint-glow transition-all"
              >
                + Đăng tin tuyển dụng
              </button>
            {/if}
            <a
              href={url('/')}
              class="rounded-full border border-obsidian-900/20 bg-alabaster-50 px-4 py-2 text-xs font-bold text-obsidian-900 hover:border-obsidian-900 transition-colors"
            >
              ← Trang chủ
            </a>
          </div>
        </div>

        <!-- Owner-Only Segmented Pill Tab Switcher -->
        {#if isOwner}
          <div
            class="relative z-10 mt-6 inline-flex flex-wrap items-center gap-1 rounded-full border border-obsidian-900/10 bg-alabaster-50 p-1 shadow-xs"
            role="tablist"
            aria-label="Quản lý hồ sơ"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              onclick={() => setTab('overview')}
              class="rounded-full px-4 py-1.5 text-xs transition-all duration-150
              {activeTab === 'overview'
                ? 'bg-obsidian-900 text-mint font-bold shadow-xs'
                : 'text-obsidian-700 hover:text-obsidian-900 hover:bg-alabaster-100 font-semibold'}"
            >
              Hồ sơ công khai
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'settings'}
              onclick={() => setTab('settings')}
              class="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs transition-all duration-150
              {activeTab === 'settings'
                ? 'bg-obsidian-900 text-mint font-bold shadow-xs'
                : 'text-obsidian-700 hover:text-obsidian-900 hover:bg-alabaster-100 font-semibold'}"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Cài đặt tài khoản</span>
            </button>
          </div>
        {/if}
      </div>

      <!-- Main Body -->
      <div class="p-6 sm:p-8 space-y-6">
        {#if activeTab === 'settings' && isOwner && $currentUser}
          <!-- ================= OWNER ACCOUNT SETTINGS (BOTH STUDENT & COMPANY) ================= -->
          <div class="space-y-6">
            <!-- Avatar Management Block -->
            <div class="rounded-2xl border border-obsidian-900/15 bg-alabaster-100/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-obsidian-900/20 bg-obsidian-900 flex items-center justify-center font-display text-xl font-bold text-mint shadow-xs">
                  {#if $currentUser.avatar}
                    <img src={$currentUser.avatar} alt={$currentUser.fullName} class="h-full w-full object-cover" />
                  {:else}
                    <span>{$currentUser.fullName.charAt(0)}</span>
                  {/if}
                </div>
                <div class="min-w-0">
                  <h4 class="font-display text-sm font-extrabold text-obsidian-900">
                    {$currentUser.role === 'company' ? 'Logo Doanh nghiệp' : 'Ảnh đại diện cá nhân'}
                  </h4>
                  <p class="text-xs text-swiss-500 mt-0.5">
                    {$currentUser.avatar ? 'Đã tải lên ảnh đại diện tùy chỉnh' : 'Đang sử dụng ký tự viết tắt mặc định'}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <label class="cursor-pointer rounded-full bg-obsidian-900 px-4 py-2 text-xs font-bold text-mint hover:bg-obsidian-800 transition-colors">
                  <span>{$currentUser.avatar ? 'Đổi ảnh đại diện' : 'Tải avatar mới'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onchange={async (e) => {
                      const input = e.target as HTMLInputElement;
                      if (input.files && input.files[0]) {
                        await uploadAvatar(input.files[0]);
                      }
                    }}
                    class="sr-only"
                  />
                </label>

                {#if $currentUser.avatar}
                  <button
                    type="button"
                    onclick={removeAvatar}
                    class="rounded-full border border-signal-crimson/30 bg-alabaster-50 px-3.5 py-2 text-xs font-bold text-signal-crimson hover:bg-red-50 transition-colors"
                  >
                    Gỡ ảnh
                  </button>
                {/if}
              </div>
            </div>

            <!-- Student-Only: CV Upload & Portfolio Management -->
            {#if $currentUser.role === 'student'}
              <!-- CV Vault Management -->
              <div class="rounded-2xl border border-obsidian-900/15 bg-alabaster-100/60 p-4 sm:p-5 space-y-3.5">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-900/10 pb-2.5">
                  <div>
                    <span class="font-display text-sm font-extrabold text-obsidian-900 block">
                      Kho CV đính kèm ({ownerCVs.length})
                    </span>
                    <span class="text-xs text-swiss-500">
                      Lưu nhiều phiên bản CV để chọn nhanh cho từng công việc ứng tuyển
                    </span>
                  </div>
                  {#if ownerCVs.length > 0}
                    <span class="font-mono text-[10px] uppercase font-bold tracking-wider bg-obsidian-900 text-mint px-2.5 py-0.5 rounded-full">
                      {ownerCVs.length} file đã lưu
                    </span>
                  {/if}
                </div>

                {#if ownerCVs.length > 0}
                  <div class="space-y-2.5">
                    {#each ownerCVs as cv, idx (cv.id)}
                      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-alabaster-50 p-3.5 border {idx === 0 ? 'border-obsidian-900' : 'border-obsidian-900/15'}">
                        <div class="flex items-center gap-3 min-w-0">
                          <span class="font-mono font-bold text-xs px-2.5 py-1 rounded-lg shrink-0 {idx === 0 ? 'bg-obsidian-900 text-mint' : 'bg-alabaster-200 text-obsidian-900'}">
                            {getFileExt(cv.name)}
                          </span>
                          <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-1.5">
                              <p class="text-xs sm:text-sm font-bold text-obsidian-900 truncate">
                                {cv.name}
                              </p>
                              {#if cv.label}
                                <span class="rounded-full bg-mint/40 px-2 py-0.5 font-mono text-[10px] font-bold text-obsidian-900">
                                  {cv.label}
                                </span>
                              {/if}
                              {#if idx === 0}
                                <span class="rounded-full bg-obsidian-900 px-2 py-0.5 font-mono text-[10px] font-bold text-mint">
                                  Mặc định
                                </span>
                              {/if}
                            </div>
                            <p class="font-mono text-[10px] text-swiss-500 mt-0.5">
                              {formatFileSize(cv.size)} • {new Date(cv.uploadedAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {#if idx > 0 && cv.id}
                            <button
                              type="button"
                              onclick={() => setPrimaryCV(cv.id!)}
                              class="rounded-full border border-obsidian-900/20 bg-alabaster-100 px-3 py-1 text-[11px] font-bold text-obsidian-800 hover:border-obsidian-900 hover:bg-mint/30 transition-colors"
                            >
                              Đặt mặc định
                            </button>
                          {/if}
                          {#if cv.dataUrl}
                            <a
                              href={cv.dataUrl}
                              download={cv.name}
                              class="rounded-full border border-obsidian-900/20 bg-alabaster-50 px-3 py-1 text-[11px] font-bold text-obsidian-900 hover:border-obsidian-900 hover:bg-mint/25 transition-colors"
                            >
                              Tải về
                            </a>
                          {/if}
                          <button
                            type="button"
                            onclick={() => removeCVFile(cv.id)}
                            class="rounded-full p-1.5 text-swiss-500 hover:text-signal-crimson hover:bg-red-50 transition-colors"
                            title="Gỡ file CV này"
                            aria-label="Gỡ file CV"
                          >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}

                <!-- Upload new CV(s) with optional label -->
                <div class="space-y-2.5 pt-1">
                  <input
                    type="text"
                    bind:value={cvUploadLabel}
                    placeholder="Nhãn phân loại (tuỳ chọn, VD: CV Frontend, CV Marketing...)"
                    class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-50 px-3.5 py-2 text-xs text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:outline-none focus:ring-2 focus:ring-mint/50"
                  />
                  <label class="flex flex-col items-center justify-center p-4 sm:p-5 bg-alabaster-50 rounded-xl border border-dashed border-obsidian-900/25 hover:border-obsidian-900 hover:bg-mint/10 cursor-pointer transition-all">
                    <span class="text-xs sm:text-sm font-bold text-obsidian-900">
                      Bấm để thêm file CV vào kho (PDF, DOCX — tối đa 5MB/file)
                    </span>
                    <span class="font-mono text-[11px] text-swiss-500 mt-1">
                      Có thể chọn nhiều file cùng lúc hoặc thêm phiên bản mới bất kỳ lúc nào
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      onchange={handleCVUpload}
                      class="sr-only"
                    />
                  </label>
                </div>
              </div>

              <!-- Student Portfolio Projects Management -->
              <div class="rounded-2xl border border-obsidian-900/15 bg-alabaster-100/60 p-4 sm:p-5 space-y-3.5">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-900/10 pb-2.5">
                  <div>
                    <h4 class="font-display text-sm font-extrabold text-obsidian-900">
                      Dự án & Sản phẩm nổi bật ({$currentUser.portfolioProjects?.length || 0})
                    </h4>
                    <p class="text-xs text-swiss-500 mt-0.5">
                      Hiển thị công khai cho nhà tuyển dụng trên trang cá nhân
                    </p>
                  </div>

                  <button
                    type="button"
                    onclick={() => (showAddProject = !showAddProject)}
                    class="rounded-full border border-obsidian-900/20 bg-alabaster-50 px-3.5 py-1.5 text-xs font-bold text-obsidian-900 hover:border-obsidian-900 hover:bg-mint/25 transition-colors"
                  >
                    {showAddProject ? 'Đóng biểu mẫu' : '+ Thêm dự án'}
                  </button>
                </div>

                {#if showAddProject}
                  <form onsubmit={handleAddProject} class="rounded-xl border border-obsidian-900/15 bg-alabaster-50 p-4 space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label for="new-proj-title" class="block text-xs font-semibold text-obsidian-800 mb-1">
                          Tên dự án <span class="text-signal-crimson">*</span>
                        </label>
                        <input
                          type="text"
                          id="new-proj-title"
                          bind:value={newProjectTitle}
                          required
                          placeholder="Ví dụ: Website Thương mại Điện tử Mini"
                          class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3 py-2 text-xs text-obsidian-900 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                        />
                      </div>
                      <div>
                        <label for="new-proj-link" class="block text-xs font-semibold text-obsidian-800 mb-1">
                          Link Demo / GitHub
                        </label>
                        <input
                          type="url"
                          id="new-proj-link"
                          bind:value={newProjectLink}
                          placeholder="https://github.com/..."
                          class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3 py-2 text-xs text-obsidian-900 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label for="new-proj-desc" class="block text-xs font-semibold text-obsidian-800 mb-1">
                        Mô tả ngắn vai trò & kết quả
                      </label>
                      <textarea
                        id="new-proj-desc"
                        bind:value={newProjectDesc}
                        rows="2"
                        placeholder="Công nghệ sử dụng, vai trò của bạn trong dự án..."
                        class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3 py-2 text-xs text-obsidian-900 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                      ></textarea>
                    </div>

                    <div class="flex justify-end">
                      <button
                        type="submit"
                        class="rounded-full bg-obsidian-900 px-4 py-2 text-xs font-bold text-mint hover:bg-obsidian-800 transition-colors"
                      >
                        Thêm vào hồ sơ
                      </button>
                    </div>
                  </form>
                {/if}

                {#if $currentUser.portfolioProjects && $currentUser.portfolioProjects.length > 0}
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {#each $currentUser.portfolioProjects as proj (proj.id)}
                      <div class="flex items-start justify-between gap-3 rounded-xl border border-obsidian-900/15 bg-alabaster-50 p-3.5">
                        <div class="min-w-0">
                          <h5 class="font-display text-xs sm:text-sm font-extrabold text-obsidian-900 truncate">
                            {proj.title}
                          </h5>
                          {#if proj.description}
                            <p class="text-xs text-obsidian-700 mt-1 line-clamp-2">{proj.description}</p>
                          {/if}
                          {#if proj.link}
                            <a
                              href={proj.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="inline-block mt-1.5 text-[11px] font-bold text-obsidian-900 underline decoration-mint decoration-2 underline-offset-4"
                            >
                              Xem dự án →
                            </a>
                          {/if}
                        </div>

                        <button
                          type="button"
                          onclick={() => removePortfolioProject(proj.id)}
                          class="rounded-full p-1 text-swiss-500 hover:text-signal-crimson hover:bg-red-50 transition-colors shrink-0"
                          title="Xóa dự án"
                          aria-label="Xóa dự án"
                        >
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    {/each}
                  </div>
                {:else if !showAddProject}
                  <p class="text-xs text-swiss-500 italic">
                    Chưa có dự án nào. Thêm dự án để làm nổi bật hồ sơ năng lực của bạn.
                  </p>
                {/if}
              </div>
            {/if}

            <!-- Main Account Info Edit Form -->
            <form onsubmit={handleSaveProfile} class="space-y-4">
              <div class="flex items-center gap-2 border-b border-obsidian-900/10 pb-2.5">
                <span class="h-2 w-2 rounded-full bg-mint-500"></span>
                <h3 class="font-display text-sm sm:text-base font-extrabold text-obsidian-900">
                  Cập nhật thông tin {$currentUser.role === 'company' ? 'Doanh nghiệp' : 'Sinh viên'}
                </h3>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label for="profile-edit-fullname" class="block text-xs font-semibold text-obsidian-800 mb-1.5">
                    {$currentUser.role === 'company' ? 'Tên doanh nghiệp' : 'Họ và tên'} <span class="text-signal-crimson">*</span>
                  </label>
                  <input
                    type="text"
                    id="profile-edit-fullname"
                    bind:value={editFullName}
                    required
                    class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                  />
                </div>

                <div>
                  <label for="profile-edit-phone" class="block text-xs font-semibold text-obsidian-800 mb-1.5">
                    Số điện thoại <span class="text-signal-crimson">*</span>
                  </label>
                  <input
                    type="tel"
                    id="profile-edit-phone"
                    bind:value={editPhone}
                    required
                    maxlength="12"
                    class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                  />
                </div>

                {#if $currentUser.role === 'student'}
                  <div>
                    <label for="profile-edit-university" class="block text-xs font-semibold text-obsidian-800 mb-1.5">
                      Trường Đại học / Cao đẳng <span class="font-normal text-swiss-500">(Bộ GD&ĐT)</span>
                    </label>
                    <UniversitySelect
                      id="profile-edit-university"
                      label=""
                      bind:value={editUniversity}
                      placeholder="Tìm hoặc chọn từ 327 trường ĐH / CĐ..."
                      triggerClass="rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 hover:border-obsidian-900"
                    />
                  </div>

                  <div>
                    <label for="profile-edit-year" class="block text-xs font-semibold text-obsidian-800 mb-1.5">
                      Năm học
                    </label>
                    <select
                      id="profile-edit-year"
                      bind:value={editAcademicYear}
                      class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                    >
                      <option value="Năm 1">Năm 1</option>
                      <option value="Năm 2">Năm 2</option>
                      <option value="Năm 3">Năm 3</option>
                      <option value="Năm 4">Năm 4</option>
                      <option value="Mới tốt nghiệp">Mới tốt nghiệp</option>
                    </select>
                  </div>

                  <div>
                    <label for="profile-edit-major" class="block text-xs font-semibold text-obsidian-800 mb-1.5">
                      Chuyên ngành
                    </label>
                    <input
                      type="text"
                      id="profile-edit-major"
                      bind:value={editMajor}
                      placeholder="CNTT, Marketing, Quản trị..."
                      class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                    />
                  </div>

                  <div>
                    <label for="profile-edit-portfolio" class="block text-xs font-semibold text-obsidian-800 mb-1.5">
                      Link Portfolio / GitHub / LinkedIn
                    </label>
                    <input
                      type="url"
                      id="profile-edit-portfolio"
                      bind:value={editPortfolioLink}
                      placeholder="https://github.com/..."
                      class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                    />
                  </div>
                {:else}
                  <div>
                    <label for="profile-edit-industry" class="block text-xs font-semibold text-obsidian-800 mb-1.5">
                      Lĩnh vực hoạt động
                    </label>
                    <input
                      type="text"
                      id="profile-edit-industry"
                      bind:value={editIndustry}
                      class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                    />
                  </div>

                  <div>
                    <label for="profile-edit-address" class="block text-xs font-semibold text-obsidian-800 mb-1.5">
                      Địa chỉ trụ sở
                    </label>
                    <input
                      type="text"
                      id="profile-edit-address"
                      bind:value={editAddress}
                      class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                    />
                  </div>

                  <div class="sm:col-span-2">
                    <label for="profile-edit-website" class="block text-xs font-semibold text-obsidian-800 mb-1.5">
                      Website / Fanpage chính thức
                    </label>
                    <input
                      type="url"
                      id="profile-edit-website"
                      bind:value={editWebsite}
                      placeholder="https://company.com"
                      class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                    />
                  </div>
                {/if}
              </div>

              <div>
                <label for="profile-edit-bio" class="block text-xs font-semibold text-obsidian-800 mb-1.5">
                  {$currentUser.role === 'company' ? 'Giới thiệu văn hóa công ty' : 'Giới thiệu bản thân'}
                </label>
                <textarea
                  id="profile-edit-bio"
                  bind:value={editBio}
                  rows="3"
                  class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                ></textarea>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-obsidian-900/10">
                <button
                  type="button"
                  onclick={() => setTab('overview')}
                  class="text-xs font-bold text-obsidian-700 hover:text-obsidian-900 transition-colors"
                >
                  ← Xem lại hồ sơ công khai
                </button>

                <button
                  type="submit"
                  class="group inline-flex items-center gap-2.5 rounded-full bg-obsidian-900 px-6 py-3 font-display text-sm font-bold text-alabaster-50 hover:bg-obsidian-800 hover:shadow-mint-glow transition-all"
                >
                  <span>Lưu cập nhật</span>
                  <span class="flex h-5 w-5 items-center justify-center rounded-full bg-mint text-obsidian-900 font-mono text-xs font-black transition-transform duration-200 group-hover:translate-x-0.5">
                    →
                  </span>
                </button>
              </div>
            </form>

            <!-- Export Database JSON (Admin only) -->
            {#if $currentUser.username.toLowerCase() === 'admin'}
              <div class="rounded-2xl border border-obsidian-900/15 bg-alabaster-100/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
                <span class="text-obsidian-700">
                  DATABASE JSON:
                  <strong class="text-obsidian-900">
                    {$databaseStore.users.length} TÀI KHOẢN • {$databaseStore.jobs.length} BÀI ĐĂNG
                  </strong>
                </span>

                <button
                  type="button"
                  onclick={exportDatabaseJSON}
                  class="rounded-full border border-obsidian-900/20 bg-alabaster-50 px-4 py-1.5 font-mono text-xs font-bold text-obsidian-900 hover:border-obsidian-900 hover:bg-mint/25 transition-colors"
                >
                  Tải file Database JSON ↓
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <!-- ================= PUBLIC PROFILE OVERVIEW ================= -->
          <!-- Bio / About Section -->
          {#if profileUser.bio}
            <div class="rounded-2xl border border-obsidian-900/10 bg-alabaster-100/50 p-4 sm:p-5 space-y-1.5">
              <span class="font-mono text-[11px] font-bold uppercase tracking-wider text-obsidian-600 block">
                {profileUser.role === 'company' ? 'Văn hóa doanh nghiệp' : 'Giới thiệu bản thân'}
              </span>
              <p class="text-xs sm:text-sm leading-relaxed text-obsidian-800 whitespace-pre-line">
                {profileUser.bio}
              </p>
            </div>
          {/if}

          <!-- STUDENT DETAILS: CV & PORTFOLIO -->
          {#if profileUser.role === 'student'}
            <div class="space-y-6">
              <!-- CV File section -->
              <div>
                <div class="flex items-center justify-between border-b border-obsidian-900/10 pb-2 mb-3">
                  <h3 class="font-display text-sm sm:text-base font-extrabold text-obsidian-900">
                    Hồ sơ CV Ứng viên
                  </h3>
                  {#if isOwner}
                    <button
                      type="button"
                      onclick={() => setTab('settings')}
                      class="text-xs font-bold text-obsidian-900 underline decoration-mint decoration-2 underline-offset-4 hover:text-obsidian-700"
                    >
                      Quản lý CV →
                    </button>
                  {/if}
                </div>

                {#if publicCVs.length > 0}
                  <div class="space-y-2.5">
                    {#each publicCVs as cv, idx (cv.id)}
                      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-obsidian-900/15 bg-alabaster-100/60 p-4">
                        <div class="flex items-center gap-3 min-w-0">
                          <span class="font-mono font-bold text-xs bg-obsidian-900 text-mint px-2.5 py-1 rounded-lg shrink-0">
                            {getFileExt(cv.name)}
                          </span>
                          <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-1.5">
                              <span class="text-xs sm:text-sm font-bold text-obsidian-900 block truncate">
                                {cv.name}
                              </span>
                              {#if cv.label}
                                <span class="rounded-full bg-mint/45 px-2 py-0.5 font-mono text-[10px] font-bold text-obsidian-900">
                                  {cv.label}
                                </span>
                              {/if}
                              {#if idx === 0}
                                <span class="rounded-full bg-obsidian-900 px-2 py-0.5 font-mono text-[10px] font-bold text-mint">
                                  Mặc định
                                </span>
                              {/if}
                            </div>
                            <span class="font-mono text-[11px] text-swiss-500 mt-0.5 block">
                              {(cv.size / 1024).toFixed(1)} KB • Tải lên: {formatDate(cv.uploadedAt)}
                            </span>
                          </div>
                        </div>

                        {#if cv.dataUrl}
                          <a
                            href={cv.dataUrl}
                            download={cv.name}
                            class="rounded-full border border-obsidian-900/20 bg-alabaster-50 px-4 py-1.5 text-xs font-bold text-obsidian-900 hover:border-obsidian-900 hover:bg-mint/25 transition-colors shrink-0"
                          >
                            Tải về CV ↓
                          </a>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <p class="text-xs text-swiss-500 italic">
                    Ứng viên chưa tải tệp CV lên hồ sơ.
                  </p>
                {/if}
              </div>

              <!-- Portfolio Projects -->
              <div>
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-900/10 pb-2 mb-3">
                  <h3 class="font-display text-sm sm:text-base font-extrabold text-obsidian-900">
                    Dự án đã thực hiện ({profileUser.portfolioProjects?.length || 0})
                  </h3>
                  {#if profileUser.portfolioLink}
                    <a
                      href={profileUser.portfolioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs font-bold text-obsidian-900 underline decoration-mint decoration-2 underline-offset-4 hover:text-obsidian-700"
                    >
                      Link tổng quan →
                    </a>
                  {/if}
                </div>

                {#if profileUser.portfolioProjects && profileUser.portfolioProjects.length > 0}
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {#each profileUser.portfolioProjects as proj (proj.id)}
                      <div class="rounded-2xl border border-obsidian-900/15 p-4 bg-alabaster-100/40 space-y-1.5">
                        <h4 class="font-display text-sm font-extrabold text-obsidian-900">{proj.title}</h4>
                        <p class="text-xs text-obsidian-700 leading-relaxed">{proj.description}</p>
                        {#if proj.link}
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-block text-xs font-bold text-obsidian-900 underline decoration-mint decoration-2 underline-offset-4 mt-1"
                          >
                            Xem demo dự án →
                          </a>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <p class="text-xs text-swiss-500 italic">
                    Chưa có dự án nào trong portfolio.
                  </p>
                {/if}
              </div>

              <!-- APPLIED JOBS HISTORY -->
              {#if isOwner || (profileUser.appliedJobs && profileUser.appliedJobs.length > 0)}
                <div class="space-y-3 pt-2 border-t border-obsidian-900/10">
                  <div class="flex items-center justify-between border-b border-obsidian-900/10 pb-2">
                    <h3 class="font-display text-sm sm:text-base font-extrabold text-obsidian-900">
                      Lịch sử công ty đã ứng tuyển ({profileUser.appliedJobs?.length || 0})
                    </h3>
                  </div>

                  {#if profileUser.appliedJobs && profileUser.appliedJobs.length > 0}
                    <div class="space-y-3">
                      {#each profileUser.appliedJobs as app (app.id)}
                        <div class="rounded-2xl border border-obsidian-900/15 bg-alabaster-50 p-4 space-y-2 text-xs hover:border-obsidian-900 transition-colors shadow-xs">
                          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-900/10 pb-2">
                            <div class="flex items-center gap-2">
                              <span class="font-display font-extrabold text-obsidian-900 text-sm">{app.company}</span>
                              {#if app.companyUsername}
                                <a href={url(`/profile/${app.companyUsername}`)} class="font-mono text-[11px] text-swiss-500 hover:text-obsidian-900 hover:underline">
                                  ({app.companyUsername})
                                </a>
                              {/if}
                            </div>
                            <Badge variant="emerald" size="xs" dot>ĐÃ NỘP HỒ SƠ</Badge>
                          </div>

                          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <span class="font-bold text-obsidian-900">{app.jobTitle}</span>
                            <span class="font-mono text-swiss-500">Mã: <strong class="text-obsidian-900">{app.applicationCode}</strong></span>
                          </div>

                          <div class="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-[11px] text-swiss-500">
                            <span>Lương: <strong class="text-obsidian-900">{app.salary}</strong> • {app.location}</span>
                            <span>Ngày nộp: {formatDate(app.appliedAt)}</span>
                          </div>
                          {#if app.cvName}
                            <div class="pt-1 font-mono text-[11px] text-obsidian-700">
                              CV: <strong class="text-obsidian-900">{app.cvName}</strong>
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <p class="text-xs text-swiss-500 italic">
                      Chưa nộp hồ sơ vào công ty nào.
                    </p>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}

          <!-- COMPANY DETAILS: JOB LISTINGS -->
          {#if profileUser.role === 'company'}
            {@const stats = getCompanyMonthlyJobStats(profileUser.id)}
            <!-- Plan Quota Card -->
            <div class="rounded-2xl border border-obsidian-900/15 bg-alabaster-100/70 p-4 sm:p-5 space-y-3 text-xs">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-obsidian-900/10 pb-3">
                <div>
                  <span class="font-mono text-[10px] uppercase font-bold tracking-wider text-swiss-500 block">
                    Gói dịch vụ tuyển dụng
                  </span>
                  <span class="font-display font-extrabold text-obsidian-900 text-base flex items-center gap-1.5 mt-0.5">
                    {#if profileUser.subscriptionTier === 'enterprise'}
                      <span>ENTERPRISE (Không giới hạn) ✦</span>
                    {:else if profileUser.subscriptionTier === 'premium'}
                      <span class="text-amber-700">PREMIUM PRO (50 bài đăng/tháng) ✦</span>
                    {:else}
                      <span>Gói Miễn Phí (10 bài đăng/tháng)</span>
                    {/if}
                  </span>
                </div>

                {#if isOwner}
                  <button
                    type="button"
                    onclick={openUpgradeModal}
                    class="rounded-full bg-obsidian-900 px-4 py-2 font-display text-xs font-bold text-mint hover:bg-obsidian-800 transition-colors self-start sm:self-auto flex items-center gap-1.5 shadow-xs"
                  >
                    <span class="text-amber-400">✦</span>
                    <span>{profileUser.subscriptionTier === 'enterprise' ? 'Quản lý gói' : 'Nâng cấp gói Premium'}</span>
                  </button>
                {/if}
              </div>

              <div class="space-y-1.5 font-mono">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-swiss-600">Hạn mức bài đăng tháng này:</span>
                  <span class="font-bold text-obsidian-900">
                    {stats.usedCount} / {stats.maxPosts === Infinity ? 'Không giới hạn' : stats.maxPosts} bài đã đăng
                  </span>
                </div>
                {#if stats.maxPosts !== Infinity}
                  <div class="w-full h-2 rounded-full bg-alabaster-200 overflow-hidden border border-obsidian-900/10">
                    <div
                      class="h-full transition-all duration-300 {stats.isLimitReached ? 'bg-signal-crimson' : 'bg-mint-500'}"
                      style="width: {stats.percentUsed}%"
                    ></div>
                  </div>
                {/if}
              </div>
            </div>

            <div class="space-y-4 pt-2">
              <div class="flex items-center justify-between border-b border-obsidian-900/10 pb-2">
                <h3 class="font-display text-sm sm:text-base font-extrabold text-obsidian-900">
                  Tin tuyển dụng đã đăng ({companyJobs.length})
                </h3>
                {#if isOwner}
                  <button
                    type="button"
                    onclick={() => openPostJobModal()}
                    class="text-xs font-bold text-obsidian-900 underline decoration-mint decoration-2 underline-offset-4 hover:text-obsidian-700"
                  >
                    + Đăng thêm việc
                  </button>
                {/if}
              </div>

              {#if companyJobs.length > 0}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {#each companyJobs as job (job.id)}
                    <JobCard {job} />
                  {/each}
                </div>
              {:else}
                <div class="rounded-2xl border border-dashed border-obsidian-900/20 p-8 text-center bg-alabaster-100/50">
                  <p class="text-xs sm:text-sm text-swiss-600">
                    Doanh nghiệp này chưa đăng tin tuyển dụng nào.
                  </p>
                  {#if isOwner}
                    <button
                      type="button"
                      onclick={() => openPostJobModal()}
                      class="mt-4 rounded-full bg-obsidian-900 px-5 py-2.5 font-display text-xs font-bold text-mint hover:bg-obsidian-800 transition-colors"
                    >
                      Đăng tin tuyển dụng đầu tiên
                    </button>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {:else}
    <!-- Not Found State -->
    <div class="rounded-3xl border-2 border-obsidian-900 bg-alabaster-50 p-12 text-center shadow-swiss-card space-y-4">
      <span class="inline-flex items-center rounded-full bg-obsidian-900 px-3 py-1 font-mono text-xs font-bold uppercase text-mint">
        404 • Không tìm thấy hồ sơ
      </span>
      <p class="text-xs sm:text-sm text-obsidian-700 max-w-md mx-auto leading-relaxed">
        Không tìm thấy thông tin tài khoản của <strong>{rawUsername || '@nguoidung'}</strong> trên hệ thống TopSiVi.
      </p>
      <div class="pt-2 flex items-center justify-center gap-3">
        <a
          href={url('/')}
          class="rounded-full bg-obsidian-900 px-6 py-2.5 font-display text-xs font-bold text-mint hover:bg-obsidian-800 transition-colors"
        >
          ← Về trang chủ
        </a>
      </div>
    </div>
  {/if}
</div>
