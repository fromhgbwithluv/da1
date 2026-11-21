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
    openPostJobModal,
  } from "../stores/auth";
  import { showToast } from "../stores/toast";
  import { isValidVietnamesePhone } from "../utils/formatters";
  import type { UserRole } from "../types/user";
  import UniversitySelect from "./UniversitySelect.svelte";
  import Modal from "./Modal.svelte";
  import { url } from "../utils/url";

  // Login form state
  let loginIdentifier = $state("");
  let loginPassword = $state("");
  let showLoginPassword = $state(false);

  // Register form state
  let regRole = $state<UserRole>("student");
  let regFullName = $state("");
  let regEmail = $state("");
  let regUsername = $state("");
  let regPassword = $state("");
  let showRegPassword = $state(false);
  let regPhone = $state("");
  let regAvatar = $state("");
  // Student specifics
  let regUniversity = $state("");
  let regAcademicYear = $state("Năm 1");
  let regMajor = $state("");
  let regBio = $state("");
  // Company specifics
  let regIndustry = $state("Công nghệ thông tin / Phần mềm");
  let regAddress = $state("");
  let regWebsite = $state("");

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
  let forgotEmail = $state("");
  let forgotSubmitted = $state(false);

  // Profile edit state
  let editFullName = $state("");
  let editPhone = $state("");
  let editUniversity = $state("");
  let editAcademicYear = $state("");
  let editMajor = $state("");
  let editBio = $state("");
  let editPortfolioLink = $state("");
  let editIndustry = $state("");
  let editAddress = $state("");
  let editWebsite = $state("");

  // New project state
  let newProjectTitle = $state("");
  let newProjectDesc = $state("");
  let newProjectLink = $state("");
  let showAddProject = $state(false);

  // Sync edit state when user changes
  $effect(() => {
    if ($currentUser) {
      editFullName = $currentUser.fullName;
      editPhone = $currentUser.phone;
      editBio = $currentUser.bio || "";
      if ($currentUser.role === "student") {
        editUniversity = $currentUser.university || "";
        editAcademicYear = $currentUser.academicYear || "Năm 1";
        editMajor = $currentUser.major || "";
        editPortfolioLink = $currentUser.portfolioLink || "";
      } else {
        editIndustry = $currentUser.industry || "";
        editAddress = $currentUser.address || "";
        editWebsite = $currentUser.website || "";
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
    if (
      !regFullName.trim() ||
      !regEmail.trim() ||
      !regUsername.trim() ||
      !regPhone.trim()
    )
      return;

    if (!isValidVietnamesePhone(regPhone)) {
      showToast(
        "Số điện thoại không đúng định dạng di động Việt Nam (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)!",
        "remove",
      );
      return;
    }

    register({
      role: regRole,
      fullName: regFullName.trim(),
      email: regEmail.trim(),
      username: regUsername.trim(),
      password: regPassword || "123456",
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
    if (editPhone && !isValidVietnamesePhone(editPhone)) {
      showToast(
        "Số điện thoại không đúng định dạng di động Việt Nam (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)!",
        "remove",
      );
      return;
    }

    if ($currentUser?.role === "student") {
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
    newProjectTitle = "";
    newProjectDesc = "";
    newProjectLink = "";
    showAddProject = false;
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
</script>

<Modal
  isOpen={$isAuthModalOpen}
  onClose={closeAuthModal}
  hideHeader={true}
  maxWidth={$authModalTab === "login" || $authModalTab === "forgot"
    ? "lg"
    : "2xl"}
  dialogClass="rounded-3xl border-2 border-obsidian-900 bg-alabaster-50 shadow-[0_24px_60px_rgba(14,20,18,0.22)]"
  bodyClass="p-0"
  title={$authModalTab === "login"
    ? "Đăng nhập hệ thống"
    : $authModalTab === "register"
      ? "Đăng ký tài khoản mới"
      : $authModalTab === "forgot"
        ? "Khôi phục mật khẩu"
        : "Hồ sơ & Cài đặt tài khoản"}
  subtitle="Hệ thống tài khoản phân quyền: Sinh viên & Doanh nghiệp"
  ariaLabel="Hệ thống xác thực tài khoản"
>
  <!-- Custom Branded Header + Organic Pill Switcher -->
  <div
    class="relative overflow-hidden border-b border-obsidian-900/10 bg-alabaster-100/80 bg-organic-dots-light px-6 pt-5 pb-4"
  >
    <!-- Subtle ambient mint aura -->
    <div
      class="pointer-events-none absolute -top-14 right-6 h-36 w-36 rounded-full bg-mint/25 blur-2xl"
    ></div>

    <!-- Top Brand & Close Row -->
    <div class="relative z-10 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <img
          src={url("/favicon.svg")}
          alt="TopSiVi"
          class="h-8 w-auto object-contain"
        />
      </div>

      <button
        type="button"
        onclick={closeAuthModal}
        class="flex h-9 w-9 items-center justify-center rounded-full border border-obsidian-900/15 bg-alabaster-50 text-obsidian-800 transition-all duration-150 hover:border-obsidian-900 hover:bg-obsidian-900 hover:text-mint"
        aria-label="Đóng"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Title & Subtitle -->
    <div class="relative z-10 mt-3.5">
      <h2
        class="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-obsidian-900"
      >
        {#if $authModalTab === "login"}
          Đăng nhập hệ thống
        {:else if $authModalTab === "register"}
          Đăng ký tài khoản mới
        {:else if $authModalTab === "forgot"}
          Khôi phục mật khẩu
        {:else}
          Hồ sơ & Cài đặt tài khoản
        {/if}
      </h2>
      <p class="mt-1 text-xs sm:text-sm text-obsidian-600">
        {#if $authModalTab === "login"}
          Truy cập lộ trình việc làm hoặc quản lý tin tuyển dụng của bạn.
        {:else if $authModalTab === "register"}
          Chọn vai trò Sinh viên hoặc Doanh nghiệp để bắt đầu.
        {:else if $authModalTab === "forgot"}
          Nhập email đã đăng ký để gửi yêu cầu khôi phục mật khẩu.
        {:else}
          Cập nhật thông tin cá nhân, CV ứng tuyển và đường dẫn hồ sơ công khai.
        {/if}
      </p>
    </div>

    <!-- Organic Segmented Pill Tabs -->
    <div
      class="relative z-10 mt-4 flex flex-wrap items-center gap-1 rounded-full border border-obsidian-900/10 bg-alabaster-50 p-1 shadow-xs"
      role="tablist"
      aria-label="Chuyển chế độ tài khoản"
    >
      <button
        type="button"
        role="tab"
        aria-selected={$authModalTab === "login"}
        onclick={() => {
          authModalTab.set("login");
          forgotSubmitted = false;
        }}
        class="flex-1 sm:flex-none rounded-full px-4 py-1.5 text-xs transition-all duration-150
        {$authModalTab === 'login'
          ? 'bg-obsidian-900 text-mint font-bold shadow-xs'
          : 'text-obsidian-700 hover:text-obsidian-900 hover:bg-alabaster-100 font-semibold'}"
      >
        Đăng nhập
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={$authModalTab === "register"}
        onclick={() => authModalTab.set("register")}
        class="flex-1 sm:flex-none rounded-full px-4 py-1.5 text-xs transition-all duration-150
        {$authModalTab === 'register'
          ? 'bg-obsidian-900 text-mint font-bold shadow-xs'
          : 'text-obsidian-700 hover:text-obsidian-900 hover:bg-alabaster-100 font-semibold'}"
      >
        Đăng ký
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={$authModalTab === "forgot"}
        onclick={() => {
          authModalTab.set("forgot");
          forgotSubmitted = false;
        }}
        class="flex-1 sm:flex-none rounded-full px-4 py-1.5 text-xs transition-all duration-150
        {$authModalTab === 'forgot'
          ? 'bg-obsidian-900 text-mint font-bold shadow-xs'
          : 'text-obsidian-700 hover:text-obsidian-900 hover:bg-alabaster-100 font-semibold'}"
      >
        Quên mật khẩu
      </button>

      {#if $currentUser}
        <button
          type="button"
          role="tab"
          aria-selected={$authModalTab === "profile"}
          onclick={() => authModalTab.set("profile")}
          class="flex-1 sm:flex-none rounded-full px-4 py-1.5 text-xs transition-all duration-150
          {$authModalTab === 'profile'
            ? 'bg-obsidian-900 text-mint font-bold shadow-xs'
            : 'text-obsidian-700 hover:text-obsidian-900 hover:bg-alabaster-100 font-semibold'}"
        >
          Hồ sơ
        </button>
      {/if}
    </div>
  </div>

  <!-- Body Container -->
  <div class="p-6 max-h-[70vh] overflow-y-auto" data-lenis-prevent>
    <!-- ================= TAB: LOGIN ================= -->
    {#if $authModalTab === "login"}
      <form onsubmit={handleLoginSubmit} class="space-y-4">
        <div>
          <label
            for="login-id"
            class="block text-xs font-semibold text-obsidian-800 mb-1.5"
          >
            Tên đăng nhập (@username) hoặc Email <span
              class="text-signal-crimson">*</span
            >
          </label>
          <input
            type="text"
            id="login-id"
            bind:value={loginIdentifier}
            required
            placeholder="Ví dụ: @an.nguyen hoặc an.nguyen@student.edu.vn"
            class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
          />
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label
              for="login-pass"
              class="block text-xs font-semibold text-obsidian-800"
            >
              Mật khẩu <span class="text-signal-crimson">*</span>
            </label>
            <button
              type="button"
              onclick={() => {
                authModalTab.set("forgot");
                forgotSubmitted = false;
              }}
              class="text-xs font-semibold text-obsidian-700 underline decoration-mint decoration-2 underline-offset-4 hover:text-obsidian-900 transition-colors"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div class="relative">
            <input
              type={showLoginPassword ? "text" : "password"}
              id="login-pass"
              bind:value={loginPassword}
              required
              placeholder="••••••••"
              class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 pl-3.5 pr-10 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
            />
            <button
              type="button"
              onclick={() => (showLoginPassword = !showLoginPassword)}
              class="absolute inset-y-0 right-0 flex items-center px-3 text-swiss-500 hover:text-obsidian-900 transition-colors"
              aria-label={showLoginPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {#if showLoginPassword}
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              {:else}
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              {/if}
            </button>
          </div>
        </div>

        <div
          class="pt-4 mt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-obsidian-900/10"
        >
          <button
            type="button"
            onclick={() => authModalTab.set("register")}
            class="text-xs sm:text-sm text-obsidian-600 text-left"
          >
            Chưa có tài khoản?
            <span
              class="font-bold text-obsidian-900 underline decoration-mint decoration-2 underline-offset-4 hover:text-obsidian-700 ml-1"
            >
              Đăng ký ngay →
            </span>
          </button>

          <button
            type="submit"
            class="group inline-flex items-center justify-center gap-2.5 rounded-full bg-obsidian-900 px-6 py-3 font-display text-sm font-bold text-alabaster-50 transition-all duration-200 hover:bg-obsidian-800 hover:shadow-mint-glow"
          >
            <span>Đăng nhập</span>
            <span
              class="flex h-5 w-5 items-center justify-center rounded-full bg-mint text-obsidian-900 font-mono text-xs font-black transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </button>
        </div>
      </form>

      <!-- ================= TAB: REGISTER (ROLE SELECTION) ================= -->
    {:else if $authModalTab === "register"}
      <form onsubmit={handleRegisterSubmit} class="space-y-5">
        <!-- 2 Options: Sinh viên vs Doanh nghiệp -->
        <div>
          <span class="block text-xs font-semibold text-obsidian-800 mb-2">
            Chọn vai trò tài khoản <span class="text-signal-crimson">*</span>
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              class="cursor-pointer rounded-2xl p-3.5 transition-all duration-200 flex items-start gap-3
              {regRole === 'student'
                ? 'border-2 border-obsidian-900 bg-mint/25 shadow-xs'
                : 'border border-obsidian-900/15 bg-alabaster-100/60 hover:border-obsidian-900/40 hover:bg-alabaster-100'}"
            >
              <input
                type="radio"
                name="role"
                value="student"
                bind:group={regRole}
                class="sr-only"
              />
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors
                {regRole === 'student'
                  ? 'bg-obsidian-900 text-mint'
                  : 'bg-alabaster-50 border border-obsidian-900/15 text-obsidian-700'}"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="font-display text-sm font-extrabold text-obsidian-900"
                  >
                    Sinh viên / Ứng viên
                  </span>
                  {#if regRole === "student"}
                    <span
                      class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-obsidian-900 text-mint text-[10px] font-black"
                    >
                      ✓
                    </span>
                  {/if}
                </div>
                <span
                  class="text-xs text-obsidian-700 mt-0.5 block leading-snug"
                >
                  Tìm việc dự án, part-time, thực tập, fresher & đính kèm CV
                </span>
              </div>
            </label>

            <label
              class="cursor-pointer rounded-2xl p-3.5 transition-all duration-200 flex items-start gap-3
              {regRole === 'company'
                ? 'border-2 border-obsidian-900 bg-mint/25 shadow-xs'
                : 'border border-obsidian-900/15 bg-alabaster-100/60 hover:border-obsidian-900/40 hover:bg-alabaster-100'}"
            >
              <input
                type="radio"
                name="role"
                value="company"
                bind:group={regRole}
                class="sr-only"
              />
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors
                {regRole === 'company'
                  ? 'bg-obsidian-900 text-mint'
                  : 'bg-alabaster-50 border border-obsidian-900/15 text-obsidian-700'}"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="font-display text-sm font-extrabold text-obsidian-900"
                  >
                    Doanh nghiệp / NTD
                  </span>
                  {#if regRole === "company"}
                    <span
                      class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-obsidian-900 text-mint text-[10px] font-black"
                    >
                      ✓
                    </span>
                  {/if}
                </div>
                <span
                  class="text-xs text-obsidian-700 mt-0.5 block leading-snug"
                >
                  Đăng bài tuyển dụng
                </span>
              </div>
            </label>
          </div>
        </div>

        <!-- Avatar Upload Option -->
        <div
          class="rounded-2xl border border-dashed border-obsidian-900/20 bg-alabaster-100/50 p-3.5 flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-obsidian-900/20 bg-alabaster-50 flex items-center justify-center text-obsidian-700 shadow-xs"
            >
              {#if regAvatar}
                <img
                  src={regAvatar}
                  alt="Xem trước avatar"
                  class="h-full w-full object-cover"
                />
              {:else if regRole === "student"}
                <svg
                  class="h-5 w-5 text-swiss-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              {:else}
                <svg
                  class="h-5 w-5 text-swiss-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
                  />
                </svg>
              {/if}
            </div>
            <div class="min-w-0">
              <span class="block text-xs font-bold text-obsidian-900 truncate">
                {regRole === "student"
                  ? "Ảnh đại diện sinh viên"
                  : "Logo / Ảnh doanh nghiệp"}
              </span>
              <span class="block font-mono text-[11px] text-swiss-500">
                PNG, JPG, WEBP (Tự động tối ưu hoá)
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <label
              class="cursor-pointer rounded-full border border-obsidian-900/20 bg-alabaster-50 px-3.5 py-1.5 text-xs font-bold text-obsidian-900 hover:border-obsidian-900 hover:bg-mint/25 transition-all"
            >
              <span>{regAvatar ? "Đổi ảnh" : "Tải ảnh lên"}</span>
              <input
                type="file"
                accept="image/*"
                onchange={handleRegAvatarUpload}
                class="sr-only"
              />
            </label>
            {#if regAvatar}
              <button
                type="button"
                onclick={() => (regAvatar = "")}
                class="rounded-full border border-signal-crimson/30 bg-alabaster-50 px-3 py-1.5 text-xs font-bold text-signal-crimson hover:bg-red-50 transition-colors"
              >
                Gỡ
              </button>
            {/if}
          </div>
        </div>

        <!-- Common Fields -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              for="reg-username"
              class="block text-xs font-semibold text-obsidian-800 mb-1.5"
            >
              Tên định danh Username <span
                class="font-mono text-[10px] text-swiss-500 font-normal"
                >(/profile/@username)</span
              > <span class="text-signal-crimson">*</span>
            </label>
            <div class="relative">
              <span
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-xs font-bold text-swiss-500"
                >@</span
              >
              <input
                type="text"
                id="reg-username"
                bind:value={regUsername}
                required
                placeholder="ten_nguoi_dung"
                class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 pl-8 pr-3.5 py-2.5 text-sm font-semibold text-obsidian-900 placeholder:text-swiss-400 placeholder:font-normal transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
              />
            </div>
          </div>

          <div>
            <label
              for="reg-fullname"
              class="block text-xs font-semibold text-obsidian-800 mb-1.5"
            >
              {regRole === "student"
                ? "Họ và tên sinh viên"
                : "Tên doanh nghiệp / Công ty"}
              <span class="text-signal-crimson">*</span>
            </label>
            <input
              type="text"
              id="reg-fullname"
              bind:value={regFullName}
              required
              placeholder={regRole === "student"
                ? "Nguyễn Văn A"
                : "Công ty Cổ phần Công nghệ ABC"}
              class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm font-semibold text-obsidian-900 placeholder:text-swiss-400 placeholder:font-normal transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
            />
          </div>

          <div>
            <label
              for="reg-email"
              class="block text-xs font-semibold text-obsidian-800 mb-1.5"
            >
              {regRole === "student"
                ? "Email sinh viên"
                : "Email liên hệ công ty"}
              <span class="text-signal-crimson">*</span>
            </label>
            <input
              type="email"
              id="reg-email"
              bind:value={regEmail}
              required
              placeholder="email@domain.com"
              class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
            />
          </div>

          <div>
            <label
              for="reg-phone"
              class="block text-xs font-semibold text-obsidian-800 mb-1.5"
            >
              Số điện thoại / Hotline <span class="font-normal text-swiss-500"
                >(10 số)</span
              > <span class="text-signal-crimson">*</span>
            </label>
            <input
              type="tel"
              id="reg-phone"
              bind:value={regPhone}
              required
              maxlength="12"
              placeholder="0912 345 678"
              class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
            />
          </div>

          <div>
            <label
              for="reg-pass"
              class="block text-xs font-semibold text-obsidian-800 mb-1.5"
            >
              Mật khẩu đăng nhập <span class="text-signal-crimson">*</span>
            </label>
            <div class="relative">
              <input
                type={showRegPassword ? "text" : "password"}
                id="reg-pass"
                bind:value={regPassword}
                required
                placeholder="••••••••"
                class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 pl-3.5 pr-10 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
              />
              <button
                type="button"
                onclick={() => (showRegPassword = !showRegPassword)}
                class="absolute inset-y-0 right-0 flex items-center px-3 text-swiss-500 hover:text-obsidian-900 transition-colors"
                aria-label={showRegPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {#if showRegPassword}
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                {:else}
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                {/if}
              </button>
            </div>
          </div>

          <!-- Student specifics -->
          {#if regRole === "student"}
            <div>
              <label
                for="reg-year"
                class="block text-xs font-semibold text-obsidian-800 mb-1.5"
              >
                Đối tượng sinh viên
              </label>
              <select
                id="reg-year"
                bind:value={regAcademicYear}
                class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm font-medium text-obsidian-900 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
              >
                <option value="Năm 1">Sinh viên Năm 1 (Part-time)</option>
                <option value="Năm 2">Sinh viên Năm 2 (Part-time)</option>
                <option value="Năm 3">Sinh viên Năm 3 (Thực tập)</option>
                <option value="Năm 4">Sinh viên Năm 4 (Thực tập / Đồ án)</option
                >
                <option value="Mới tốt nghiệp">Mới tốt nghiệp (Fresher)</option>
              </select>
            </div>

            <div>
              <label
                for="reg-university"
                class="block text-xs font-semibold text-obsidian-800 mb-1.5"
              >
                Trường Đại học / Cao đẳng <span
                  class="font-normal text-swiss-500">(Bộ GD&ĐT)</span
                >
              </label>
              <UniversitySelect
                id="reg-university"
                label=""
                bind:value={regUniversity}
                placeholder="Tìm hoặc chọn từ 327 trường ĐH / CĐ..."
                triggerClass="rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 hover:border-obsidian-900"
              />
            </div>

            <div>
              <label
                for="reg-major"
                class="block text-xs font-semibold text-obsidian-800 mb-1.5"
              >
                Chuyên ngành
              </label>
              <input
                type="text"
                id="reg-major"
                bind:value={regMajor}
                placeholder="CNTT, Marketing, Quản trị..."
                class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
              />
            </div>
          {:else}
            <!-- Company specifics -->
            <div>
              <label
                for="reg-industry"
                class="block text-xs font-semibold text-obsidian-800 mb-1.5"
              >
                Lĩnh vực hoạt động
              </label>
              <input
                type="text"
                id="reg-industry"
                bind:value={regIndustry}
                placeholder="CNTT, F&B, Marketing, Giáo dục..."
                class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
              />
            </div>

            <div>
              <label
                for="reg-address"
                class="block text-xs font-semibold text-obsidian-800 mb-1.5"
              >
                Địa chỉ văn phòng / Trụ sở
              </label>
              <input
                type="text"
                id="reg-address"
                bind:value={regAddress}
                placeholder="Cầu Giấy, Hà Nội..."
                class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
              />
            </div>

            <div>
              <label
                for="reg-website"
                class="block text-xs font-semibold text-obsidian-800 mb-1.5"
              >
                Website / Fanpage
              </label>
              <input
                type="url"
                id="reg-website"
                bind:value={regWebsite}
                placeholder="https://company.com"
                class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
              />
            </div>
          {/if}
        </div>

        <div
          class="pt-4 mt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-obsidian-900/10"
        >
          <button
            type="button"
            onclick={() => authModalTab.set("login")}
            class="text-xs sm:text-sm text-obsidian-600 text-left"
          >
            Đã có tài khoản?
            <span
              class="font-bold text-obsidian-900 underline decoration-mint decoration-2 underline-offset-4 hover:text-obsidian-700 ml-1"
            >
              Đăng nhập →
            </span>
          </button>

          <button
            type="submit"
            class="group inline-flex items-center justify-center gap-2.5 rounded-full bg-obsidian-900 px-6 py-3 font-display text-sm font-bold text-alabaster-50 transition-all duration-200 hover:bg-obsidian-800 hover:shadow-mint-glow"
          >
            <span>Đăng ký tài khoản</span>
            <span
              class="flex h-5 w-5 items-center justify-center rounded-full bg-mint text-obsidian-900 font-mono text-xs font-black transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </button>
        </div>
      </form>

      <!-- ================= TAB: FORGOT PASSWORD ================= -->
    {:else if $authModalTab === "forgot"}
      <div class="space-y-4">
        {#if !forgotSubmitted}
          <form onsubmit={handleForgotSubmit} class="space-y-4">
            <div
              class="rounded-2xl border border-obsidian-900/15 bg-mint/15 p-4 flex items-start gap-3"
            >
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-obsidian-900 text-mint"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <div>
                <span
                  class="font-display text-sm font-extrabold text-obsidian-900 block"
                >
                  Khôi phục quyền truy cập
                </span>
                <p class="text-xs text-obsidian-700 leading-relaxed mt-0.5">
                  Vui lòng nhập Email hoặc Username tài khoản của bạn để gửi yêu
                  cầu hỗ trợ khôi phục mật khẩu.
                </p>
              </div>
            </div>

            <div>
              <label
                for="forgot-email"
                class="block text-xs font-semibold text-obsidian-800 mb-1.5"
              >
                Email tài khoản đăng ký <span class="text-signal-crimson"
                  >*</span
                >
              </label>
              <input
                type="email"
                id="forgot-email"
                bind:value={forgotEmail}
                required
                placeholder="email@domain.com"
                class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
              />
            </div>

            <div
              class="pt-4 mt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-obsidian-900/10"
            >
              <button
                type="button"
                onclick={() => authModalTab.set("login")}
                class="text-xs sm:text-sm font-bold text-obsidian-800 underline decoration-mint decoration-2 underline-offset-4 hover:text-obsidian-900 text-left"
              >
                ← Quay lại đăng nhập
              </button>

              <button
                type="submit"
                class="group inline-flex items-center justify-center gap-2.5 rounded-full bg-obsidian-900 px-6 py-3 font-display text-sm font-bold text-alabaster-50 transition-all duration-200 hover:bg-obsidian-800 hover:shadow-mint-glow"
              >
                <span>Gửi yêu cầu</span>
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-mint text-obsidian-900 font-mono text-xs font-black transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </button>
            </div>
          </form>
        {:else}
          <!-- Notice: Feature currently not active -->
          <div
            class="rounded-2xl border border-signal-crimson/30 bg-red-50/70 p-5 space-y-3"
          >
            <div class="flex items-center gap-2.5">
              <span
                class="inline-flex items-center rounded-full bg-signal-crimson px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-alabaster-50"
              >
                Thông báo
              </span>
              <span
                class="font-display text-sm font-extrabold text-signal-crimson"
              >
                Tính năng tạm thời chưa hoạt động
              </span>
            </div>
            <p class="text-xs sm:text-sm text-obsidian-800 leading-relaxed">
              Tính năng khôi phục mật khẩu tự động qua Email tạm thời chưa hoạt
              động. Vui lòng liên hệ bộ phận hỗ trợ kỹ thuật qua email
              <strong class="font-semibold text-obsidian-900"
                >admin@wherejourneybegins.web.id</strong
              >
              hoặc hotline
              <strong class="font-semibold text-obsidian-900">1900 6868</strong>
              để được hỗ trợ cấp lại mật khẩu.
            </p>
            <div class="pt-2">
              <button
                type="button"
                onclick={() => {
                  authModalTab.set("login");
                  forgotSubmitted = false;
                }}
                class="inline-flex items-center gap-2 rounded-full bg-obsidian-900 px-5 py-2.5 font-display text-xs font-bold text-mint hover:bg-obsidian-800 transition-colors"
              >
                ← Quay lại trang Đăng nhập
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- ================= TAB: PROFILE & SETTINGS ================= -->
    {:else if $authModalTab === "profile" && $currentUser}
      <div class="space-y-5">
        <!-- User Public Profile Link Banner -->
        <div
          class="rounded-2xl border border-obsidian-900/15 bg-mint/20 p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <span
              class="font-mono text-[10px] uppercase font-bold tracking-wider text-obsidian-700 block"
            >
              Đường dẫn trang cá nhân công khai
            </span>
            <a
              href={url(`/profile/@${$currentUser.username}`)}
              class="font-mono text-xs sm:text-sm font-extrabold text-obsidian-900 underline decoration-obsidian-900/40 underline-offset-4 hover:text-obsidian-700"
            >
              /profile/@{$currentUser.username} →
            </a>
          </div>

          {#if $currentUser.role === "company"}
            <button
              type="button"
              onclick={() => {
                closeAuthModal();
                openPostJobModal();
              }}
              class="rounded-full bg-obsidian-900 px-4 py-2 font-display text-xs font-bold text-mint hover:bg-obsidian-800 transition-colors"
            >
              + Đăng tin việc làm
            </button>
          {/if}
        </div>

        <!-- Avatar Management Block -->
        <div
          class="rounded-2xl border border-obsidian-900/15 bg-alabaster-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div
              class="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-obsidian-900/20 bg-obsidian-900 flex items-center justify-center font-display text-xl font-bold text-mint shadow-xs"
            >
              {#if $currentUser.avatar}
                <img
                  src={$currentUser.avatar}
                  alt={$currentUser.fullName}
                  class="h-full w-full object-cover"
                />
              {:else}
                <span>{$currentUser.fullName.charAt(0)}</span>
              {/if}
            </div>
            <div class="min-w-0">
              <h4 class="font-display text-sm font-extrabold text-obsidian-900">
                {$currentUser.role === "company"
                  ? "Logo Doanh nghiệp"
                  : "Ảnh đại diện cá nhân"}
              </h4>
              <p class="text-xs text-swiss-500 mt-0.5">
                {$currentUser.avatar
                  ? "Đã tải lên ảnh đại diện tùy chỉnh"
                  : "Đang sử dụng ký tự viết tắt mặc định"}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <label
              class="cursor-pointer rounded-full bg-obsidian-900 px-4 py-2 text-xs font-bold text-mint hover:bg-obsidian-800 transition-colors"
            >
              <span
                >{$currentUser.avatar
                  ? "Đổi ảnh đại diện"
                  : "Tải avatar mới"}</span
              >
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

        <!-- If Student: CV management -->
        {#if $currentUser.role === "student"}
          <div
            class="rounded-2xl border border-obsidian-900/15 bg-alabaster-100/60 p-4 space-y-3"
          >
            <div
              class="flex items-center justify-between border-b border-obsidian-900/10 pb-2.5"
            >
              <span
                class="font-display text-xs font-extrabold uppercase tracking-wider text-obsidian-900"
              >
                Hồ sơ CV đính kèm
              </span>
              {#if $currentUser.cvFile}
                <span
                  class="font-mono text-[10px] uppercase font-bold tracking-wider bg-obsidian-900 text-mint px-2.5 py-0.5 rounded-full"
                >
                  Đã lưu trên hệ thống
                </span>
              {/if}
            </div>

            {#if $currentUser.cvFile}
              <div
                class="flex items-center justify-between rounded-xl bg-alabaster-50 p-3 border border-obsidian-900/15"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <span
                    class="font-mono font-bold text-xs bg-obsidian-900 text-mint px-2.5 py-1 rounded-lg shrink-0"
                  >
                    PDF
                  </span>
                  <div class="truncate">
                    <p class="text-xs font-bold text-obsidian-900 truncate">
                      {$currentUser.cvFile.name}
                    </p>
                    <p class="font-mono text-[10px] text-swiss-500">
                      {formatFileSize($currentUser.cvFile.size)} • {new Date(
                        $currentUser.cvFile.uploadedAt,
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  {#if $currentUser.cvFile.dataUrl}
                    <a
                      href={$currentUser.cvFile.dataUrl}
                      download={$currentUser.cvFile.name}
                      class="rounded-full border border-obsidian-900/20 bg-alabaster-50 px-3 py-1 text-[11px] font-bold text-obsidian-900 hover:border-obsidian-900 hover:bg-mint/25 transition-colors"
                    >
                      Tải về
                    </a>
                  {/if}
                  <button
                    type="button"
                    onclick={removeCVFile}
                    class="rounded-full p-1.5 text-swiss-500 hover:text-signal-crimson hover:bg-red-50 transition-colors"
                    title="Gỡ file CV"
                  >
                    <svg
                      class="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            {:else}
              <label
                class="flex flex-col items-center justify-center p-5 bg-alabaster-50 rounded-xl border border-dashed border-obsidian-900/25 hover:border-obsidian-900 hover:bg-mint/10 cursor-pointer transition-all"
              >
                <span class="text-xs font-bold text-obsidian-900"
                  >Bấm để tải file CV lên (PDF, DOCX)</span
                >
                <span class="font-mono text-[10px] text-swiss-500 mt-1"
                  >Tự động đính kèm khi ứng tuyển</span
                >
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
        <form onsubmit={handleSaveProfile} class="space-y-4">
          <div
            class="flex items-center gap-2 border-b border-obsidian-900/10 pb-2"
          >
            <span class="h-2 w-2 rounded-full bg-mint-500"></span>
            <h3 class="font-display text-sm font-extrabold text-obsidian-900">
              Cập nhật thông tin {$currentUser.role === "company"
                ? "Doanh nghiệp"
                : "Sinh viên"}
            </h3>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                for="edit-fullname"
                class="block text-xs font-semibold text-obsidian-800 mb-1.5"
              >
                {$currentUser.role === "company"
                  ? "Tên doanh nghiệp"
                  : "Họ và tên"}
              </label>
              <input
                type="text"
                id="edit-fullname"
                bind:value={editFullName}
                required
                class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
              />
            </div>

            <div>
              <label
                for="edit-phone"
                class="block text-xs font-semibold text-obsidian-800 mb-1.5"
              >
                Số điện thoại
              </label>
              <input
                type="tel"
                id="edit-phone"
                bind:value={editPhone}
                required
                class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
              />
            </div>

            {#if $currentUser.role === "student"}
              <div>
                <label
                  for="edit-university"
                  class="block text-xs font-semibold text-obsidian-800 mb-1.5"
                >
                  Trường Đại học / Cao đẳng <span
                    class="font-normal text-swiss-500">(Bộ GD&ĐT)</span
                  >
                </label>
                <UniversitySelect
                  id="edit-university"
                  label=""
                  bind:value={editUniversity}
                  placeholder="Tìm hoặc chọn từ 327 trường ĐH / CĐ..."
                  triggerClass="rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 hover:border-obsidian-900"
                />
              </div>

              <div>
                <label
                  for="edit-year"
                  class="block text-xs font-semibold text-obsidian-800 mb-1.5"
                >
                  Năm học
                </label>
                <select
                  id="edit-year"
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
            {:else}
              <div>
                <label
                  for="edit-industry"
                  class="block text-xs font-semibold text-obsidian-800 mb-1.5"
                >
                  Lĩnh vực hoạt động
                </label>
                <input
                  type="text"
                  id="edit-industry"
                  bind:value={editIndustry}
                  class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                />
              </div>

              <div>
                <label
                  for="edit-address"
                  class="block text-xs font-semibold text-obsidian-800 mb-1.5"
                >
                  Địa chỉ trụ sở
                </label>
                <input
                  type="text"
                  id="edit-address"
                  bind:value={editAddress}
                  class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
                />
              </div>
            {/if}
          </div>

          <div>
            <label
              for="edit-bio"
              class="block text-xs font-semibold text-obsidian-800 mb-1.5"
            >
              {$currentUser.role === "company"
                ? "Giới thiệu văn hóa công ty"
                : "Giới thiệu bản thân"}
            </label>
            <textarea
              id="edit-bio"
              bind:value={editBio}
              rows="2"
              class="w-full rounded-xl border border-obsidian-900/20 bg-alabaster-100/60 px-3.5 py-2.5 text-sm text-obsidian-900 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
            ></textarea>
          </div>

          <div class="flex justify-end pt-2 border-t border-obsidian-900/10">
            <button
              type="submit"
              class="rounded-full bg-obsidian-900 px-6 py-2.5 font-display text-xs font-bold text-mint hover:bg-obsidian-800 hover:shadow-mint-glow transition-all"
            >
              Lưu cập nhật
            </button>
          </div>
        </form>

        <!-- Export Database JSON (Chỉ hiển thị cho tài khoản admin) -->
        {#if $currentUser?.username?.toLowerCase() === "admin"}
          <div
            class="rounded-2xl border border-obsidian-900/15 bg-alabaster-100/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs"
          >
            <span class="text-obsidian-700">
              DATABASE JSON: <strong class="text-obsidian-900"
                >{$databaseStore.users.length} TÀI KHOẢN • {$databaseStore.jobs
                  .length} BÀI ĐĂNG</strong
              >
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
    {/if}
  </div>
</Modal>
