<script lang="ts">
  import { onMount } from 'svelte';
  import {
    databaseStore,
    currentUser,
    getUserByUsername,
    openPostJobModal,
    openUpgradeModal,
    getCompanyMonthlyJobStats,
    deleteJob,
    uploadAvatar
  } from '../stores/auth';
  import { openJobDetail } from '../stores/favorites';
  import type { UserProfile } from '../types/user';
  import type { Job } from '../types/job';
  import JobCard from './JobCard.svelte';
  import Badge from './Badge.svelte';
  import { formatDate } from '../utils/formatters';
  import { url } from '../utils/url';

  let rawUsername = $state('');
  let profileUser = $state<UserProfile | null>(null);
  let isLoaded = $state(false);

  onMount(() => {
    // Extract username from URL path: e.g. /profile/@an.nguyen or /profile/an.nguyen
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1] || '';

    if (lastPart && lastPart !== 'profile') {
      rawUsername = decodeURIComponent(lastPart);
    } else {
      // Check query param e.g. ?u=@an.nguyen
      const urlParams = new URLSearchParams(window.location.search);
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
          (j) => j.authorId === profileUser?.id || j.companyUsername.toLowerCase() === ('@' + profileUser?.username).toLowerCase()
        )
      : []
  );

  let isOwner = $derived(
    $currentUser && profileUser && $currentUser.id === profileUser.id
  );
</script>

<div class="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
  {#if !isLoaded}
    <div class="py-20 text-center font-mono text-xs text-swiss-500">
      Đang tải dữ liệu hồ sơ từ Database JSON...
    </div>
  {:else if profileUser}
    <!-- Profile Header (Swiss Style) -->
    <div class="border border-black rounded-swiss-md bg-white p-6 sm:p-8 shadow-swiss-elevated space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-black pb-6">
        <div class="flex items-start gap-4">
          <!-- Avatar Square (Custom Avatar Image or Default Initial) -->
          <div class="relative group/avatar shrink-0">
            {#if profileUser.avatar}
              <img
                src={profileUser.avatar}
                alt={profileUser.fullName}
                class="h-16 w-16 rounded-swiss-sm object-cover border border-black shadow-xs"
              />
            {:else}
              <div class="flex h-16 w-16 items-center justify-center rounded-swiss-sm bg-black text-white font-mono text-2xl font-black shadow-xs">
                {profileUser.fullName.charAt(0)}
              </div>
            {/if}

            {#if isOwner}
              <!-- Quick change avatar overlay button -->
              <label class="absolute inset-0 bg-black/60 rounded-swiss-sm opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="font-mono text-[8px] font-bold uppercase mt-0.5">Đổi ảnh</span>
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

          <div>
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <h1 class="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                {profileUser.fullName}
              </h1>
              <span class="font-mono text-xs font-bold text-signal-emerald bg-swiss-100 border border-swiss-300 px-2 py-0.5 rounded-swiss-sm">
                @{profileUser.username}
              </span>
              <Badge variant="black" size="xs">
                {profileUser.role === 'company' ? 'DOANH NGHIỆP' : 'SINH VIÊN'}
              </Badge>

              {#if profileUser.role === 'company'}
                {#if profileUser.subscriptionTier === 'enterprise'}
                  <Badge variant="outline" size="xs">ENTERPRISE ✦</Badge>
                {:else if profileUser.subscriptionTier === 'premium'}
                  <Badge variant="amber" size="xs">PREMIUM ✦</Badge>
                {:else}
                  <Badge variant="gray" size="xs">GÓI FREE (10 BÀI/THÁNG)</Badge>
                {/if}
              {/if}
            </div>

            <p class="font-mono text-xs text-swiss-600">
              {profileUser.role === 'company' 
                ? `${profileUser.industry || 'Lĩnh vực chung'} • ${profileUser.address || 'Việt Nam'}` 
                : `${profileUser.university || 'Đại học'} • ${profileUser.major || 'Chuyên ngành'} (${profileUser.academicYear})`}
            </p>

            {#if profileUser.website}
              <a
                href={profileUser.website}
                target="_blank"
                rel="noopener noreferrer"
                class="font-mono text-xs text-black hover:underline mt-1 inline-block"
              >
                Website: {profileUser.website} →
              </a>
            {/if}
          </div>
        </div>

        <!-- Owner action buttons -->
        <div class="flex items-center gap-2 shrink-0">
          {#if isOwner && profileUser.role === 'company'}
            <button
              type="button"
              onclick={openUpgradeModal}
              class="rounded-swiss-sm border border-black bg-white px-3 py-2 font-mono text-xs font-bold uppercase text-black hover:bg-swiss-100 transition-colors flex items-center gap-1"
            >
              <span class="text-amber-500">✦</span>
              <span>Nâng cấp gói</span>
            </button>
            <button
              type="button"
              onclick={openPostJobModal}
              class="rounded-swiss-sm bg-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors shadow-swiss-card"
            >
              + Đăng tin tuyển dụng
            </button>
          {/if}
          <a
            href={url('/')}
            class="rounded-swiss-sm border border-black bg-white px-3.5 py-2 font-mono text-xs font-bold uppercase text-black hover:bg-swiss-100 transition-colors"
          >
            ← Về trang chủ
          </a>
        </div>
      </div>

      <!-- Bio / About Section -->
      {#if profileUser.bio}
        <div class="space-y-1.5 border-b border-swiss-200 pb-5">
          <span class="font-mono text-[11px] font-black uppercase text-black">
            {profileUser.role === 'company' ? 'VĂN HÓA DOANH NGHIỆP // ' : 'GIỚI THIỆU BẢN THÂN // '}
          </span>
          <p class="text-xs leading-relaxed text-swiss-700 whitespace-pre-line font-medium">
            {profileUser.bio}
          </p>
        </div>
      {/if}

      <!-- STUDENT DETAILS: CV & PORTFOLIO -->
      {#if profileUser.role === 'student'}
        <div class="space-y-6">
          <!-- CV File section -->
          <div>
            <div class="flex items-center gap-2 border-b border-black pb-1 mb-3">
              <span class="font-mono text-xs font-black text-black">CV //</span>
              <h3 class="text-xs font-black uppercase tracking-wider text-black">File CV Ứng Viên</h3>
            </div>

            {#if profileUser.cvFile}
              <div class="flex items-center justify-between rounded-swiss-sm border border-black bg-swiss-50 p-3.5">
                <div class="flex items-center gap-3">
                  <span class="font-mono font-bold text-xs bg-black text-white px-2 py-1 rounded-swiss-sm">
                    PDF
                  </span>
                  <div>
                    <span class="font-mono text-xs font-bold text-black block">{profileUser.cvFile.name}</span>
                    <span class="font-mono text-[10px] text-swiss-500">
                      {(profileUser.cvFile.size / 1024).toFixed(1)} KB • Tải lên: {formatDate(profileUser.cvFile.uploadedAt)}
                    </span>
                  </div>
                </div>

                {#if profileUser.cvFile.dataUrl}
                  <a
                    href={profileUser.cvFile.dataUrl}
                    download={profileUser.cvFile.name}
                    class="rounded-swiss-sm border border-black bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase text-black hover:bg-swiss-100 transition-colors"
                  >
                    Tải về CV ↓
                  </a>
                {/if}
              </div>
            {:else}
              <p class="font-mono text-xs text-swiss-400 italic">
                Ứng viên chưa tải tệp CV lên hồ sơ.
              </p>
            {/if}
          </div>

          <!-- Portfolio Projects -->
          <div>
            <div class="flex items-center justify-between border-b border-black pb-1 mb-3">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-black text-black">PORTFOLIO //</span>
                <h3 class="text-xs font-black uppercase tracking-wider text-black">
                  Dự án đã thực hiện ({profileUser.portfolioProjects?.length || 0})
                </h3>
              </div>
              {#if profileUser.portfolioLink}
                <a
                  href={profileUser.portfolioLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-mono text-xs font-bold text-black hover:underline"
                >
                  Link tổng quan →
                </a>
              {/if}
            </div>

            {#if profileUser.portfolioProjects && profileUser.portfolioProjects.length > 0}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {#each profileUser.portfolioProjects as proj (proj.id)}
                  <div class="rounded-swiss-sm border border-swiss-300 p-3.5 bg-white space-y-1">
                    <h4 class="font-mono text-xs font-bold text-black">{proj.title}</h4>
                    <p class="text-xs text-swiss-600 leading-normal">{proj.description}</p>
                    {#if proj.link}
                      <a href={proj.link} target="_blank" rel="noopener noreferrer" class="font-mono text-[11px] text-black hover:underline inline-block mt-1">
                        Xem demo dự án →
                      </a>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <p class="font-mono text-xs text-swiss-400 italic">
                Chưa có dự án nào trong portfolio.
              </p>
            {/if}
          </div>

          <!-- APPLIED JOBS HISTORY -->
          {#if isOwner || (profileUser.appliedJobs && profileUser.appliedJobs.length > 0)}
            <div class="space-y-3 pt-3 border-t border-swiss-200">
              <div class="flex items-center justify-between border-b border-black pb-1.5">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-black text-black">HISTORY //</span>
                  <h3 class="text-xs font-black uppercase tracking-wider text-black">
                    Lịch sử công ty đã ứng tuyển ({profileUser.appliedJobs?.length || 0})
                  </h3>
                </div>
              </div>

              {#if profileUser.appliedJobs && profileUser.appliedJobs.length > 0}
                <div class="space-y-2.5">
                  {#each profileUser.appliedJobs as app (app.id)}
                    <div class="rounded-swiss-sm border border-swiss-300 bg-white p-3.5 space-y-2 font-mono text-xs hover:border-black transition-colors shadow-xs">
                      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-swiss-100 pb-1.5">
                        <div class="flex items-center gap-2">
                          <span class="font-black text-black uppercase text-xs">{app.company}</span>
                          {#if app.companyUsername}
                            <a href={url(`/profile/${app.companyUsername}`)} class="text-[10px] text-swiss-500 hover:text-black hover:underline lowercase">
                              ({app.companyUsername})
                            </a>
                          {/if}
                        </div>
                        <Badge variant="emerald" size="xs" withDot>ĐÃ NỘP HỒ SƠ</Badge>
                      </div>

                      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                        <span class="font-bold text-black">{app.jobTitle}</span>
                        <span class="text-swiss-500">Mã: <strong>{app.applicationCode}</strong></span>
                      </div>

                      <div class="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-swiss-500">
                        <span>Lương: <strong class="text-black">{app.salary}</strong> • {app.location}</span>
                        <span>Ngày nộp: {formatDate(app.appliedAt)}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="font-mono text-xs text-swiss-400 italic">
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
        <div class="rounded-swiss-sm border border-swiss-300 bg-swiss-50 p-4 space-y-2.5 font-mono text-xs mb-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-swiss-200 pb-2">
            <div>
              <span class="text-[10px] uppercase text-swiss-500 block">GÓI DỊCH VỤ TUYỂN DỤNG:</span>
              <span class="font-black text-black uppercase text-sm flex items-center gap-1 mt-0.5">
                {#if profileUser.subscriptionTier === 'enterprise'}
                  <span>ENTERPRISE (KHÔNG GIỚI HẠN) ✦</span>
                {:else if profileUser.subscriptionTier === 'premium'}
                  <span class="text-amber-800">PREMIUM PRO (50 BÀI ĐĂNG/THÁNG) ✦</span>
                {:else}
                  <span>GÓI MIỄN PHÍ (10 BÀI ĐĂNG/THÁNG)</span>
                {/if}
              </span>
            </div>

            {#if isOwner}
              <button
                type="button"
                onclick={openUpgradeModal}
                class="rounded-swiss-sm bg-black px-3.5 py-1.5 font-mono text-xs font-bold uppercase text-white hover:bg-neutral-800 transition-colors self-start sm:self-auto flex items-center gap-1 shadow-xs"
              >
                <span class="text-amber-400">✦</span>
                <span>{profileUser.subscriptionTier === 'enterprise' ? 'Quản lý gói' : 'Nâng cấp gói Premium'}</span>
              </button>
            {/if}
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-swiss-600">Hạn mức bài đăng tháng này:</span>
              <span class="font-bold text-black">
                {stats.usedCount} / {stats.maxPosts === Infinity ? 'Không giới hạn' : stats.maxPosts} bài đã đăng
              </span>
            </div>
            {#if stats.maxPosts !== Infinity}
              <div class="w-full h-1.5 rounded-full bg-swiss-200 overflow-hidden border border-swiss-300">
                <div
                  class="h-full {stats.isLimitReached ? 'bg-signal-crimson' : 'bg-black'}"
                  style="width: {stats.percentUsed}%"
                ></div>
              </div>
            {/if}
          </div>
        </div>

        <div class="space-y-4 pt-2">
          <div class="flex items-center justify-between border-b border-black pb-1.5">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-black text-black">JOBS //</span>
              <h3 class="text-xs font-black uppercase tracking-wider text-black">
                Tin tuyển dụng đã đăng ({companyJobs.length})
              </h3>
            </div>
            {#if isOwner}
              <button
                type="button"
                onclick={openPostJobModal}
                class="font-mono text-xs font-bold uppercase text-black hover:underline"
              >
                [ + Đăng thêm việc ]
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
            <div class="rounded-swiss-sm border border-dashed border-swiss-300 p-8 text-center bg-swiss-50">
              <p class="font-mono text-xs text-swiss-500">
                Doanh nghiệp này chưa đăng tin tuyển dụng nào.
              </p>
              {#if isOwner}
                <button
                  type="button"
                  onclick={openPostJobModal}
                  class="mt-3 rounded-swiss-sm bg-black px-4 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-neutral-800"
                >
                  Đăng tin tuyển dụng đầu tiên
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <!-- Not Found State -->
    <div class="border border-black rounded-swiss-md bg-white p-12 text-center shadow-swiss-card space-y-4">
      <span class="font-mono text-sm font-black uppercase text-black block">
        [ 404 // KHÔNG TÌM THẤY HỒ SƠ ]
      </span>
      <p class="font-mono text-xs text-swiss-600 max-w-md mx-auto leading-relaxed">
        Không tìm thấy thông tin tài khoản của <strong>{rawUsername || '@nguoidung'}</strong> trong Database JSON.
      </p>
      <div class="pt-2 flex items-center justify-center gap-3">
        <a
          href={url('/')}
          class="rounded-swiss-sm bg-black px-5 py-2.5 font-mono text-xs font-bold uppercase text-white hover:bg-neutral-800 transition-colors"
        >
          ← Về trang chủ
        </a>
      </div>
    </div>
  {/if}
</div>
