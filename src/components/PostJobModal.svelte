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
  import SearchableSelect, { type SelectItem } from './SearchableSelect.svelte';
  import DualRangeSlider from './DualRangeSlider.svelte';
  import When2MeetSchedule from './When2MeetSchedule.svelte';
  import DatePicker from './DatePicker.svelte';
  import Modal from './Modal.svelte';

  let stats = $derived(
    $currentUser ? getCompanyMonthlyJobStats($currentUser.id) : null
  );

  let isEditing = $derived(!!$editingJob);

  const sortedProvinces = [...PROVINCES].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  // Form State
  let title = $state('');
  let selectedCategories = $state<('part-time' | 'internship' | 'fresher')[]>(['internship']);
  let minSalary = $state(5_000_000);
  let maxSalary = $state(15_000_000);
  let isSalaryNegotiable = $state(false);
  let selectedProvinceCode = $state('01'); // Default: Thành phố Hà Nội
  let selectedWardCode = $state('00166'); // Default: Phường Cầu Giấy (00166)
  let detailAddress = $state('Số 10 Phạm Văn Bạch');
  let workType = $state<'Part-time' | 'Thực tập' | 'Full-time' | 'Hybrid' | 'Remote'>('Thực tập');
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

    // Priority central cities
    for (const p of PROVINCES.filter((item) => priorityCodes.includes(item.code))) {
      list.push({
        value: p.code,
        label: p.fullName,
        subLabel: p.name,
        badge: p.code,
        group: 'Thành phố trọng điểm',
      });
    }

    // All provinces
    for (const p of sortedProvinces) {
      list.push({
        value: p.code,
        label: p.fullName,
        subLabel: p.name,
        badge: p.code,
        group: 'Tất cả 34 tỉnh thành',
      });
    }

    // Remote option
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

  function toggleCategory(cat: 'part-time' | 'internship' | 'fresher') {
    if (selectedCategories.includes(cat)) {
      // Keep at least one category selected
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
      const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
      salaryText = minSalary === maxSalary ? `${fmt(minSalary)} / tháng` : `${fmt(minSalary)} - ${fmt(maxSalary)} / tháng`;
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
  maxWidth="3xl"
  iconText="RECRUIT"
  title={isEditing ? 'Chỉnh sửa bài đăng tuyển dụng' : 'Đăng tin tuyển dụng mới'}
  subtitle="Tiếp cận sinh viên tài năng 327+ trường Đại học • Cao đẳng"
  bodyClass="p-0"
  ariaLabel={isEditing ? 'Chỉnh sửa bài đăng' : 'Đăng tin tuyển dụng'}
>
  <!-- Quota Status Banner (Only for new job posts) -->
      {#if stats && !isEditing}
        <div class="px-6 py-2.5 bg-black text-white flex items-center justify-between text-xs font-mono border-b border-black">
          <div class="flex items-center gap-2">
            <span class="text-neutral-400">HẠN MỨC ĐĂNG BÀI:</span>
            <span class="font-bold text-signal-emerald uppercase">
              {stats.usedCount} / {stats.maxPosts === Infinity ? '∞' : stats.maxPosts} BÀI THÁNG NÀY ({stats.tier === 'enterprise' ? 'Enterprise' : stats.tier === 'premium' ? 'Premium ✦' : 'Gói Free'})
            </span>
          </div>

          <button
            type="button"
            onclick={openUpgradeModal}
            class="text-signal-emerald hover:underline font-bold uppercase text-[11px] flex items-center gap-1"
          >
            <span>[ Nâng cấp gói ✦ ]</span>
          </button>
        </div>

        {#if stats.isLimitReached}
          <div class="m-6 p-5 rounded-swiss-sm border border-signal-crimson bg-red-50 text-center space-y-2.5 shadow-swiss-card">
            <span class="font-mono text-xs font-black text-signal-crimson block uppercase">
              [ DOANH NGHIỆP ĐÃ ĐẠT GIỚI HẠN {stats.maxPosts} BÀI ĐĂNG CỦA GÓI FREE ]
            </span>
            <p class="font-mono text-xs text-swiss-700 max-w-md mx-auto leading-relaxed">
              Mặc định gói miễn phí chỉ cho phép tối đa 10 bài đăng mỗi tháng. Để tiếp tục đăng bài tuyển dụng mới, vui lòng nâng cấp lên gói <strong>Premium (50 bài/tháng)</strong> hoặc <strong>Enterprise (Không giới hạn)</strong>.
            </p>
            <div class="pt-1">
              <button
                type="button"
                onclick={openUpgradeModal}
                class="rounded-swiss-sm bg-signal-emerald px-5 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-emerald-700 transition-colors shadow-swiss-card"
              >
                Nâng cấp gói Premium ngay →
              </button>
            </div>
          </div>
        {/if}
      {/if}

      <!-- Form Body -->
      {#if isEditing || !stats?.isLimitReached}
      <form onsubmit={handleSubmit} class="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Title -->
          <div class="sm:col-span-2">
            <label for="post-title" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
              Tiêu đề công việc *
            </label>
            <input
              type="text"
              id="post-title"
              bind:value={title}
              required
              placeholder="Ví dụ: Thực tập sinh Lập trình Frontend (React / Svelte)"
              class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-bold text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <!-- Multi-Category Selection (Phân tầng sinh viên - Chọn nhiều nhóm) -->
          <div class="sm:col-span-2 space-y-1.5">
            <span class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700">
              Phân tầng sinh viên mục tiêu (Có thể chọn nhiều nhóm) *
            </span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <!-- Nhóm 1 -->
              <button
                type="button"
                onclick={() => toggleCategory('part-time')}
                class="flex flex-col text-left p-3 rounded-swiss-sm border transition-all
                  {selectedCategories.includes('part-time')
                    ? 'border-black bg-black text-white shadow-swiss-card'
                    : 'border-swiss-300 bg-white text-black hover:border-black'}"
              >
                <div class="flex items-center justify-between w-full mb-1">
                  <span class="font-mono text-[10px] font-bold tracking-wider {selectedCategories.includes('part-time') ? 'text-signal-emerald' : 'text-swiss-500'}">
                    [PT-01]
                  </span>
                  <span class="text-xs">{selectedCategories.includes('part-time') ? '✓' : '+'}</span>
                </div>
                <span class="text-xs font-bold uppercase">Nhóm 01: Năm 1 - 2</span>
                <span class="text-[10px] {selectedCategories.includes('part-time') ? 'text-swiss-300' : 'text-swiss-500'}">
                  Part-time linh hoạt, an toàn
                </span>
              </button>

              <!-- Nhóm 2 -->
              <button
                type="button"
                onclick={() => toggleCategory('internship')}
                class="flex flex-col text-left p-3 rounded-swiss-sm border transition-all
                  {selectedCategories.includes('internship')
                    ? 'border-black bg-black text-white shadow-swiss-card'
                    : 'border-swiss-300 bg-white text-black hover:border-black'}"
              >
                <div class="flex items-center justify-between w-full mb-1">
                  <span class="font-mono text-[10px] font-bold tracking-wider {selectedCategories.includes('internship') ? 'text-signal-emerald' : 'text-swiss-500'}">
                    [INT-02]
                  </span>
                  <span class="text-xs">{selectedCategories.includes('internship') ? '✓' : '+'}</span>
                </div>
                <span class="text-xs font-bold uppercase">Nhóm 02: Năm 3 - 4</span>
                <span class="text-[10px] {selectedCategories.includes('internship') ? 'text-swiss-300' : 'text-swiss-500'}">
                  Thực tập chuyên ngành
                </span>
              </button>

              <!-- Nhóm 3 -->
              <button
                type="button"
                onclick={() => toggleCategory('fresher')}
                class="flex flex-col text-left p-3 rounded-swiss-sm border transition-all
                  {selectedCategories.includes('fresher')
                    ? 'border-black bg-black text-white shadow-swiss-card'
                    : 'border-swiss-300 bg-white text-black hover:border-black'}"
              >
                <div class="flex items-center justify-between w-full mb-1">
                  <span class="font-mono text-[10px] font-bold tracking-wider {selectedCategories.includes('fresher') ? 'text-signal-emerald' : 'text-swiss-500'}">
                    [FR-03]
                  </span>
                  <span class="text-xs">{selectedCategories.includes('fresher') ? '✓' : '+'}</span>
                </div>
                <span class="text-xs font-bold uppercase">Nhóm 03: Mới tốt nghiệp</span>
                <span class="text-[10px] {selectedCategories.includes('fresher') ? 'text-swiss-300' : 'text-swiss-500'}">
                  Fresher Full-time
                </span>
              </button>
            </div>
          </div>

          <!-- Dual Range Salary Slider (Mức lương slider 2 đầu max 100M) -->
          <div class="sm:col-span-2 rounded-swiss-sm border border-swiss-300 bg-swiss-50/50 p-3.5">
            <DualRangeSlider
              bind:minVal={minSalary}
              bind:maxVal={maxSalary}
              bind:isNegotiable={isSalaryNegotiable}
              label="Mức lương / Phụ cấp sinh viên (Slider 2 đầu, tối đa 100M)"
            />
          </div>

          <!-- Province Reusable Searchable Dropdown -->
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

          <!-- Ward Reusable Searchable Dropdown -->
          <div>
            {#if selectedProvinceCode === 'remote'}
              <label class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                Phường / Xã
              </label>
              <div class="w-full rounded-swiss-sm border border-swiss-200 bg-swiss-100 px-3 py-2 text-xs font-mono text-swiss-500">
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

          <!-- Detail Address / Street -->
          <div>
            <label for="post-detail-address" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
              Địa chỉ chi tiết (Số nhà, Tên đường, Tòa nhà)
            </label>
            <input
              type="text"
              id="post-detail-address"
              bind:value={detailAddress}
              placeholder="Ví dụ: Tòa nhà FPT, Số 10 Phạm Văn Bạch"
              class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <!-- Work type -->
          <div>
            <label for="post-worktype" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
              Hình thức làm việc *
            </label>
            <select
              id="post-worktype"
              bind:value={workType}
              class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-semibold text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black bg-white"
            >
              <option value="Part-time">Part-time</option>
              <option value="Thực tập">Thực tập</option>
              <option value="Full-time">Full-time</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <!-- When2Meet Interactive Schedule Picker -->
          <div class="sm:col-span-2">
            <When2MeetSchedule
              bind:scheduleText={schedule}
              bind:scheduleGrid={scheduleGrid}
            />
          </div>

          <!-- Deadline Calendar Picker -->
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

          <!-- Tags -->
          <div>
            <label for="post-tags" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
              Kỹ năng & Tags (Phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              id="post-tags"
              bind:value={tagsStr}
              placeholder="Ví dụ: React, TypeScript, Mentor, Dấu mộc"
              class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <!-- Thumbnail Attachment (Đính kèm ảnh thumbnail bài tuyển dụng) -->
          <div class="sm:col-span-2 space-y-2 rounded-swiss-sm border border-swiss-300 bg-swiss-50/50 p-3.5">
            <div class="flex items-center justify-between">
              <span class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700">
                Ảnh Thumbnail bài tuyển dụng
              </span>
              {#if imageUrl}
                <button
                  type="button"
                  onclick={() => (imageUrl = '')}
                  class="font-mono text-[10px] text-signal-crimson hover:underline"
                >
                  [Gỡ ảnh tải lên]
                </button>
              {/if}
            </div>

            <div class="flex flex-col sm:flex-row gap-4 items-center">
              <!-- Thumbnail Preview Box -->
              <div class="relative h-28 w-44 shrink-0 rounded-swiss-sm border border-swiss-300 bg-swiss-200 overflow-hidden flex items-center justify-center">
                {#if imageUrl}
                  <img src={imageUrl} alt="Thumbnail preview" class="h-full w-full object-cover" />
                {:else}
                  <div class="text-center p-2 font-mono text-[10px] text-swiss-400">
                    Chưa có ảnh (Sử dụng ảnh mặc định)
                  </div>
                {/if}
                {#if isUploadingThumbnail}
                  <div class="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-mono text-[10px]">
                    Đang xử lý ảnh...
                  </div>
                {/if}
              </div>

              <!-- Upload actions -->
              <div class="space-y-2 flex-1 w-full text-xs">
                <label class="inline-flex items-center gap-2 rounded-swiss-sm border border-black bg-white px-3.5 py-1.5 font-mono text-xs font-bold uppercase text-black hover:bg-swiss-100 transition-colors cursor-pointer shadow-xs">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Tải ảnh từ máy tính (JPG/PNG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onchange={handleThumbnailFile}
                    class="sr-only"
                  />
                </label>

                <div class="flex items-center gap-2">
                  <span class="font-mono text-[10px] text-swiss-400">hoặc dán URL:</span>
                  <input
                    type="url"
                    bind:value={imageUrl}
                    placeholder="https://images.unsplash.com/..."
                    class="flex-1 rounded-swiss-xs border border-swiss-300 px-2.5 py-1 text-xs font-mono text-black focus:border-black focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Summary description -->
          <div class="sm:col-span-2">
            <label for="post-summary" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
              Tóm tắt ngắn gọn (Hiển thị ngoài danh sách việc) *
            </label>
            <textarea
              id="post-summary"
              bind:value={summary}
              required
              rows="2"
              placeholder="Tóm tắt 1-2 câu về vị trí tuyển dụng, quyền lợi chính..."
              class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            ></textarea>
          </div>

          <!-- Markdown Editor Section -->
          <div class="sm:col-span-2 space-y-2">
            <div class="flex items-center justify-between border-b border-swiss-300 pb-1.5">
              <span class="font-mono text-[11px] uppercase tracking-wide text-swiss-700">
                Chi tiết tuyển dụng (Định dạng Markdown) *
              </span>
              <div class="flex items-center gap-1 font-mono text-[10px] font-bold">
                <button
                  type="button"
                  onclick={() => (markdownMode = 'write')}
                  class="px-2.5 py-0.5 rounded-swiss-xs transition-colors {markdownMode === 'write' ? 'bg-black text-white' : 'text-swiss-500 hover:text-black'}"
                >
                  SOẠN THẢO
                </button>
                <button
                  type="button"
                  onclick={() => (markdownMode = 'preview')}
                  class="px-2.5 py-0.5 rounded-swiss-xs transition-colors {markdownMode === 'preview' ? 'bg-black text-white' : 'text-swiss-500 hover:text-black'}"
                >
                  XEM TRƯỚC
                </button>
              </div>
            </div>

            {#if markdownMode === 'write'}
              <textarea
                id="post-markdown-editor"
                bind:value={markdownContent}
                required
                rows="8"
                class="w-full rounded-swiss-sm border border-swiss-300 p-3 font-mono text-xs leading-relaxed text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              ></textarea>
            {:else}
              <div class="max-h-60 overflow-y-auto rounded-swiss-sm border border-swiss-300 bg-swiss-50/50 p-4 prose-swiss">
                {@html renderedPreview}
              </div>
            {/if}
          </div>
        </div>

        <!-- Submit Actions -->
        <div class="flex items-center justify-end gap-3 border-t border-swiss-200 pt-4">
          <button
            type="button"
            onclick={closePostJobModal}
            class="rounded-swiss-sm border border-swiss-300 px-4 py-2 font-mono text-xs font-bold uppercase text-black hover:border-black transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            class="rounded-swiss-sm bg-black px-6 py-2 font-mono text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 transition-colors shadow-swiss-card"
          >
            {isEditing ? 'Lưu thay đổi bài đăng ✓' : 'Đăng bài tuyển dụng ngay →'}
          </button>
        </div>
      </form>
      {/if}
</Modal>
