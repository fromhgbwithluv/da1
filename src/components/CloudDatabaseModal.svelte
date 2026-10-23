<script lang="ts">
  import {
    isCloudConfigModalOpen,
    closeCloudConfigModal,
    isCloudConnected,
    isCloudSyncing,
    forceSyncToCloud,
    forceSyncFromCloud,
    initCloudDatabase
  } from '../stores/auth';
  import {
    getSupabaseConfig,
    saveSupabaseConfig,
    clearSupabaseConfig,
    SUPABASE_SETUP_SQL
  } from '../lib/supabase';
  import { showToast } from '../stores/toast';
  import Modal from './Modal.svelte';
  import Badge from './Badge.svelte';

  let inputUrl = $state('');
  let inputKey = $state('');
  let isTesting = $state(false);
  let errorMessage = $state('');
  let isCopied = $state(false);

  // Sync inputs with current config when modal opens
  $effect(() => {
    if ($isCloudConfigModalOpen) {
      const cfg = getSupabaseConfig();
      inputUrl = cfg.url;
      inputKey = cfg.anonKey;
      errorMessage = '';
    }
  });

  async function handleConnect() {
    errorMessage = '';
    if (!inputUrl.trim() || !inputKey.trim()) {
      errorMessage = 'Vui lòng nhập đầy đủ Supabase URL và Anon Public Key.';
      return;
    }

    isTesting = true;
    try {
      const res = await saveSupabaseConfig(inputUrl, inputKey);
      if (res.success) {
        showToast('Kết nối Supabase Cloud thành công!', 'success');
        await initCloudDatabase();
      } else {
        errorMessage = res.error || 'Kết nối thất bại. Vui lòng kiểm tra lại URL và Key.';
      }
    } catch (err: any) {
      errorMessage = err?.message || 'Có lỗi xảy ra khi kiểm tra kết nối.';
    } finally {
      isTesting = false;
    }
  }

  function handleDisconnect() {
    if (confirm('Bạn có chắc chắn muốn ngắt kết nối Supabase Cloud? Ứng dụng sẽ trở lại chế độ lưu trữ cục bộ (Local Storage).')) {
      clearSupabaseConfig();
      isCloudConnected.set(false);
      inputUrl = '';
      inputKey = '';
      showToast('Đã ngắt kết nối Supabase Cloud', 'info');
    }
  }

  async function handleCopySQL() {
    try {
      await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
      isCopied = true;
      showToast('Đã sao chép mã SQL vào clipboard!', 'success');
      setTimeout(() => {
        isCopied = false;
      }, 2500);
    } catch {
      showToast('Không thể sao chép tự động, vui lòng chọn và copy thủ công', 'remove');
    }
  }
</script>

<Modal
  isOpen={$isCloudConfigModalOpen}
  onClose={closeCloudConfigModal}
  title="CẤU HÌNH CLOUD DATABASE (SUPABASE)"
  maxWidth="max-w-2xl"
>
  <div class="space-y-6">
    <!-- Header status badge -->
    <div class="flex items-center justify-between border-b border-swiss-200 pb-4">
      <div class="flex items-center gap-2">
        <span class="font-mono text-xs font-black uppercase tracking-wider text-black">
          TRẠNG THÁI HỆ THỐNG:
        </span>
        {#if $isCloudConnected}
          <Badge variant="emerald" size="sm" withDot>
            ĐÃ KẾT NỐI CLOUD REALTIME
          </Badge>
        {:else}
          <Badge variant="amber" size="sm">
            CHẾ ĐỘ CỤC BỘ (LOCAL STORAGE)
          </Badge>
        {/if}
      </div>

      {#if $isCloudSyncing}
        <div class="flex items-center gap-1.5 font-mono text-[11px] text-signal-emerald animate-pulse">
          <span class="inline-block h-2 w-2 rounded-full bg-signal-emerald"></span>
          <span>Đang đồng bộ...</span>
        </div>
      {/if}
    </div>

    {#if $isCloudConnected}
      <!-- Connected Screen -->
      <div class="rounded-swiss-md border border-signal-emerald/40 bg-signal-emerald/5 p-4 space-y-3 font-mono text-xs">
        <div class="flex items-center justify-between">
          <span class="font-bold text-black uppercase">Dự án Supabase đang liên kết:</span>
          <span class="text-[11px] text-swiss-600 truncate max-w-[260px] font-mono">{inputUrl}</span>
        </div>
        <p class="text-[11px] text-swiss-700 leading-relaxed font-sans">
          ✓ Mọi thay đổi về tài khoản, hồ sơ sinh viên, và bài đăng tuyển dụng được tự động lưu trữ lên Cloud và đồng bộ thời gian thực (Realtime) trên tất cả các thiết bị.
        </p>
      </div>

      <!-- Action buttons -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onclick={forceSyncToCloud}
          disabled={$isCloudSyncing}
          class="rounded-swiss-sm bg-black px-4 py-2.5 font-mono text-xs font-bold uppercase text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <span>↑ Đẩy dữ liệu hiện tại lên Cloud</span>
        </button>

        <button
          type="button"
          onclick={forceSyncFromCloud}
          disabled={$isCloudSyncing}
          class="rounded-swiss-sm border border-black bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase text-black hover:bg-swiss-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <span>↓ Tải lại dữ liệu mới từ Cloud</span>
        </button>
      </div>

      <div class="border-t border-swiss-200 pt-3 flex items-center justify-between">
        <button
          type="button"
          onclick={handleDisconnect}
          class="font-mono text-xs font-bold text-rose-600 hover:text-rose-800 underline uppercase"
        >
          Ngắt kết nối Cloud
        </button>

        <button
          type="button"
          onclick={closeCloudConfigModal}
          class="rounded-swiss-sm border border-swiss-300 bg-white px-4 py-1.5 font-mono text-xs font-bold uppercase text-black hover:bg-swiss-50"
        >
          Đóng
        </button>
      </div>
    {:else}
      <!-- Disconnected / Setup Form -->
      <div class="space-y-4">
        <div class="border-l-2 border-black pl-3 py-1">
          <p class="font-sans text-xs text-swiss-700 leading-relaxed">
            Vì <strong>GitHub Pages</strong> là máy chủ tĩnh (Static Web), dữ liệu mặc định chỉ được lưu trong trình duyệt của từng máy. Để <strong>đồng bộ dữ liệu giữa các máy tính và điện thoại</strong>, bạn chỉ cần liên kết với 1 tài khoản Supabase miễn phí.
          </p>
        </div>

        {#if errorMessage}
          <div class="rounded-swiss-sm border border-rose-300 bg-rose-50 p-3 font-mono text-xs text-rose-700">
            {errorMessage}
          </div>
        {/if}

        <div class="space-y-3">
          <div>
            <label for="sb-url" class="block font-mono text-xs font-bold uppercase text-black mb-1">
              1. Supabase Project URL *
            </label>
            <input
              id="sb-url"
              type="text"
              bind:value={inputUrl}
              placeholder="https://xyzabcdefgh.supabase.co"
              class="w-full rounded-swiss-sm border border-swiss-300 bg-swiss-50/50 px-3.5 py-2 font-mono text-xs text-black placeholder-swiss-400 focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label for="sb-key" class="block font-mono text-xs font-bold uppercase text-black mb-1">
              2. Supabase Anon Public Key *
            </label>
            <input
              id="sb-key"
              type="text"
              bind:value={inputKey}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              class="w-full rounded-swiss-sm border border-swiss-300 bg-swiss-50/50 px-3.5 py-2 font-mono text-xs text-black placeholder-swiss-400 focus:border-black focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onclick={handleConnect}
          disabled={isTesting}
          class="w-full rounded-swiss-sm bg-black py-3 font-mono text-xs font-bold uppercase text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-swiss-card"
        >
          {isTesting ? 'Đang kiểm tra kết nối...' : 'Kiểm tra & Kết nối Cloud Database →'}
        </button>

        <!-- Quick 3-Step Setup Instructions -->
        <div class="border border-swiss-200 rounded-swiss-md p-4 bg-swiss-50/60 space-y-3 font-sans text-xs">
          <div class="flex items-center justify-between border-b border-swiss-200 pb-2">
            <span class="font-mono text-[11px] font-black uppercase text-black">
              HƯỚNG DẪN TẠO SUPABASE (MIỄN PHÍ TRONG 2 PHÚT):
            </span>
            <button
              type="button"
              onclick={handleCopySQL}
              class="rounded-swiss-sm border border-black bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-black hover:bg-swiss-100 transition-colors flex items-center gap-1"
            >
              <span>{isCopied ? '✓ Đã chép' : 'Sao chép mã SQL'}</span>
            </button>
          </div>

          <ol class="list-decimal list-inside space-y-1.5 text-swiss-700 leading-relaxed">
            <li>Truy cập <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" class="font-bold text-black underline">supabase.com</a>, đăng nhập và bấm <strong>"New Project"</strong>.</li>
            <li>Tại menu bên trái, mở <strong>SQL Editor</strong> > bấm <strong>"New query"</strong> > dán đoạn mã SQL bên dưới và bấm <strong>Run</strong>:</li>
          </ol>

          <pre class="bg-black text-white p-3 rounded font-mono text-[10px] overflow-x-auto max-h-36 leading-normal"><code>{SUPABASE_SETUP_SQL}</code></pre>

          <p class="text-swiss-700 text-[11px]">
            3. Vào <strong>Project Settings</strong> > <strong>API</strong> > copy <strong>Project URL</strong> và <strong>anon public key</strong> dán vào 2 ô phía trên là xong!
          </p>
        </div>
      </div>
    {/if}
  </div>
</Modal>
