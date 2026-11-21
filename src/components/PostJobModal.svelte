<script lang="ts">
  import {
    isPostJobModalOpen,
    closePostJobModal,
    editingJob,
    currentUser,
    postNewJob,
    updateJob,
    getCompanyMonthlyJobStats,
    openUpgradeModal
  } from '../stores/auth';
  import { renderMarkdown } from '../utils/markdown';
  import { PROVINCES, getWardsByProvinceCode } from '../data/provinces';
  import { url } from '../utils/url';
  import SearchableSelect, { type SelectItem } from './SearchableSelect.svelte';
  import DualRangeSlider from './DualRangeSlider.svelte';
  import When2MeetSchedule from './When2MeetSchedule.svelte';
  import DatePicker from './DatePicker.svelte';
  import Modal from './Modal.svelte';
  import type { Job, JobCategory } from '../types/job';

  let stats = $derived(
    $currentUser ? getCompanyMonthlyJobStats($currentUser.id) : null
  );

  let isEditing = $derived(!!$editingJob);

  const sortedProvinces = [...PROVINCES].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  const categoryOptions: { id: JobCategory; title: string; sub: string }[] = [
    { id: 'part-time', title: 'Năm 1, 2', sub: 'Part-time linh hoạt' },
    { id: 'internship', title: 'Năm 3, 4', sub: 'Thực tập chuyên ngành' },
    { id: 'fresher', title: 'Mới tốt nghiệp', sub: 'Fresher Full-time' },
    { id: 'project', title: 'Dự án', sub: 'Theo đầu việc' },
  ];

  // Form State
  let title = $state('');
  let selectedCategories = $state<JobCategory[]>(['internship']);
  let minSalary = $state(5_000_000);
  let maxSalary = $state(15_000_000);
  let isSalaryNegotiable = $state(false);
  let selectedProvinceCode = $state('01'); // Default: Thành phố Hà Nội
  let selectedWardCode = $state('00166'); // Default: Phường Cầu Giấy (00166)
  let detailAddress = $state('Số 10 Phạm Văn Bạch');
  let workType = $state<Job['workType']>('Thực tập');
  let schedule = $state('T2 - T6 (08:00 - 17:00, linh hoạt)');
  let scheduleGrid = $state<Record<string, number[]>>({});
  let deadline = $state('31/12/2026');
  let imageUrl = $state('');
  let summary = $state('');
  let tagsStr = $state('Thực tập, Mentor, Dấu mộc');
  let markdownMode = $state<'write' | 'preview'>('write');
  let isUploadingThumbnail = $state(false);

  let availableWards = $derived(getWardsByProvinceCode(selectedProvinceCode));

  // Populate or reset form whenever editingJob or modal opening changes
  $effect(() => {
    if ($isPostJobModalOpen) {
      if ($editingJob) {
        title = $editingJob.title;
        selectedCategories = ($editingJob.categories && $editingJob.categories.length > 0)
          ? [...$editingJob.categories]
          : [$editingJob.category];
        minSalary = $editingJob.minSalary ?? 5_000_000;
        maxSalary = $editingJob.maxSalary ?? 15_000_000;
        isSalaryNegotiable = !!$editingJob.isSalaryNegotiable;
        selectedProvinceCode = $editingJob.provinceCode || '01';
        selectedWardCode = $editingJob.wardCode || '';
        detailAddress = $editingJob.location || '';
        workType = $editingJob.workType;
        schedule = $editingJob.schedule;
        scheduleGrid = $editingJob.scheduleGrid || {};
        deadline = $editingJob.deadline;
        imageUrl = $editingJob.imageUrl || '';
        summary = $editingJob.summary;
        markdownContent = $editingJob.markdownContent || '';
        tagsStr = ($editingJob.tags || []).join(', ');
      } else {
        // Reset to default new post values
        title = '';
        selectedCategories = ['internship'];
        minSalary = 5_000_000;
        maxSalary = 15_000_000;
        isSalaryNegotiable = false;
        selectedProvinceCode = '01';
        selectedWardCode = '00166';
        detailAddress = 'Số 10 Phạm Văn Bạch';
        workType = 'Thực tập';
        schedule = 'T2 - T6 (08:00 - 17:00, linh hoạt)';
        deadline = '31/12/2026';
        imageUrl = '';
        summary = '';
        tagsStr = 'Thực tập, Mentor, Dấu mộc';
      }
    }
  });

  const priorityCodes = ['01', '79', '48', '31', '92', '46'];

  let provinceSelectItems = $derived.by(() => {
    const list: SelectItem[] = [];

    for (const p of PROVINCES.filter((item) => priorityCodes.includes(item.code))) {
      list.push({
        value: p.code,
        label: p.fullName,
        subLabel: p.name,
        badge: p.code,
        group: 'Thành phố trọng điểm',
      });
    }

    for (const p of sortedProvinces) {
      list.push({
        value: p.code,
        label: p.fullName,
        subLabel: p.name,
        badge: p.code,
        group: 'Tất cả 34 tỉnh thành',
      });
    }

    list.push({
      value: 'remote',
      label: 'Toàn quốc / Làm việc từ xa (Remote)',
      badge: 'REMOTE',
      group: 'Hình thức đặc biệt',
    });

    return list;
  });

  let wardSelectItems = $derived.by(() => {
    return availableWards.map((w) => ({
      value: w.code,
      label: w.fullName,
      badge: w.code,
      subLabel: w.unit,
    }));
  });

  let markdownContent = $state(`## Mô tả công việc (Job Description)
- Tham gia phát triển và tối ưu hóa hệ thống ứng dụng web thực tế.
- Phối hợp cùng các thành viên trong team theo mô hình Agile/Scrum.
- Hỗ trợ giải quyết các bài toán kỹ thuật và báo cáo tiến độ tuần.

## Yêu cầu ứng viên (Requirements)
- Sinh viên các trường Đại học, Cao đẳng có tinh thần ham học hỏi.
- Có kiến thức nền tảng vững chắc và kỹ năng tự nghiên cứu tốt.
- Thái độ nghiêm túc, trách nhiệm với công việc được giao.

## Quyền lợi sinh viên (Benefits)
- Hỗ trợ đóng dấu mộc thực tập và số liệu làm khóa luận tốt nghiệp 100%.
- Được Senior kèm cặp 1-1 và hướng dẫn chuyên môn bài bản.
- Trợ cấp thực tập cạnh tranh, xét cơ hội lên nhân viên chính thức.`);

  let renderedPreview = $derived(renderMarkdown(markdownContent));

  function toggleCategory(cat: JobCategory) {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        selectedCategories = selectedCategories.filter((c) => c !== cat);
      }
    } else {
      selectedCategories = [...selectedCategories, cat];
    }
  }

  // Handle Thumbnail File Upload with Client-Side Canvas Resize
  async function handleThumbnailFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;

    isUploadingThumbnail = true;
    try {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            imageUrl = canvas.toDataURL('image/jpeg', 0.85);
          }
          isUploadingThumbnail = false;
        };
        img.src = uploadEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      isUploadingThumbnail = false;
    }
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !markdownContent.trim()) return;

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    let finalLocation = '';
    let finalProvinceCode = selectedProvinceCode;
    let finalProvinceName = '';
    let finalWardCode = selectedWardCode || undefined;
    let finalWardName = undefined;

    if (selectedProvinceCode === 'remote') {
      finalProvinceCode = 'remote';
      finalProvinceName = 'Online / Remote';
      finalLocation = detailAddress.trim()
        ? `${detailAddress.trim()} (Toàn quốc / Remote)`
        : 'Toàn quốc / Remote';
    } else {
      const prov = PROVINCES.find((p) => p.code === selectedProvinceCode);
      const ward = availableWards.find((w) => w.code === selectedWardCode);
      finalProvinceName = prov ? prov.name : 'Hà Nội';
      finalWardName = ward ? ward.fullName : undefined;

      const parts = [
        detailAddress.trim(),
        finalWardName,
        prov?.fullName || finalProvinceName
      ].filter(Boolean);
      finalLocation = parts.join(', ');
    }

    // Format salary string for backward compatibility
    let salaryText = 'Thỏa thuận';
    if (!isSalaryNegotiable) {
      const isProjectRate =
        workType === 'Theo dự án' ||
        (selectedCategories.length === 1 && selectedCategories[0] === 'project');
      const salaryUnit = isProjectRate ? '/ dự án' : '/ tháng';
      const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
      salaryText =
        minSalary === maxSalary
          ? `${fmt(minSalary)} ${salaryUnit}`
          : `${fmt(minSalary)} - ${fmt(maxSalary)} ${salaryUnit}`;
    }

    const payload = {
      title: title.trim(),
      category: selectedCategories[0] || 'internship',
      categories: selectedCategories,
      salary: salaryText,
      minSalary,
      maxSalary,
      isSalaryNegotiable,
      location: finalLocation,
      provinceCode: finalProvinceCode,
      provinceName: finalProvinceName,
      wardCode: finalWardCode,
      wardName: finalWardName,
      workType,
      schedule: schedule.trim(),
      scheduleGrid,
      deadline: deadline.trim(),
      imageUrl: imageUrl.trim(),
      summary: summary.trim(),
      markdownContent: markdownContent.trim(),
      tags,
    };

    if (isEditing && $editingJob) {
      updateJob($editingJob.id, payload);
    } else {
      postNewJob(payload);
    }
  }
</script>

<Modal
  isOpen={$isPostJobModalOpen}
  onClose={closePostJobModal}
  hideHeader={true}
  maxWidth="6xl"
  dialogClass="rounded-3xl border-2 border-obsidian-900 bg-alabaster-50 shadow-[0_24px_60px_rgba(14,20,18,0.22)] max-h-[92vh] flex flex-col !my-0"
  bodyClass="p-0 flex flex-col flex-1 min-h-0 overflow-hidden"
  ariaLabel={isEditing ? 'Chỉnh sửa bài đăng' : 'Đăng tin tuyển dụng'}
>
  <!-- Pinned Branded Organic Header -->
  <div
    class="relative shrink-0 border-b border-obsidian-900/10 bg-alabaster-100/90 bg-organic-dots-light px-5 sm:px-6 py-4"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <img
          src={url('/favicon.svg')}
          alt="TopSiVi"
          class="h-7 w-auto object-contain shrink-0"
        />
        <span class="hidden sm:inline-block h-6 w-px bg-obsidian-900/15"></span>
        <div class="min-w-0">
          <h2 class="font-display text-lg sm:text-xl font-extrabold tracking-tight text-obsidian-900 truncate">
            {isEditing ? 'Chỉnh sửa bài đăng tuyển dụng' : 'Đăng tin tuyển dụng mới'}
          </h2>
          <p class="text-[11px] sm:text-xs text-obsidian-600 truncate">
            Tiếp cận sinh viên tài năng từ 327+ trường Đại học & Cao đẳng
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2.5 ml-auto">
        {#if stats && !isEditing}
          <div class="hidden md:flex items-center gap-2 rounded-full border border-obsidian-900/15 bg-alabaster-50 pl-3 pr-1.5 py-1 text-xs">
            <span class="text-obsidian-600 font-medium">Hạn mức:</span>
            <span class="font-mono font-extrabold text-obsidian-900">
              {stats.usedCount}/{stats.maxPosts === Infinity ? '∞' : stats.maxPosts}
            </span>
            <span class="text-[11px] text-obsidian-600">
              ({stats.tier === 'enterprise' ? 'Enterprise' : stats.tier === 'premium' ? 'Premium' : 'Free'})
            </span>
            <button
              type="button"
              onclick={openUpgradeModal}
              class="rounded-full bg-mint/40 border border-mint-500/40 px-2.5 py-0.5 font-display text-[11px] font-extrabold text-obsidian-900 hover:bg-mint transition-colors cursor-pointer"
            >
              Nâng cấp ✦
            </button>
          </div>
        {/if}

        <button
          type="button"
          onclick={closePostJobModal}
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-obsidian-900/15 bg-alabaster-50 text-obsidian-800 transition-all duration-150 hover:border-obsidian-900 hover:bg-obsidian-900 hover:text-mint cursor-pointer"
          aria-label="Đóng"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Quota Strip -->
    {#if stats && !isEditing}
      <div class="mt-3 flex md:hidden items-center justify-between gap-2 rounded-xl border border-obsidian-900/10 bg-alabaster-50 px-3 py-1.5 text-xs">
        <span class="text-obsidian-700">
          Hạn mức: <strong class="font-mono text-obsidian-900">{stats.usedCount}/{stats.maxPosts === Infinity ? '∞' : stats.maxPosts}</strong>
        </span>
        <button
          type="button"
          onclick={openUpgradeModal}
          class="rounded-full bg-mint/40 border border-mint-500/40 px-2.5 py-0.5 font-display text-[11px] font-extrabold text-obsidian-900 cursor-pointer"
        >
          Nâng cấp ✦
        </button>
      </div>
    {/if}
  </div>

  <!-- Limit Reached State -->
  {#if stats && !isEditing && stats.isLimitReached}
    <div class="flex-1 overflow-y-auto p-6 sm:p-10 flex items-center justify-center bg-alabaster-50">
      <div class="max-w-lg w-full rounded-3xl border border-signal-crimson/35 bg-red-50/70 p-6 sm:p-8 text-center space-y-3.5">
        <span class="inline-flex items-center rounded-full bg-signal-crimson/15 px-3 py-1 font-mono text-xs font-bold text-signal-crimson">
          Đã đạt giới hạn {stats.maxPosts} bài đăng / tháng
        </span>
        <h3 class="font-display text-lg font-extrabold text-obsidian-900">
          Nâng cấp gói để tiếp tục đăng tin tuyển dụng
        </h3>
        <p class="text-xs sm:text-sm text-obsidian-700 leading-relaxed">
          Gói miễn phí cho phép tối đa 10 bài đăng mỗi tháng. Nâng cấp lên <strong class="text-obsidian-900">Premium (50 bài/tháng)</strong> hoặc <strong class="text-obsidian-900">Enterprise (Không giới hạn)</strong> để mở khóa ngay.
        </p>
        <div class="pt-2 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onclick={closePostJobModal}
            class="rounded-full px-4 py-2.5 font-display text-xs font-bold text-obsidian-600 hover:bg-alabaster-200/70 cursor-pointer"
          >
            Để sau
          </button>
          <button
            type="button"
            onclick={openUpgradeModal}
            class="rounded-full bg-obsidian-900 px-6 py-2.5 font-display text-xs font-extrabold text-alabaster-50 hover:bg-mint hover:text-obsidian-900 transition-colors shadow-sm cursor-pointer"
          >
            Nâng cấp gói Premium ngay →
          </button>
        </div>
      </div>
    </div>
  {:else}
    <!-- Wide 2-Column Workspace Form -->
    <form onsubmit={handleSubmit} class="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div class="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 bg-alabaster-50" data-lenis-prevent>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <!-- LEFT COLUMN (7/12): Basic Info, Location & Markdown JD -->
          <div class="lg:col-span-7 space-y-5">
            <!-- Section 1: Basic Info & Target Groups -->
            <div class="rounded-2xl border border-obsidian-900/12 bg-alabaster-50 p-4 sm:p-5 space-y-4">
              <div class="flex items-center gap-2 border-b border-obsidian-900/10 pb-2.5">
                <span class="h-2 w-2 rounded-full bg-mint-500"></span>
                <h3 class="font-display text-sm font-extrabold text-obsidian-900">
                  Thông tin vị trí tuyển dụng
                </h3>
              </div>

              <!-- Job Title -->
              <div>
                <label for="post-title" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                  Tiêu đề công việc <span class="text-signal-crimson">*</span>
                </label>
                <input
                  type="text"
                  id="post-title"
                  bind:value={title}
                  required
                  placeholder="Ví dụ: Thực tập sinh Lập trình Frontend (React / Svelte)"
                  class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
                />
              </div>

              <!-- Multi-Category Selection -->
              <div class="space-y-2">
                <span class="block text-xs font-bold text-obsidian-800">
                  Phân tầng sinh viên mục tiêu (có thể chọn nhiều nhóm) <span class="text-signal-crimson">*</span>
                </span>
                <div class="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
                  {#each categoryOptions as cat (cat.id)}
                    {@const isChosen = selectedCategories.includes(cat.id)}
                    <button
                      type="button"
                      onclick={() => toggleCategory(cat.id)}
                      class="flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer
                        {isChosen
                          ? 'border-2 border-mint-500 bg-mint/15 text-obsidian-900 shadow-xs'
                          : 'border-obsidian-900/15 bg-alabaster-100/40 text-obsidian-900 hover:border-obsidian-900/40 hover:bg-alabaster-100'}"
                    >
                      <div class="flex items-center justify-between gap-2 w-full mb-1">
                        <span class="font-display text-xs font-extrabold text-obsidian-900 leading-tight">
                          {cat.title}
                        </span>
                        <span
                          class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black
                          {isChosen
                            ? 'bg-mint-500 text-alabaster-50'
                            : 'border border-obsidian-900/20 bg-alabaster-50 text-transparent'}"
                        >
                          ✓
                        </span>
                      </div>
                      <span class="text-[11px] text-obsidian-600 leading-snug">
                        {cat.sub}
                      </span>
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Summary description -->
              <div>
                <label for="post-summary" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                  Tóm tắt ngắn gọn (hiển thị trên thẻ việc làm) <span class="text-signal-crimson">*</span>
                </label>
                <textarea
                  id="post-summary"
                  bind:value={summary}
                  required
                  rows="2"
                  placeholder="Tóm tắt 1-2 câu về vị trí tuyển dụng, quyền lợi nổi bật..."
                  class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors resize-none"
                ></textarea>
              </div>
            </div>

            <!-- Section 2: Location, Work Type, Deadline & Tags -->
            <div class="rounded-2xl border border-obsidian-900/12 bg-alabaster-50 p-4 sm:p-5 space-y-3.5">
              <div class="flex items-center gap-2 border-b border-obsidian-900/10 pb-2.5">
                <span class="h-2 w-2 rounded-full bg-mint-500"></span>
                <h3 class="font-display text-sm font-extrabold text-obsidian-900">
                  Địa điểm, hình thức & thời hạn
                </h3>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <SearchableSelect
                    items={provinceSelectItems}
                    bind:value={selectedProvinceCode}
                    label="Tỉnh / Thành phố"
                    placeholder="Chọn hoặc tìm kiếm tỉnh thành..."
                    required={true}
                    onSelect={(val) => {
                      const wards = getWardsByProvinceCode(val);
                      selectedWardCode = wards[0]?.code || '';
                    }}
                  />
                </div>

                <div>
                  {#if selectedProvinceCode === 'remote'}
                    <span class="block text-xs font-bold text-obsidian-800 mb-1.5">
                      Phường / Xã
                    </span>
                    <div class="w-full rounded-xl border border-obsidian-900/10 bg-alabaster-100/80 px-3.5 py-2.5 text-xs text-obsidian-600">
                      Toàn quốc (Không áp dụng cấp phường)
                    </div>
                  {:else}
                    <SearchableSelect
                      items={wardSelectItems}
                      bind:value={selectedWardCode}
                      label="Phường / Xã"
                      placeholder="Chọn hoặc tìm kiếm phường/xã..."
                      required={true}
                    />
                  {/if}
                </div>

                <div>
                  <label for="post-detail-address" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                    Địa chỉ chi tiết (Số nhà, đường, tòa nhà)
                  </label>
                  <input
                    type="text"
                    id="post-detail-address"
                    bind:value={detailAddress}
                    placeholder="Ví dụ: Tòa nhà FPT, Số 10 Phạm Văn Bạch"
                    class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
                  />
                </div>

                <div>
                  <label for="post-worktype" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                    Hình thức làm việc <span class="text-signal-crimson">*</span>
                  </label>
                  <select
                    id="post-worktype"
                    bind:value={workType}
                    class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-semibold text-obsidian-900 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
                  >
                    <option value="Part-time">Part-time</option>
                    <option value="Thực tập">Thực tập</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Theo dự án">Theo dự án</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <DatePicker
                    bind:value={deadline}
                    label="Hạn nộp hồ sơ *"
                    id="post-deadline"
                    placeholder="Chọn ngày hết hạn (DD/MM/YYYY)"
                    required={true}
                    minDate={new Date()}
                  />
                </div>

                <div>
                  <label for="post-tags" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                    Kỹ năng & Từ khóa (cách nhau dấu phẩy)
                  </label>
                  <input
                    type="text"
                    id="post-tags"
                    bind:value={tagsStr}
                    placeholder="Ví dụ: React, TypeScript, Mentor, Dấu mộc"
                    class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <!-- Section 3: Markdown JD Editor -->
            <div class="rounded-2xl border border-obsidian-900/12 bg-alabaster-50 p-4 sm:p-5 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-900/10 pb-2.5">
                <div class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full bg-mint-500"></span>
                  <h3 class="font-display text-sm font-extrabold text-obsidian-900">
                    Chi tiết tuyển dụng (Markdown) <span class="text-signal-crimson">*</span>
                  </h3>
                </div>

                <div class="inline-flex items-center rounded-full border border-obsidian-900/15 bg-alabaster-100 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onclick={() => (markdownMode = 'write')}
                    class="rounded-full px-3 py-1 transition-colors cursor-pointer
                    {markdownMode === 'write'
                      ? 'bg-obsidian-900 text-alabaster-50'
                      : 'text-obsidian-600 hover:text-obsidian-900'}"
                  >
                    Soạn thảo
                  </button>
                  <button
                    type="button"
                    onclick={() => (markdownMode = 'preview')}
                    class="rounded-full px-3 py-1 transition-colors cursor-pointer
                    {markdownMode === 'preview'
                      ? 'bg-obsidian-900 text-alabaster-50'
                      : 'text-obsidian-600 hover:text-obsidian-900'}"
                  >
                    Xem trước
                  </button>
                </div>
              </div>

              {#if markdownMode === 'write'}
                <textarea
                  id="post-markdown-editor"
                  bind:value={markdownContent}
                  required
                  rows="10"
                  class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 p-3.5 font-mono text-xs leading-relaxed text-obsidian-900 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
                ></textarea>
              {:else}
                <div class="max-h-72 overflow-y-auto rounded-xl border border-obsidian-900/10 bg-alabaster-100/50 p-4">
                  {@html renderedPreview}
                </div>
              {/if}
            </div>
          </div>

          <!-- RIGHT COLUMN (5/12): Salary, Thumbnail & Schedule -->
          <div class="lg:col-span-5 space-y-5">
            <!-- Section 4: Salary Slider -->
            <div class="rounded-2xl border border-obsidian-900/12 bg-alabaster-100/60 p-4 sm:p-5">
              <DualRangeSlider
                bind:minVal={minSalary}
                bind:maxVal={maxSalary}
                bind:isNegotiable={isSalaryNegotiable}
                label="Mức lương / Phụ cấp sinh viên (tối đa 100M)"
              />
            </div>

            <!-- Section 5: Thumbnail Attachment -->
            <div class="rounded-2xl border border-obsidian-900/12 bg-alabaster-100/60 p-4 sm:p-5 space-y-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full bg-mint-500"></span>
                  <span class="font-display text-sm font-extrabold text-obsidian-900">
                    Ảnh minh họa bài đăng
                  </span>
                </div>
                {#if imageUrl}
                  <button
                    type="button"
                    onclick={() => (imageUrl = '')}
                    class="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-signal-crimson hover:bg-signal-crimson/10 transition-colors cursor-pointer"
                  >
                    Gỡ ảnh
                  </button>
                {/if}
              </div>

              <!-- Preview Box -->
              <div class="relative h-36 w-full rounded-xl border border-obsidian-900/10 bg-alabaster-200/80 overflow-hidden flex items-center justify-center">
                {#if imageUrl}
                  <img src={imageUrl} alt="Thumbnail preview" class="h-full w-full object-cover" />
                {:else}
                  <div class="text-center px-4 text-xs text-obsidian-600">
                    Chưa có ảnh — hệ thống sẽ dùng ảnh mặc định
                  </div>
                {/if}
                {#if isUploadingThumbnail}
                  <div class="absolute inset-0 bg-obsidian-950/60 flex items-center justify-center text-alabaster-50 font-mono text-xs">
                    Đang tối ưu hóa ảnh...
                  </div>
                {/if}
              </div>

              <div class="space-y-2">
                <label class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-obsidian-900/20 bg-alabaster-50 px-4 py-2 font-display text-xs font-bold text-obsidian-900 hover:border-mint-600 hover:bg-mint/20 transition-colors cursor-pointer">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Tải ảnh từ máy tính (JPG / PNG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onchange={handleThumbnailFile}
                    class="sr-only"
                  />
                </label>

                <input
                  type="url"
                  bind:value={imageUrl}
                  placeholder="Hoặc dán đường dẫn ảnh (https://...)"
                  class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-50 px-3 py-2 text-xs text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
                />
              </div>
            </div>

            <!-- Section 6: Interactive Schedule -->
            <div class="rounded-2xl border border-obsidian-900/12 bg-alabaster-100/60 p-4 sm:p-5">
              <When2MeetSchedule
                bind:scheduleText={schedule}
                bind:scheduleGrid={scheduleGrid}
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Pinned Action Footer -->
      <div class="shrink-0 border-t border-obsidian-900/10 bg-alabaster-100/90 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <span class="hidden sm:inline-block text-xs text-obsidian-600">
          Tin tuyển dụng sẽ hiển thị ngay trên trang Việc làm sau khi xác nhận.
        </span>

        <div class="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onclick={closePostJobModal}
            class="rounded-full px-4 py-2 font-display text-xs font-bold text-obsidian-600 hover:text-obsidian-900 hover:bg-alabaster-200/70 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            class="inline-flex items-center gap-2 rounded-full bg-obsidian-900 px-6 py-2.5 font-display text-xs font-extrabold text-alabaster-50 hover:bg-mint hover:text-obsidian-900 transition-all duration-150 shadow-sm cursor-pointer"
          >
            <span>{isEditing ? 'Lưu thay đổi bài đăng ✓' : 'Đăng bài tuyển dụng ngay →'}</span>
          </button>
        </div>
      </div>
    </form>
  {/if}
</Modal>
