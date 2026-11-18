<script lang="ts">
  import { onMount } from 'svelte';
  import { openPostJobModal, openAuthModal, currentUser } from '../stores/auth';
  import { url } from '../utils/url';

  let trackEl: HTMLElement | undefined = $state();
  let targetProgress = $state(0);
  let smoothProgress = $state(0);

  // Determine active stage: 0 = Thực trạng, 1 = Suy nghĩ, 2 = Sản phẩm
  let activeStage = $derived(
    smoothProgress < 0.34 ? 0 : smoothProgress < 0.67 ? 1 : 2
  );

  // Per-stage progress from -1 (before active) to 0 (centered) to +1 (after active, swept left)
  function getStageOffset(stageIndex: number, progress: number): number {
    const centers = [0.16, 0.50, 0.84];
    const center = centers[stageIndex];
    const raw = (progress - center) / 0.34;
    return Math.max(-1.5, Math.min(1.5, raw));
  }

  let stage0Offset = $derived(getStageOffset(0, smoothProgress));
  let stage1Offset = $derived(getStageOffset(1, smoothProgress));
  let stage2Offset = $derived(getStageOffset(2, smoothProgress));

  function getStageOpacity(offset: number): number {
    const abs = Math.abs(offset);
    if (abs <= 0.38) return 1;
    if (abs >= 0.95) return 0;
    return 1 - (abs - 0.38) / (0.95 - 0.38);
  }

  // Orbital transform following "chiều scroll" (counter-clockwise arc from right to left)
  function getOrbitalStyle(offset: number, depth = 1): string {
    // offset < 0: stage is entering from the right side of the arc
    // offset > 0: stage is sweeping counter-clockwise toward the left side of the arc
    const translateX = -offset * 260 * depth;
    const translateY = Math.pow(offset, 2) * 95 * depth;
    const rotate = -offset * 14 * depth;
    const scale = 1 - Math.min(0.18, Math.abs(offset) * 0.14);
    return `transform: translate3d(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px, 0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)});`;
  }

  function scrollToStage(stageIndex: number) {
    if (!trackEl) return;
    const centers = [0.14, 0.50, 0.86];
    const rect = trackEl.getBoundingClientRect();
    const trackTop = window.scrollY + rect.top;
    const scrollableDistance = trackEl.offsetHeight - window.innerHeight;
    const targetScrollY = trackTop + scrollableDistance * centers[stageIndex];
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  }

  function handleRecruitClick() {
    if ($currentUser) {
      openPostJobModal();
    } else {
      openAuthModal('login');
    }
  }

  onMount(() => {
    let rafId: number;

    const updateScroll = () => {
      if (trackEl) {
        const rect = trackEl.getBoundingClientRect();
        const scrollable = Math.max(1, trackEl.offsetHeight - window.innerHeight);
        const scrolled = -rect.top;
        targetProgress = Math.max(0, Math.min(1, scrolled / scrollable));
      }
    };

    const tick = () => {
      const diff = targetProgress - smoothProgress;
      if (Math.abs(diff) > 0.0005) {
        smoothProgress += diff * 0.14;
      } else {
        smoothProgress = targetProgress;
      }
      rafId = requestAnimationFrame(tick);
    };

    updateScroll();
    smoothProgress = targetProgress;
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      cancelAnimationFrame(rafId);
    };
  });

  const stageMeta = [
    {
      index: 0,
      code: '01',
      title: 'Thực trạng',
      subtitle: 'Thông tin rải rác, đòi hỏi kinh nghiệm vô lý & rủi ro bẫy cọc',
    },
    {
      index: 1,
      code: '02',
      title: 'Suy nghĩ',
      subtitle: 'Điểm chạm giữa nhu cầu Sinh viên và bài toán nhân sự Thị trường',
    },
    {
      index: 2,
      code: '03',
      title: 'Sản phẩm',
      subtitle: 'Hệ sinh thái việc làm phân tầng & dịch vụ hỗ trợ toàn diện TopSiVi',
    },
  ];
</script>

<!-- STICKY PARALLAX SCROLL TRACK (Begins right below the Hero wave and stays sticky until finished) -->
<section
  id="cau-chuyen-topsivi"
  bind:this={trackEl}
  class="relative w-full bg-obsidian-900 text-alabaster-50 select-none"
  style="height: 440vh;"
>
  <!-- Sticky Viewport Container -->
  <div class="sticky top-0 h-screen w-full overflow-hidden bg-obsidian-900 bg-organic-grid-dark flex flex-col justify-between">
    <!-- Parallax Ambient Background Glows -->
    <div
      class="pointer-events-none absolute inset-0 transition-transform duration-75"
      style="transform: translate3d({(0.5 - smoothProgress) * 120}px, {(0.5 - smoothProgress) * 40}px, 0);"
    >
      <div class="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-mint/10 blur-[110px]"></div>
      <div class="absolute bottom-16 right-1/4 h-80 w-80 rounded-full bg-mint/8 blur-[90px]"></div>
    </div>

    <!-- Top Stage Progress Bar & Navigation -->
    <div class="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between px-4 pt-20 sm:px-6 lg:px-8">
      <div class="flex items-center gap-2 sm:gap-3 bg-obsidian-800/90 border border-obsidian-600/80 backdrop-blur-md px-3 py-1.5 rounded-full">
        {#each stageMeta as stage}
          <button
            type="button"
            onclick={() => scrollToStage(stage.index)}
            class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all duration-200 {activeStage === stage.index
              ? 'bg-mint text-obsidian-900 shadow-mint-glow'
              : 'text-alabaster-300 hover:text-alabaster-50'}"
          >
            <span class="font-mono text-[10px] opacity-75">{stage.code}.</span>
            <span>{stage.title}</span>
          </button>
        {/each}
      </div>

      <!-- Scroll Progress Indicator & Direction Hint -->
      <div class="hidden sm:flex items-center gap-3 rounded-full border border-obsidian-600/80 bg-obsidian-800/80 px-4 py-1.5 backdrop-blur-md">
        <span class="font-mono text-[11px] text-alabaster-300">Chiều cuộn quỹ đạo</span>
        <div class="h-1.5 w-24 overflow-hidden rounded-full bg-obsidian-700">
          <div
            class="h-full rounded-full bg-mint transition-all duration-75"
            style="width: {(smoothProgress * 100).toFixed(1)}%;"
          ></div>
        </div>
        <span class="font-mono text-xs font-bold text-mint">{Math.round(smoothProgress * 100)}%</span>
      </div>
    </div>

    <!-- MAIN ORBITAL CONSTELLATION STAGE -->
    <div class="relative z-20 mx-auto my-auto h-[540px] sm:h-[600px] w-full max-w-6xl px-4">
      <!-- Outer Orbital Guide Arc ("chiều scroll" from Sketch 2) -->
      <svg
        class="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1000 560"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="scroll-arc-grad" x1="100%" y1="100%" x2="0%" y2="50%">
            <stop offset="0%" stop-color="#70ffaf" stop-opacity="0.12" />
            <stop offset="50%" stop-color="#70ffaf" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#70ffaf" stop-opacity="0.75" />
          </linearGradient>
        </defs>

        <!-- Curved Orbital Arrow Path matching "chiều scroll" in Sketch 2 -->
        <path
          d="M 915 470 C 900 135, 690 42, 480 48 C 295 54, 185 155, 130 280"
          fill="none"
          stroke="url(#scroll-arc-grad)"
          stroke-width="2"
          stroke-dasharray="6 8"
        />
        <!-- Arrowhead at the left end of the scroll arc (pointing down-left like Sketch 2) -->
        <path
          d="M 122 252 L 128 284 L 158 270"
          fill="none"
          stroke="#70ffaf"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-opacity="0.75"
        />
        <!-- Label "chiều scroll" on the top-right of the arc -->
        <text
          x="775"
          y="96"
          fill="#70ffaf"
          fill-opacity="0.7"
          font-family="JetBrains Mono, monospace"
          font-size="13"
          font-weight="600"
        >
          ↺ chiều scroll
        </text>
      </svg>

      <!-- ========================================================= -->
      <!-- ACT 1: THỰC TRẠNG (Matches Sketch 2)                      -->
      <!-- ========================================================= -->
      <div
        class="absolute inset-0 transition-opacity duration-150"
        style="opacity: {getStageOpacity(stage0Offset)}; pointer-events: {Math.abs(stage0Offset) < 0.45 ? 'auto' : 'none'}; {getOrbitalStyle(stage0Offset, 1)}"
      >
        <!-- Dashed Constellation Lines for Stage 1 -->
        <svg class="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 560" preserveAspectRatio="none">
          <!-- IT viec -> Yêu cầu kn -->
          <line x1="115" y1="335" x2="185" y2="435" stroke="#70ffaf" stroke-opacity="0.55" stroke-width="2" class="constellation-line" />
          <!-- Yêu cầu kn -> career viet -->
          <line x1="255" y1="435" x2="465" y2="345" stroke="#70ffaf" stroke-opacity="0.55" stroke-width="2" class="constellation-line" />
          <!-- career viet -> top CV -->
          <line x1="485" y1="345" x2="755" y2="265" stroke="#70ffaf" stroke-opacity="0.55" stroke-width="2" class="constellation-line" />
          <!-- Bài FB -> Linked In -->
          <line x1="330" y1="265" x2="395" y2="195" stroke="#70ffaf" stroke-opacity="0.65" stroke-width="2" class="constellation-line" />
          <!-- Linked In -> Bài threads -->
          <line x1="415" y1="195" x2="575" y2="225" stroke="#70ffaf" stroke-opacity="0.65" stroke-width="2" class="constellation-line" />
          <!-- Bài FB -> Bài threads -->
          <line x1="350" y1="305" x2="575" y2="235" stroke="#70ffaf" stroke-opacity="0.65" stroke-width="2" class="constellation-line" />
          <!-- Bài threads -> rải rác? -->
          <line x1="635" y1="245" x2="745" y2="365" stroke="#70ffaf" stroke-opacity="0.65" stroke-width="2" class="constellation-line" />
        </svg>

        <!-- Node: IT viec -->
        <div
          class="absolute left-[6%] top-[53%] sm:left-[8%] sm:top-[54%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage0Offset, 0.35)}
        >
          <div class="rounded-2xl border-2 border-alabaster-200/80 bg-obsidian-800/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
            <span class="font-display text-xs sm:text-sm font-extrabold text-alabaster-50 block leading-tight">IT</span>
            <span class="font-mono text-[11px] text-alabaster-300 block leading-tight">viec</span>
          </div>
        </div>

        <!-- Node: Yêu cầu kn -->
        <div
          class="absolute left-[21%] top-[77%] sm:left-[21%] sm:top-[76%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage0Offset, 0.5)}
        >
          <div class="rounded-2xl border-2 border-mint/70 bg-obsidian-800/95 px-4 py-3 shadow-mint-glow backdrop-blur-md max-w-[200px]">
            <span class="font-display text-xs sm:text-sm font-extrabold text-mint block">Yêu cầu kn</span>
            <span class="text-[11px] text-alabaster-300 leading-snug block mt-0.5">Đòi hỏi 1–2 năm kinh nghiệm cho vị trí mới ra trường</span>
          </div>
        </div>

        <!-- Node: Bài FB (Large square box as in Sketch 2) -->
        <div
          class="absolute left-[31%] top-[53%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage0Offset, 0.25)}
        >
          <div class="flex flex-col justify-between rounded-3xl border-2 border-alabaster-100 bg-obsidian-800/95 p-4 sm:p-5 w-32 sm:w-40 shadow-xl">
            <span class="font-mono text-[10px] uppercase tracking-wider text-mint">Mạng xã hội</span>
            <div class="my-2">
              <span class="font-display text-lg sm:text-2xl font-black text-alabaster-50 block leading-tight">Bài</span>
              <span class="font-display text-xl sm:text-3xl font-black text-mint block leading-tight">FB</span>
            </div>
            <span class="text-[11px] text-alabaster-300 leading-tight">Tin trôi nổi, rủi ro thu cọc</span>
          </div>
        </div>

        <!-- Node: Linked In -->
        <div
          class="absolute left-[40%] top-[33%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage0Offset, 0.45)}
        >
          <div class="rounded-2xl border-2 border-alabaster-200/80 bg-obsidian-800/95 px-3.5 py-2.5 shadow-lg">
            <span class="font-display text-xs sm:text-sm font-extrabold text-alabaster-50 block leading-tight">Linked</span>
            <span class="font-mono text-[11px] text-mint font-bold block leading-tight">In</span>
          </div>
        </div>

        <!-- Node: career viet -->
        <div
          class="absolute left-[47%] top-[61%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage0Offset, 0.3)}
        >
          <div class="rounded-2xl border-2 border-alabaster-200/80 bg-obsidian-800/95 px-3.5 py-2.5 shadow-lg text-center">
            <span class="font-display text-xs sm:text-sm font-bold text-alabaster-50 block leading-tight">career</span>
            <span class="font-mono text-[11px] text-alabaster-300 block leading-tight">viet</span>
          </div>
        </div>

        <!-- Node: Bài threads (Large square box as in Sketch 2) -->
        <div
          class="absolute left-[60%] top-[40%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage0Offset, 0.35)}
        >
          <div class="flex flex-col justify-between rounded-3xl border-2 border-alabaster-100 bg-obsidian-800/95 p-4 sm:p-5 w-36 sm:w-44 shadow-xl">
            <span class="font-mono text-[10px] uppercase tracking-wider text-mint">Truyền miệng</span>
            <div class="my-1.5">
              <span class="font-display text-lg sm:text-2xl font-black text-alabaster-50 block leading-tight">Bài</span>
              <span class="font-display text-lg sm:text-2xl font-black text-mint block leading-tight">threads</span>
            </div>
            <span class="text-[11px] text-alabaster-300 leading-tight">Thiếu xác thực pháp lý</span>
          </div>
        </div>

        <!-- Node: top CV -->
        <div
          class="absolute left-[76%] top-[46%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage0Offset, 0.5)}
        >
          <div class="rounded-2xl border-2 border-alabaster-200/80 bg-obsidian-800/95 px-3.5 py-2.5 shadow-lg text-center">
            <span class="font-display text-xs sm:text-sm font-extrabold text-alabaster-50 block leading-tight">top</span>
            <span class="font-mono text-xs font-bold text-mint block leading-tight">CV</span>
          </div>
        </div>

        <!-- Node: rải rác? -->
        <div
          class="absolute left-[76%] top-[66%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage0Offset, 0.4)}
        >
          <div class="rounded-2xl border-2 border-mint bg-obsidian-800/95 px-5 py-3 shadow-mint-glow">
            <span class="font-display text-sm sm:text-lg font-extrabold text-mint block">rải rác?</span>
            <span class="text-[11px] text-alabaster-200 block">Phân mảnh khắp 10+ nền tảng</span>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- ACT 2: SUY NGHĨ (Matches Sketch 3)                        -->
      <!-- ========================================================= -->
      <div
        class="absolute inset-0 transition-opacity duration-150"
        style="opacity: {getStageOpacity(stage1Offset)}; pointer-events: {Math.abs(stage1Offset) < 0.45 ? 'auto' : 'none'}; {getOrbitalStyle(stage1Offset, 1)}"
      >
        <!-- Dashed Constellation Lines for Stage 2 -->
        <svg class="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 560" preserveAspectRatio="none">
          <!-- Cluster 1: Sinh viên cần gì? (230,190) -> Dấu mộc thực tập (415,115) & Thời gian linh hoạt (120,295) -->
          <line x1="280" y1="180" x2="400" y2="120" stroke="#70ffaf" stroke-opacity="0.65" stroke-width="2" class="constellation-line" />
          <line x1="205" y1="205" x2="130" y2="285" stroke="#70ffaf" stroke-opacity="0.65" stroke-width="2" class="constellation-line" />

          <!-- Cluster 2: Thị trường cần gì? (355,345) -> Nhiều nhân lực (200,420) & Nhân lực chất lượng (555,385) -->
          <line x1="310" y1="355" x2="215" y2="415" stroke="#70ffaf" stroke-opacity="0.65" stroke-width="2" class="constellation-line" />
          <line x1="420" y1="350" x2="540" y2="380" stroke="#70ffaf" stroke-opacity="0.65" stroke-width="2" class="constellation-line" />

          <!-- Cluster 3: Sinh viên có gì? (665,280) -> Thời gian rảnh (730,155) & Kiến thức (780,355) -->
          <line x1="680" y1="260" x2="725" y2="165" stroke="#70ffaf" stroke-opacity="0.65" stroke-width="2" class="constellation-line" />
          <line x1="705" y1="295" x2="770" y2="345" stroke="#70ffaf" stroke-opacity="0.65" stroke-width="2" class="constellation-line" />
        </svg>

        <!-- Cluster 1: Sinh viên cần gì? -->
        <div
          class="absolute left-[23%] top-[33%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage1Offset, 0.25)}
        >
          <div class="rounded-2xl border-2 border-mint bg-obsidian-800 px-4 py-3 shadow-mint-glow">
            <span class="font-display text-xs sm:text-base font-extrabold text-mint">Sinh viên cần gì?</span>
          </div>
        </div>

        <div
          class="absolute left-[42%] top-[20%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage1Offset, 0.45)}
        >
          <div class="rounded-2xl border-2 border-alabaster-100 bg-obsidian-800/95 px-3.5 py-2.5 shadow-lg">
            <span class="font-display text-xs sm:text-sm font-bold text-alabaster-50 block">Dấu mộc</span>
            <span class="font-display text-xs sm:text-sm font-bold text-mint block">thực tập</span>
          </div>
        </div>

        <div
          class="absolute left-[12%] top-[52%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage1Offset, 0.4)}
        >
          <div class="rounded-2xl border-2 border-alabaster-100 bg-obsidian-800/95 px-3.5 py-2.5 shadow-lg">
            <span class="font-display text-xs sm:text-sm font-bold text-alabaster-50 block">Thời gian</span>
            <span class="font-display text-xs sm:text-sm font-bold text-mint block">linh hoạt</span>
          </div>
        </div>

        <!-- Cluster 2: Thị trường cần gì? -->
        <div
          class="absolute left-[36%] top-[61%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage1Offset, 0.3)}
        >
          <div class="rounded-2xl border-2 border-mint bg-obsidian-800 px-4 py-3 shadow-mint-glow">
            <span class="font-display text-xs sm:text-base font-extrabold text-mint">Thị trường cần gì?</span>
          </div>
        </div>

        <div
          class="absolute left-[20%] top-[75%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage1Offset, 0.5)}
        >
          <div class="rounded-2xl border-2 border-alabaster-100 bg-obsidian-800/95 px-3.5 py-2.5 shadow-lg">
            <span class="font-display text-xs sm:text-sm font-bold text-alabaster-50">Nhiều nhân lực</span>
          </div>
        </div>

        <div
          class="absolute left-[56%] top-[68%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage1Offset, 0.45)}
        >
          <div class="rounded-2xl border-2 border-alabaster-100 bg-obsidian-800/95 px-3.5 py-2.5 shadow-lg">
            <span class="font-display text-xs sm:text-sm font-bold text-alabaster-50 block">Nhân lực</span>
            <span class="font-display text-xs sm:text-sm font-bold text-mint block">chất lượng</span>
          </div>
        </div>

        <!-- Cluster 3: Sinh viên có gì? -->
        <div
          class="absolute left-[66%] top-[49%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage1Offset, 0.25)}
        >
          <div class="rounded-2xl border-2 border-mint bg-obsidian-800 px-4 py-3 shadow-mint-glow">
            <span class="font-display text-xs sm:text-base font-extrabold text-mint">Sinh viên có gì?</span>
          </div>
        </div>

        <div
          class="absolute left-[73%] top-[28%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage1Offset, 0.45)}
        >
          <div class="rounded-2xl border-2 border-alabaster-100 bg-obsidian-800/95 px-4 py-3 shadow-lg">
            <span class="font-display text-xs sm:text-sm font-bold text-alabaster-50">Thời gian rảnh</span>
          </div>
        </div>

        <div
          class="absolute left-[78%] top-[63%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage1Offset, 0.4)}
        >
          <div class="rounded-2xl border-2 border-alabaster-100 bg-obsidian-800/95 px-4 py-2.5 shadow-lg">
            <span class="font-display text-xs sm:text-sm font-bold text-mint">Kiến thức</span>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- ACT 3: SẢN PHẨM (Matches Sketch 4)                        -->
      <!-- ========================================================= -->
      <div
        class="absolute inset-0 transition-opacity duration-150"
        style="opacity: {getStageOpacity(stage2Offset)}; pointer-events: {Math.abs(stage2Offset) < 0.45 ? 'auto' : 'none'}; {getOrbitalStyle(stage2Offset, 1)}"
      >
        <!-- Dashed Constellation Lines for Stage 3 -->
        <svg class="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 560" preserveAspectRatio="none">
          <!-- Screenshot web 1 (250, 285) -> Screenshot web 2 (635, 175) -> Screenshot web 3 (755, 360) -->
          <line x1="335" y1="265" x2="550" y2="185" stroke="#70ffaf" stroke-opacity="0.7" stroke-width="2.5" class="constellation-line" />
          <line x1="690" y1="215" x2="745" y2="320" stroke="#70ffaf" stroke-opacity="0.7" stroke-width="2.5" class="constellation-line" />

          <!-- Dịch vụ hỗ trợ circle (140, 415) -> Tư vấn CV (95, 330) & Phỏng vấn thử (265, 375) -->
          <line x1="125" y1="385" x2="98" y2="340" stroke="#70ffaf" stroke-opacity="0.65" stroke-width="2" class="constellation-line" />
          <line x1="175" y1="405" x2="245" y2="380" stroke="#70ffaf" stroke-opacity="0.65" stroke-width="2" class="constellation-line" />
        </svg>

        <!-- Node: Quảng cáo doanh nghiệp (Top-left rounded card) -->
        <div
          class="absolute left-[25%] top-[24%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage2Offset, 0.4)}
        >
          <a
            href={url('/services')}
            class="block rounded-3xl border-2 border-alabaster-100 bg-obsidian-800/95 px-4 py-3.5 shadow-xl hover:border-mint transition-colors"
          >
            <span class="font-mono text-[10px] uppercase text-mint block">B2B Branding</span>
            <span class="font-display text-xs sm:text-sm font-extrabold text-alabaster-50 block">Quảng cáo</span>
            <span class="font-display text-xs sm:text-sm font-extrabold text-alabaster-50 block">doanh nghiệp</span>
          </a>
        </div>

        <!-- Node: Screenshot web 1 (Left-center) -->
        <div
          class="absolute left-[25%] top-[50%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage2Offset, 0.25)}
        >
          <a
            href={url('/jobs')}
            class="group block w-40 sm:w-48 rounded-2xl border-2 border-mint/80 bg-obsidian-800/95 p-3 shadow-mint-glow hover:scale-105 transition-transform"
          >
            <div class="flex items-center justify-between border-b border-obsidian-600 pb-1.5 mb-2">
              <div class="flex items-center gap-1">
                <span class="h-2 w-2 rounded-full bg-mint"></span>
                <span class="h-2 w-2 rounded-full bg-obsidian-600"></span>
              </div>
              <span class="font-mono text-[9px] text-mint">topsivi.vn/jobs</span>
            </div>
            <p class="font-display text-xs sm:text-sm font-extrabold text-alabaster-50">Screenshot web</p>
            <p class="text-[11px] text-alabaster-300 mt-0.5">Phân tầng Năm 1–2, Năm 3–4 & Fresher</p>
          </a>
        </div>

        <!-- Node: Center Logo TopSiVi (Square emblem in the center as in Sketch 4) -->
        <div
          class="absolute left-[48%] top-[55%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage2Offset, 0.15)}
        >
          <div class="flex flex-col items-center justify-center rounded-2xl border-2 border-mint bg-obsidian-900 px-4 py-3 shadow-mint-glow-lg pulse-mint">
            <svg class="h-7 w-12" viewBox="0 0 88 44" fill="none">
              <path d="M4 6H38V14H25V38H16V14H4V6Z" fill="#70ffaf" />
              <path d="M45 12C36 12 31 16.5 31 22C31 27.5 37 29.8 43.5 31.5C48.5 32.8 51 34.2 51 37C51 39.8 47.5 41.5 42 41.5C36.5 41.5 32.5 39 31 35.5L24 39.5C27 44.5 33.5 44 42 44C52.5 44 59.5 39 59.5 32C59.5 26 53.5 23 46 21C40.5 19.5 39 18.2 39 16.5C39 14.5 41.5 13.5 45 13.5C48.5 13.5 51.5 15 53.5 17.5L59.5 13C56 10.5 51 12 45 12Z" fill="#f8faf7" />
              <path d="M50 6L62 36L74 6H83L66 42H58L41 6H50Z" fill="#70ffaf" />
            </svg>
            <span class="font-display text-xs font-black text-mint mt-1">logo Topsivi</span>
          </div>
        </div>

        <!-- Node: Screenshot web 2 (Top-right) -->
        <div
          class="absolute left-[63%] top-[31%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage2Offset, 0.35)}
        >
          <a
            href={url('/jobs')}
            class="group block w-40 sm:w-48 rounded-2xl border-2 border-mint/80 bg-obsidian-800/95 p-3 shadow-mint-glow hover:scale-105 transition-transform"
          >
            <div class="flex items-center justify-between border-b border-obsidian-600 pb-1.5 mb-2">
              <div class="flex items-center gap-1">
                <span class="h-2 w-2 rounded-full bg-mint"></span>
                <span class="h-2 w-2 rounded-full bg-obsidian-600"></span>
              </div>
              <span class="font-mono text-[9px] text-mint">Giỏ hồ sơ 1-click</span>
            </div>
            <p class="font-display text-xs sm:text-sm font-extrabold text-alabaster-50">Screenshot web</p>
            <p class="text-[11px] text-alabaster-300 mt-0.5">Ghim việc & Ứng tuyển đồng loạt 0đ cọc</p>
          </a>
        </div>

        <!-- Node: Screenshot web 3 (Bottom-right) -->
        <div
          class="absolute left-[75%] top-[64%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage2Offset, 0.45)}
        >
          <a
            href={url('/profile/@nguyenvanan')}
            class="group block w-40 sm:w-48 rounded-2xl border-2 border-mint/80 bg-obsidian-800/95 p-3 shadow-mint-glow hover:scale-105 transition-transform"
          >
            <div class="flex items-center justify-between border-b border-obsidian-600 pb-1.5 mb-2">
              <div class="flex items-center gap-1">
                <span class="h-2 w-2 rounded-full bg-mint"></span>
                <span class="h-2 w-2 rounded-full bg-obsidian-600"></span>
              </div>
              <span class="font-mono text-[9px] text-mint">Hồ sơ & Lịch rảnh</span>
            </div>
            <p class="font-display text-xs sm:text-sm font-extrabold text-alabaster-50">Screenshot web</p>
            <p class="text-[11px] text-alabaster-300 mt-0.5">CV sinh viên & Lịch rảnh When2Meet</p>
          </a>
        </div>

        <!-- Bottom-Left Cluster: Dịch vụ hỗ trợ (Circle) + Tư vấn CV + Phỏng vấn thử -->
        <div
          class="absolute left-[9%] top-[59%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage2Offset, 0.35)}
        >
          <a
            href={url('/services')}
            class="block rounded-xl border border-mint/70 bg-obsidian-800 px-3 py-1.5 text-center hover:bg-mint hover:text-obsidian-900 transition-colors"
          >
            <span class="font-display text-xs font-extrabold">Tư vấn CV</span>
          </a>
        </div>

        <div
          class="absolute left-[27%] top-[67%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage2Offset, 0.4)}
        >
          <a
            href={url('/services')}
            class="block rounded-xl border border-mint/70 bg-obsidian-800 px-3 py-1.5 text-center hover:bg-mint hover:text-obsidian-900 transition-colors"
          >
            <span class="font-display text-xs font-extrabold">Phỏng vấn thử</span>
          </a>
        </div>

        <div
          class="absolute left-[14%] top-[75%] -translate-x-1/2 -translate-y-1/2"
          style={getOrbitalStyle(stage2Offset, 0.25)}
        >
          <a
            href={url('/services')}
            class="flex h-24 w-24 sm:h-28 sm:w-28 flex-col items-center justify-center rounded-full border-2 border-mint bg-obsidian-800 p-2 text-center shadow-mint-glow hover:bg-mint hover:text-obsidian-900 transition-all"
          >
            <span class="font-display text-xs sm:text-sm font-black leading-tight">Dịch vụ</span>
            <span class="font-display text-xs sm:text-sm font-black leading-tight">hỗ trợ</span>
          </a>
        </div>
      </div>
    </div>

    <!-- BOTTOM CENTER HEMISPHERE / DOME ("Thực trạng" -> "Suy nghĩ" -> "Sản phẩm" matching Sketches 2, 3, 4) -->
    <div class="relative z-30 mx-auto flex w-full flex-col items-center justify-end">
      <div class="relative flex h-36 w-[300px] sm:h-44 sm:w-[400px] flex-col items-center justify-center rounded-t-full border-t-2 border-x-2 border-mint bg-obsidian-800/95 px-6 pt-5 text-center shadow-[0_-15px_50px_rgba(112,255,175,0.18)]">
        <!-- Rotating Orbital Ring inside the Dome -->
        <div
          class="pointer-events-none absolute -inset-3 rounded-t-full border border-dashed border-mint/35"
          style="transform: rotate({(-smoothProgress * 180).toFixed(1)}deg); transform-origin: bottom center;"
        ></div>

        <span class="font-mono text-[10px] font-bold uppercase tracking-widest text-mint mb-1">
          GIAI ĐOẠN 0{activeStage + 1} / 03
        </span>

        <!-- Stage Title inside the Hemisphere -->
        <h2 class="font-display text-2xl sm:text-4xl font-black tracking-tight text-alabaster-50">
          {stageMeta[activeStage].title}
        </h2>

        <p class="mt-1.5 max-w-[260px] text-[11px] sm:text-xs text-alabaster-300 leading-snug">
          {stageMeta[activeStage].subtitle}
        </p>
      </div>
    </div>
  </div>
</section>

<!-- =============================================================== -->
<!-- FINAL CALL TO ACTION SECTION (Matches Sketch 5 before Footer)   -->
<!-- =============================================================== -->
<section class="relative border-t border-obsidian-700 bg-obsidian-900 py-20 sm:py-28 text-alabaster-50 overflow-hidden">
  <div class="pointer-events-none absolute inset-0 bg-organic-dots-dark opacity-40"></div>
  <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-[500px] rounded-full bg-mint/10 blur-3xl"></div>

  <div class="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
    <p class="font-mono text-xs font-bold uppercase tracking-widest text-mint mb-3">
      SẴN SÀNG BẮT ĐẦU CÙNG TOPSIVI
    </p>
    <h2 class="font-display text-2xl sm:text-4xl font-extrabold text-alabaster-50 tracking-tight mb-10">
      Kết nối sinh viên tài năng & doanh nghiệp minh bạch
    </h2>

    <!-- Dual Action Buttons matching Sketch 5 ("Tìm việc ngay" & "Đăng tuyển ngay") -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
      <a
        href={url('/jobs')}
        class="group relative inline-flex min-w-[220px] items-center justify-center gap-3 rounded-2xl border-2 border-mint bg-mint px-8 py-4 font-display text-base sm:text-lg font-extrabold text-obsidian-900 shadow-mint-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-mint-400"
      >
        <span>Tìm việc ngay</span>
        <span class="transition-transform duration-200 group-hover:translate-x-1">→</span>
      </a>

      <button
        type="button"
        onclick={handleRecruitClick}
        class="group relative inline-flex min-w-[220px] items-center justify-center gap-3 rounded-2xl border-2 border-alabaster-100 bg-obsidian-800 px-8 py-4 font-display text-base sm:text-lg font-extrabold text-alabaster-50 transition-all duration-200 hover:-translate-y-0.5 hover:border-mint hover:text-mint"
      >
        <span>Đăng tuyển ngay</span>
        <span class="transition-transform duration-200 group-hover:translate-x-1">→</span>
      </button>
    </div>
  </div>
</section>
