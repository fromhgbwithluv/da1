<script lang="ts">
  import {
    isApplicationHistoryOpen,
    closeApplicationHistoryModal,
    currentUser,
    databaseJobs
  } from '../stores/auth';
  import { openJobDetail } from '../stores/favorites';
  import { formatDateTime } from '../utils/formatters';
  import { url } from '../utils/url';
  import Modal from './Modal.svelte';
  import Badge from './Badge.svelte';
  import type { AppliedJobRecord } from '../types/user';

  let appliedList = $derived(
    $currentUser?.appliedJobs || []
  );

  function handleViewJob(record: AppliedJobRecord) {
    const job = $databaseJobs.find((j) => j.id === record.jobId);
    if (job) {
      openJobDetail(job);
    }
  }
</script>

<Modal
  isOpen={$isApplicationHistoryOpen}
  onClose={closeApplicationHistoryModal}
  title="Lịch sử các công ty đã ứng tuyển"
  subtitle={`Tài khoản: ${$currentUser?.fullName || 'Sinh viên'} (${appliedList.length} hồ sơ đã gửi)`}
  iconText="HIS"
  maxWidth="2xl"
  bodyClass="max-h-[65vh] overflow-y-auto p-6 space-y-4 font-mono text-xs"
>
  {#if appliedList.length === 0}
    <div class="rounded-swiss-sm border border-dashed border-swiss-300 p-8 text-center bg-swiss-50">
      <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-swiss-sm bg-swiss-200 text-black text-xs font-bold">
        00
      </div>
      <p class="font-mono text-xs font-bold text-black uppercase mb-1">
        Chưa có lịch sử ứng tuyển
      </p>
      <p class="font-mono text-[11px] text-swiss-500 max-w-sm mx-auto leading-relaxed">
        Bạn chưa nộp hồ sơ vào công ty nào. Hãy dạo quanh danh mục việc làm, ghim các vị trí yêu thích và gửi hồ sơ nhé!
      </p>
    </div>
  {:else}
    {#each appliedList as record (record.id)}
      <div class="rounded-swiss-sm border border-swiss-300 bg-white p-4 space-y-2.5 transition-colors hover:border-black shadow-xs">
        <!-- Top bar: Company & Status -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-swiss-100 pb-2">
          <div class="flex items-center gap-2">
            <span class="font-black text-black uppercase tracking-tight text-sm">
              {record.company}
            </span>
            {#if record.companyUsername}
              <a
                href={url(`/profile/${record.companyUsername}`)}
                class="text-[10px] text-swiss-500 hover:text-black hover:underline lowercase"
              >
                ({record.companyUsername})
              </a>
            {/if}
          </div>

          <Badge variant="emerald" text="ĐÃ NỘP HỒ SƠ" dot={true} />
        </div>

        <!-- Job title & details -->
        <div class="space-y-1">
          <div class="font-bold text-black text-xs sm:text-sm">
            {record.jobTitle}
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-swiss-600">
            <span>LƯƠNG: <strong class="text-black font-bold">{record.salary}</strong></span>
            <span>• ĐỊA ĐIỂM: {record.location}</span>
          </div>
        </div>

        <!-- Metadata row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-swiss-xs bg-swiss-50 p-2.5 text-[11px] text-swiss-600 border border-swiss-200">
          <div>
            <span class="text-swiss-400 block text-[9px] uppercase font-bold">MÃ HỒ SƠ //</span>
            <span class="font-bold text-black">{record.applicationCode}</span>
          </div>
          <div>
            <span class="text-swiss-400 block text-[9px] uppercase font-bold">THỜI GIAN NỘP //</span>
            <span class="font-bold text-black">{formatDateTime(record.appliedAt)}</span>
          </div>
          {#if record.cvName}
            <div class="sm:col-span-2">
              <span class="text-swiss-400 block text-[9px] uppercase font-bold">HỒ SƠ / CV ĐÍNH KÈM //</span>
              <span class="font-bold text-black truncate block">{record.cvName}</span>
            </div>
          {/if}
        </div>

        <!-- Bottom Actions -->
        <div class="flex items-center justify-between pt-1">
          <span class="text-[10px] text-swiss-400 font-bold uppercase">
            Gói nộp: {record.paymentMethod === 'qr_support' ? 'Sinh viên ủng hộ dự án (15k)' : 'Miễn phí 100%'}
          </span>
          <button
            type="button"
            onclick={() => handleViewJob(record)}
            class="font-mono text-xs font-bold text-black hover:underline uppercase"
          >
            [ Xem lại tin tuyển dụng → ]
          </button>
        </div>
      </div>
    {/each}
  {/if}

  {#snippet footer()}
    <div class="flex items-center justify-between">
      <span class="font-mono text-[10px] text-swiss-500 uppercase">
        TopSiVi • Bảo vệ quyền lợi ứng viên 100%
      </span>
      <button
        type="button"
        onclick={closeApplicationHistoryModal}
        class="rounded-swiss-sm bg-black px-4 py-1.5 font-mono text-xs font-bold uppercase text-white hover:bg-neutral-800 transition-colors shadow-swiss-card"
      >
        Đóng
      </button>
    </div>
  {/snippet}
</Modal>
