<script lang="ts">
  import {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    currentUser,
    databaseStore,
    login,
    register,
    updateProfile,
    uploadCVFile,
    removeCVFile,
    uploadAvatar,
    removeAvatar,
    addPortfolioProject,
    removePortfolioProject,
    exportDatabaseJSON,
    openPostJobModal
  } from '../stores/auth';
  import type { UserRole } from '../types/user';
  import UniversitySelect from './UniversitySelect.svelte';
  import Modal from './Modal.svelte';
  import { url } from '../utils/url';

  // Login form state
  let loginIdentifier = $state('');
  let loginPassword = $state('');

  // Register form state
  let regRole = $state<UserRole>('student');
  let regFullName = $state('');
  let regEmail = $state('');
  let regUsername = $state('');
  let regPassword = $state('');
  let regPhone = $state('');
  let regAvatar = $state('');
  // Student specifics
  let regUniversity = $state('');
  let regAcademicYear = $state('Năm 1');
  let regMajor = $state('');
  let regBio = $state('');
  // Company specifics
  let regIndustry = $state('Công nghệ thông tin / Phần mềm');
  let regAddress = $state('');
  let regWebsite = $state('');

  async function handleRegAvatarUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const dataUrl = await uploadAvatar(input.files[0]);
      if (dataUrl) {
        regAvatar = dataUrl;
      }
    }
  }

  // Forgot password form state
  let forgotEmail = $state('');
  let forgotSubmitted = $state(false);

  // Profile edit state
  let editFullName = $state('');
  let editPhone = $state('');
  let editUniversity = $state('');
  let editAcademicYear = $state('');
  let editMajor = $state('');
  let editBio = $state('');
  let editPortfolioLink = $state('');
  let editIndustry = $state('');
  let editAddress = $state('');
  let editWebsite = $state('');

  // New project state
  let newProjectTitle = $state('');
  let newProjectDesc = $state('');
  let newProjectLink = $state('');
  let showAddProject = $state(false);

  // Sync edit state when user changes
  $effect(() => {
    if ($currentUser) {
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

  function handleLoginSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) return;
    login(loginIdentifier, loginPassword);
  }

  function handleRegisterSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim() || !regUsername.trim() || !regPhone.trim()) return;

    register({
      role: regRole,
      fullName: regFullName.trim(),
      email: regEmail.trim(),
      username: regUsername.trim(),
      password: regPassword || '123456',
      phone: regPhone.trim(),
      avatar: regAvatar,
      university: regUniversity.trim(),
      academicYear: regAcademicYear,
      major: regMajor.trim(),
      bio: regBio.trim(),
      industry: regIndustry.trim(),
      address: regAddress.trim(),
      website: regWebsite.trim(),
    });
  }

  function handleForgotSubmit(e: SubmitEvent) {
    e.preventDefault();
    forgotSubmitted = true;
  }

  function handleSaveProfile(e: SubmitEvent) {
    e.preventDefault();
    if ($currentUser?.role === 'student') {
      updateProfile({
        fullName: editFullName,
        phone: editPhone,
        university: editUniversity,
        academicYear: editAcademicYear,
        major: editMajor,
        bio: editBio,
        portfolioLink: editPortfolioLink,
      });
    } else {
      updateProfile({
        fullName: editFullName,
        phone: editPhone,
        industry: editIndustry,
        address: editAddress,
        website: editWebsite,
        bio: editBio,
      });
    }
  }

  function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      uploadCVFile(file);
    }
  }

  function handleAddProject() {
    if (!newProjectTitle.trim()) return;
    addPortfolioProject(newProjectTitle, newProjectDesc, newProjectLink);
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

<Modal
  isOpen={$isAuthModalOpen}
  onClose={closeAuthModal}
  maxWidth="2xl"
  iconText="TSV"
  title={$authModalTab === 'login' ? 'Đăng nhập hệ thống' : $authModalTab === 'register' ? 'Đăng ký tài khoản mới' : $authModalTab === 'forgot' ? 'Quên mật khẩu' : 'Hồ sơ người dùng'}
  subtitle="Hệ thống tài khoản phân quyền: Sinh viên & Doanh nghiệp"
  bodyClass="p-0"
  ariaLabel="Hệ thống xác thực tài khoản"
>
  <!-- Navigation Tabs (No 1-click login) -->
      <div class="flex border-b border-black bg-white px-6">
        <button
          type="button"
          onclick={() => { authModalTab.set('login'); forgotSubmitted = false; }}
          class="px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all
          {$authModalTab === 'login' 
            ? 'border-black text-black' 
            : 'border-transparent text-swiss-400 hover:text-black'}"
        >
          [ ĐĂNG NHẬP ]
        </button>

        <button
          type="button"
          onclick={() => authModalTab.set('register')}
          class="px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all
          {$authModalTab === 'register' 
            ? 'border-black text-black' 
            : 'border-transparent text-swiss-400 hover:text-black'}"
        >
          [ ĐĂNG KÝ ]
        </button>

        <button
          type="button"
          onclick={() => { authModalTab.set('forgot'); forgotSubmitted = false; }}
          class="px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all
          {$authModalTab === 'forgot' 
            ? 'border-black text-black' 
            : 'border-transparent text-swiss-400 hover:text-black'}"
        >
          [ QUÊN MẬT KHẨU ]
        </button>

        {#if $currentUser}
          <button
            type="button"
            onclick={() => authModalTab.set('profile')}
            class="px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all
            {$authModalTab === 'profile' 
              ? 'border-black text-black' 
              : 'border-transparent text-swiss-400 hover:text-black'}"
          >
            [ HỒ SƠ CỦA BẠN ]
          </button>
        {/if}
      </div>

      <!-- Body Container -->
      <div class="p-6 max-h-[75vh] overflow-y-auto">
        <!-- ================= TAB: LOGIN ================= -->
        {#if $authModalTab === 'login'}
          <form onsubmit={handleLoginSubmit} class="space-y-4">
            <div>
              <label for="login-id" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                Tên đăng nhập (@username) hoặc Email *
              </label>
              <input
                type="text"
                id="login-id"
                bind:value={loginIdentifier}
                required
                placeholder="Ví dụ: @an.nguyen hoặc an.nguyen@student.edu.vn"
                class="w-full rounded-swiss-sm border border-swiss-300 px-3.5 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label for="login-pass" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700">
                  Mật khẩu *
                </label>
                <button
                  type="button"
                  onclick={() => { authModalTab.set('forgot'); forgotSubmitted = false; }}
                  class="font-mono text-[10px] text-swiss-500 hover:text-black uppercase"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input
                type="password"
                id="login-pass"
                bind:value={loginPassword}
                required
                placeholder="••••••••"
                class="w-full rounded-swiss-sm border border-swiss-300 px-3.5 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div class="pt-2 flex items-center justify-between border-t border-swiss-200">
              <button
                type="button"
                onclick={() => authModalTab.set('register')}
                class="font-mono text-xs font-bold text-black hover:underline uppercase"
              >
                Chưa có tài khoản? Đăng ký →
              </button>

              <button
                type="submit"
                class="rounded-swiss-sm bg-black px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 transition-colors"
              >
                Đăng nhập
              </button>
            </div>
          </form>

        <!-- ================= TAB: REGISTER (ROLE SELECTION) ================= -->
        {:else if $authModalTab === 'register'}
          <form onsubmit={handleRegisterSubmit} class="space-y-4">
            <!-- 2 Options: Sinh viên vs Doanh nghiệp -->
            <div>
              <span class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-2">
                Chọn vai trò tài khoản:
              </span>
              <div class="grid grid-cols-2 gap-3">
                <label class="cursor-pointer border p-3 rounded-swiss-sm transition-colors text-left flex flex-col justify-between
                  {regRole === 'student' ? 'border-black bg-black text-white' : 'border-swiss-300 bg-white text-black hover:border-black'}">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    bind:group={regRole}
                    class="sr-only"
                  />
                  <div>
                    <span class="font-mono text-xs font-black uppercase block">Sinh viên / Ứng viên</span>
                    <span class="font-mono text-[10px] {regRole === 'student' ? 'text-swiss-300' : 'text-swiss-500'} mt-1 block">
                      Tìm việc part-time, thực tập, fresher & đính kèm CV
                    </span>
                  </div>
                </label>

                <label class="cursor-pointer border p-3 rounded-swiss-sm transition-colors text-left flex flex-col justify-between
                  {regRole === 'company' ? 'border-black bg-black text-white' : 'border-swiss-300 bg-white text-black hover:border-black'}">
                  <input
                    type="radio"
                    name="role"
                    value="company"
                    bind:group={regRole}
                    class="sr-only"
                  />
                  <div>
                    <span class="font-mono text-xs font-black uppercase block">Doanh nghiệp / NTD</span>
                    <span class="font-mono text-[10px] {regRole === 'company' ? 'text-swiss-300' : 'text-swiss-500'} mt-1 block">
                      Đăng bài viết tuyển dụng mới dạng Markdown
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Avatar Upload Option -->
            <div class="border border-swiss-300 rounded-swiss-sm p-3 bg-swiss-50 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="relative h-12 w-12 shrink-0 overflow-hidden rounded-swiss-sm border border-black bg-white flex items-center justify-center font-mono font-bold text-xs text-black">
                  {#if regAvatar}
                    <img src={regAvatar} alt="Xem trước avatar" class="h-full w-full object-cover" />
                  {:else}
                    <span class="text-swiss-400 text-[10px]">AVATAR</span>
                  {/if}
                </div>
                <div class="min-w-0">
                  <span class="block font-mono text-xs font-bold uppercase text-black truncate">
                    {regRole === 'student' ? 'Ảnh đại diện sinh viên' : 'Logo / Ảnh doanh nghiệp'}
                  </span>
                  <span class="block font-mono text-[10px] text-swiss-500">
                    PNG, JPG, WEBP (Tự động tối ưu hoá)
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <label class="cursor-pointer rounded-swiss-sm border border-black bg-white px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase text-black hover:bg-swiss-100 transition-colors">
                  <span>{regAvatar ? 'Đổi ảnh' : 'Tải ảnh lên'}</span>
                  <input type="file" accept="image/*" onchange={handleRegAvatarUpload} class="sr-only" />
                </label>
                {#if regAvatar}
                  <button
                    type="button"
                    onclick={() => (regAvatar = '')}
                    class="rounded-swiss-sm border border-signal-crimson bg-white px-2 py-1.5 font-mono text-[11px] font-bold text-signal-crimson hover:bg-red-50"
                  >
                    Gỡ
                  </button>
                {/if}
              </div>
            </div>

            <!-- Common Fields -->
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label for="reg-username" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                  Tên định danh Username (URL: /profile/@username) *
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-xs text-swiss-400">@</span>
                  <input
                    type="text"
                    id="reg-username"
                    bind:value={regUsername}
                    required
                    placeholder="ten_nguoi_dung"
                    class="w-full rounded-swiss-sm border border-swiss-300 pl-7 pr-3 py-2 text-xs font-bold text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label for="reg-fullname" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                  {regRole === 'student' ? 'Họ và tên sinh viên *' : 'Tên doanh nghiệp / Công ty *'}
                </label>
                <input
                  type="text"
                  id="reg-fullname"
                  bind:value={regFullName}
                  required
                  placeholder={regRole === 'student' ? 'Nguyễn Văn A' : 'Công ty Cổ phần Công nghệ ABC'}
                  class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-bold text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label for="reg-email" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                  {regRole === 'student' ? 'Email sinh viên *' : 'Email liên hệ công ty *'}
                </label>
                <input
                  type="email"
                  id="reg-email"
                  bind:value={regEmail}
                  required
                  placeholder="email@domain.com"
                  class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label for="reg-phone" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                  Số điện thoại / Hotline *
                </label>
                <input
                  type="tel"
                  id="reg-phone"
                  bind:value={regPhone}
                  required
                  placeholder="0912 345 678"
                  class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label for="reg-pass" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                  Mật khẩu đăng nhập *
                </label>
                <input
                  type="password"
                  id="reg-pass"
                  bind:value={regPassword}
                  required
                  placeholder="••••••••"
                  class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <!-- Student specifics -->
              {#if regRole === 'student'}
                <div>
                  <label for="reg-year" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                    Đối tượng sinh viên
                  </label>
                  <select
                    id="reg-year"
                    bind:value={regAcademicYear}
                    class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="Năm 1">Sinh viên Năm 1 (Part-time)</option>
                    <option value="Năm 2">Sinh viên Năm 2 (Part-time)</option>
                    <option value="Năm 3">Sinh viên Năm 3 (Thực tập)</option>
                    <option value="Năm 4">Sinh viên Năm 4 (Thực tập / Đồ án)</option>
                    <option value="Mới tốt nghiệp">Mới tốt nghiệp (Fresher)</option>
                  </select>
                </div>

                <div>
                  <label for="reg-university" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                    Trường Đại học / Cao đẳng (Bộ GD&ĐT)
                  </label>
                  <UniversitySelect
                    id="reg-university"
                    bind:value={regUniversity}
                    placeholder="Tìm hoặc chọn từ 327 trường ĐH / CĐ..."
                  />
                </div>

                <div>
                  <label for="reg-major" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                    Chuyên ngành
                  </label>
                  <input
                    type="text"
                    id="reg-major"
                    bind:value={regMajor}
                    placeholder="CNTT, Marketing, Quản trị..."
                    class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              {:else}
                <!-- Company specifics -->
                <div>
                  <label for="reg-industry" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                    Lĩnh vực hoạt động
                  </label>
                  <input
                    type="text"
                    id="reg-industry"
                    bind:value={regIndustry}
                    placeholder="CNTT, F&B, Marketing, Giáo dục..."
                    class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label for="reg-address" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                    Địa chỉ văn phòng / Trụ sở
                  </label>
                  <input
                    type="text"
                    id="reg-address"
                    bind:value={regAddress}
                    placeholder="Cầu Giấy, Hà Nội..."
                    class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label for="reg-website" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                    Website / Fanpage
                  </label>
                  <input
                    type="url"
                    id="reg-website"
                    bind:value={regWebsite}
                    placeholder="https://company.com"
                    class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              {/if}
            </div>

            <div class="pt-2 flex items-center justify-between border-t border-swiss-200">
              <button
                type="button"
                onclick={() => authModalTab.set('login')}
                class="font-mono text-xs text-swiss-600 hover:text-black"
              >
                Đã có tài khoản? Đăng nhập →
              </button>

              <button
                type="submit"
                class="rounded-swiss-sm bg-black px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 transition-colors"
              >
                Đăng ký tài khoản
              </button>
            </div>
          </form>

        <!-- ================= TAB: FORGOT PASSWORD ================= -->
        {:else if $authModalTab === 'forgot'}
          <div class="space-y-4">
            {#if !forgotSubmitted}
              <form onsubmit={handleForgotSubmit} class="space-y-4">
                <div class="rounded-swiss-sm border border-black bg-swiss-50 p-3.5">
                  <span class="font-mono text-xs font-black text-black block mb-1">
                    [ QUÊN MẬT KHẨU ]
                  </span>
                  <p class="font-mono text-[11px] text-swiss-600 leading-relaxed">
                    Vui lòng nhập Email hoặc Username tài khoản của bạn để nhận thông báo khôi phục.
                  </p>
                </div>

                <div>
                  <label for="forgot-email" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                    Email tài khoản đăng ký
                  </label>
                  <input
                    type="email"
                    id="forgot-email"
                    bind:value={forgotEmail}
                    required
                    placeholder="email@domain.com"
                    class="w-full rounded-swiss-sm border border-swiss-300 px-3.5 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div class="pt-2 flex items-center justify-between border-t border-swiss-200">
                  <button
                    type="button"
                    onclick={() => authModalTab.set('login')}
                    class="font-mono text-xs text-swiss-600 hover:text-black"
                  >
                    Quay lại Đăng nhập →
                  </button>

                  <button
                    type="submit"
                    class="rounded-swiss-sm bg-black px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 transition-colors"
                  >
                    Gửi yêu cầu
                  </button>
                </div>
              </form>
            {:else}
              <!-- Notice as requested: Feature currently not active -->
              <div class="rounded-swiss-sm border border-signal-crimson bg-red-50/50 p-5 space-y-3">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-black text-signal-crimson">[ TẠM THỜI KHÔNG HOẠT ĐỘNG ]</span>
                </div>
                <p class="font-mono text-xs text-swiss-800 leading-relaxed">
                  Tính năng khôi phục mật khẩu tự động qua Email tạm thời chưa hoạt động. Vui lòng liên hệ bộ phận hỗ trợ kỹ thuật qua email <strong>hotro@topsivi.vn</strong> hoặc hotline <strong>1900 6868</strong> để được hỗ trợ cấp lại mật khẩu.
                </p>
                <div class="pt-2">
                  <button
                    type="button"
                    onclick={() => { authModalTab.set('login'); forgotSubmitted = false; }}
                    class="rounded-swiss-sm bg-black px-4 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-neutral-800"
                  >
                    Quay lại trang Đăng nhập
                  </button>
                </div>
              </div>
            {/if}
          </div>

        <!-- ================= TAB: PROFILE & SETTINGS ================= -->
        {:else if $authModalTab === 'profile' && $currentUser}
          <div class="space-y-6">
            <!-- User Public Profile Link Banner -->
            <div class="rounded-swiss-sm border border-black bg-swiss-50 p-3.5 flex items-center justify-between">
              <div>
                <span class="font-mono text-[10px] uppercase font-bold text-swiss-500 block">
                  ĐƯỜNG DẪN TRANG CÁ NHÂN CÔNG KHAI:
                </span>
                <a
                  href={url(`/profile/@${$currentUser.username}`)}
                  class="font-mono text-xs font-black text-black hover:text-signal-emerald underline"
                >
                  /profile/@{$currentUser.username} →
                </a>
              </div>

              {#if $currentUser.role === 'company'}
                <button
                  type="button"
                  onclick={() => { closeAuthModal(); openPostJobModal(); }}
                  class="rounded-swiss-sm bg-black px-3 py-1.5 font-mono text-xs font-bold uppercase text-white hover:bg-neutral-800"
                >
                  + Đăng tin việc làm
                </button>
              {/if}
            </div>

            <!-- Avatar Management Block -->
            <div class="rounded-swiss-sm border border-black bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-swiss-sm border border-black bg-black flex items-center justify-center font-mono text-xl font-bold text-white shadow-xs">
                  {#if $currentUser.avatar}
                    <img src={$currentUser.avatar} alt={$currentUser.fullName} class="h-full w-full object-cover" />
                  {:else}
                    <span>{$currentUser.fullName.charAt(0)}</span>
                  {/if}
                </div>
                <div class="min-w-0">
                  <h4 class="font-mono text-xs font-bold uppercase text-black">
                    {$currentUser.role === 'company' ? 'Logo Doanh nghiệp' : 'Ảnh đại diện cá nhân'}
                  </h4>
                  <p class="font-mono text-[10px] text-swiss-500 mt-0.5">
                    {$currentUser.avatar ? 'Đã tải lên ảnh đại diện tùy chỉnh' : 'Đang sử dụng ký tự viết tắt mặc định'}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <label class="cursor-pointer rounded-swiss-sm bg-black px-3 py-1.5 font-mono text-xs font-bold uppercase text-white hover:bg-neutral-800 transition-colors">
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
                    class="rounded-swiss-sm border border-signal-crimson px-2.5 py-1.5 font-mono text-xs font-bold uppercase text-signal-crimson hover:bg-red-50 transition-colors"
                  >
                    Gỡ ảnh
                  </button>
                {/if}
              </div>
            </div>

            <!-- If Student: CV & Portfolio management -->
            {#if $currentUser.role === 'student'}
              <div class="rounded-swiss-sm border border-black bg-swiss-50 p-4 space-y-3">
                <div class="flex items-center justify-between border-b border-swiss-200 pb-2">
                  <span class="font-mono text-xs font-black text-black">FILE CV //</span>
                  {#if $currentUser.cvFile}
                    <span class="font-mono text-[9px] uppercase font-bold tracking-wider bg-black text-white px-2 py-0.5 rounded-swiss-sm">
                      ĐÃ LƯU TRONG DATABASE JSON
                    </span>
                  {/if}
                </div>

                {#if $currentUser.cvFile}
                  <div class="flex items-center justify-between rounded-swiss-sm bg-white p-3 border border-swiss-300">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="font-mono font-bold text-xs bg-black text-white px-2 py-1 rounded-swiss-sm shrink-0">
                        PDF
                      </span>
                      <div class="truncate">
                        <p class="font-mono text-xs font-bold text-black truncate">
                          {$currentUser.cvFile.name}
                        </p>
                        <p class="font-mono text-[10px] text-swiss-400">
                          {formatFileSize($currentUser.cvFile.size)} • {new Date($currentUser.cvFile.uploadedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                      {#if $currentUser.cvFile.dataUrl}
                        <a
                          href={$currentUser.cvFile.dataUrl}
                          download={$currentUser.cvFile.name}
                          class="rounded-swiss-sm border border-black bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-black hover:bg-swiss-100 transition-colors"
                        >
                          Tải về
                        </a>
                      {/if}
                      <button
                        type="button"
                        onclick={removeCVFile}
                        class="rounded-swiss-sm p-1 text-swiss-400 hover:text-signal-crimson transition-colors"
                        title="Gỡ file CV"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                {:else}
                  <label class="flex flex-col items-center justify-center p-4 bg-white rounded-swiss-sm border border-dashed border-swiss-400 hover:border-black cursor-pointer transition-colors">
                    <span class="font-mono text-xs font-bold uppercase text-black">Bấm để tải file CV lên (PDF, DOCX)</span>
                    <span class="font-mono text-[10px] text-swiss-400 mt-0.5">TỰ ĐỘNG ĐÍNH KÈM KHI ỨNG TUYỂN</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onchange={handleFileUpload}
                      class="sr-only"
                    />
                  </label>
                {/if}
              </div>
            {/if}

            <!-- Personal Info Form -->
            <form onsubmit={handleSaveProfile} class="space-y-3">
              <div class="flex items-center gap-2 border-b border-black pb-1">
                <span class="font-mono text-xs font-black text-black">EDIT //</span>
                <h3 class="text-xs font-black uppercase tracking-wider text-black">
                  Cập nhật thông tin {$currentUser.role === 'company' ? 'Doanh nghiệp' : 'Sinh viên'}
                </h3>
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label for="edit-fullname" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                    {$currentUser.role === 'company' ? 'Tên doanh nghiệp' : 'Họ và tên'}
                  </label>
                  <input
                    type="text"
                    id="edit-fullname"
                    bind:value={editFullName}
                    required
                    class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label for="edit-phone" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    id="edit-phone"
                    bind:value={editPhone}
                    required
                    class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                {#if $currentUser.role === 'student'}
                  <div>
                    <label for="edit-university" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                      Trường Đại học / Cao đẳng (Bộ GD&ĐT)
                    </label>
                    <UniversitySelect
                      id="edit-university"
                      bind:value={editUniversity}
                      placeholder="Tìm hoặc chọn từ 327 trường ĐH / CĐ..."
                    />
                  </div>

                  <div>
                    <label for="edit-year" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">Năm học</label>
                    <select
                      id="edit-year"
                      bind:value={editAcademicYear}
                      class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value="Năm 1">Năm 1</option>
                      <option value="Năm 2">Năm 2</option>
                      <option value="Năm 3">Năm 3</option>
                      <option value="Năm 4">Năm 4</option>
                      <option value="Mới tốt nghiệp">Mới tốt nghiệp</option>
                    </select>
                  </div>
                {:else}
                  <div>
                    <label for="edit-industry" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">Lĩnh vực hoạt động</label>
                    <input
                      type="text"
                      id="edit-industry"
                      bind:value={editIndustry}
                      class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label for="edit-address" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">Địa chỉ trụ sở</label>
                    <input
                      type="text"
                      id="edit-address"
                      bind:value={editAddress}
                      class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                {/if}
              </div>

              <div>
                <label for="edit-bio" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                  {$currentUser.role === 'company' ? 'Giới thiệu văn hóa công ty' : 'Giới thiệu bản thân'}
                </label>
                <textarea
                  id="edit-bio"
                  bind:value={editBio}
                  rows="2"
                  class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                ></textarea>
              </div>

              <div class="flex justify-end pt-1">
                <button
                  type="submit"
                  class="rounded-swiss-sm bg-black px-5 py-2 font-mono text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 transition-colors"
                >
                  Lưu cập nhật
                </button>
              </div>
            </form>

            <!-- Export Database JSON (Chỉ hiển thị cho tài khoản admin) -->
            {#if $currentUser?.username?.toLowerCase() === 'admin'}
              <div class="rounded-swiss-sm border border-black bg-swiss-50 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
                <span class="text-swiss-700">
                  DATABASE JSON: <strong>{$databaseStore.users.length} TÀI KHOẢN • {$databaseStore.jobs.length} BÀI ĐĂNG</strong>
                </span>

                <button
                  type="button"
                  onclick={exportDatabaseJSON}
                  class="rounded-swiss-sm border border-black bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase text-black hover:bg-swiss-100 transition-colors"
                >
                  Tải file Database JSON ↓
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
</Modal>
