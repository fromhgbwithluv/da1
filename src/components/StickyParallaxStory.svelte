<script lang="ts">
  import { onMount } from "svelte";
  import { openPostJobModal, openAuthModal, currentUser } from "../stores/auth";
  import { url } from "../utils/url";
  import {
    initSmoothScroll,
    getLenis,
    gsap,
    ScrollTrigger,
  } from "../utils/smoothScroll";

  interface OrbitNode {
    id: string;
    stage: 0 | 1 | 2;
    kind:
      | "post"
      | "screenshot"
      | "hub"
      | "badge"
      | "problem"
      | "leaf"
      | "logo"
      | "circle";
    title: string;
    sub?: string;
    tag?: string;
    link?: string;
    image?: string; // Direct image replacement (e.g. real Facebook post image)
    logo?: string; // White rounded frame with brand logo inside, title below
    baseAngle: number; // Base polar angle in degrees (0 = right horizon, 90 = top zenith, 180 = left horizon)
    radiusRatio: number; // Multiplier on baseRadius (0.44 - 1.02 for wide radial separation)
    postSnippet?: string;
    postSource?: string;
  }

  const ALL_NODES: OrbitNode[] = [
    // =========================================================
    // GIAI ĐOẠN 1: THỰC TRẠNG (Base angles: +145° down to -56°)
    // =========================================================
    {
      id: "s1-itviec",
      stage: 0,
      kind: "badge",
      title: "ITviec",
      logo: "/images/logos/itviec.png",
      baseAngle: 130,
      radiusRatio: 0.75,
    },
    {
      id: "s1-req-exp",
      stage: 0,
      kind: "problem",
      title: "Nền tảng truyền thống",
      sub: "Khó tiếp cận với nhiều sinh viên",
      baseAngle: 120,
      radiusRatio: 0.48,
    },
    {
      id: "s1-post-1",
      stage: 0,
      kind: "post",
      title: "Việc làm parttime sinh viên TPHCM",
      sub: "Facebook Group",
      image: "/images/posts/fb-post-1.jpg", // Replaced with user's real screenshot
      baseAngle: 80,
      radiusRatio: 0.9, // Outer track
    },
    {
      id: "s1-career",
      stage: 0,
      kind: "badge",
      title: "CareerViet",
      logo: "/images/logos/careerviet.png",
      baseAngle: 105,
      radiusRatio: 0.7, // Inner track
    },
    {
      id: "s1-post-2",
      stage: 0,
      kind: "post",
      title: "Bài tuyển dụng #2",
      sub: "Threads Post",
      image: "/images/posts/threads-post-1.png",
      baseAngle: 45,
      radiusRatio: 0.9, // Outer track
    },
    {
      id: "s1-topcv",
      stage: 0,
      kind: "badge",
      title: "TopCV",
      logo: "/images/logos/topcv.png",
      baseAngle: 150,
      radiusRatio: 0.7,
    },
    {
      id: "s1-scattered",
      stage: 0,
      kind: "problem",
      title: "Rải rác?",
      sub: "Thông tin phân mảnh khắp các kênh",
      baseAngle: 40,
      radiusRatio: 0.5,
    },
    // Extended Part 1B
    {
      id: "s1-post-3",
      stage: 0,
      kind: "post",
      title: "Bài tuyển dụng #3",
      sub: "Sàn tuyển dụng đại trà",
      image: "/images/posts/ig-post-1.png",
      baseAngle: 10,
      radiusRatio: 0.9, // Outer track
    },
    {
      id: "s1-jd-vague",
      stage: 0,
      kind: "problem",
      title: "Thông tin mập mờ?",
      sub: "Mô tả chung chung, giấu mức lương thực",
      baseAngle: -20,
      radiusRatio: 0.55, // Inner track
    },
    {
      id: "s1-trap-deposit",
      stage: 0,
      kind: "problem",
      title: "Thu cọc / Đa cấp?",
      sub: "Đòi giữ CCCD gốc và đóng phí đào tạo",
      baseAngle: -25,
      radiusRatio: 0.9, // Inner track
    },
    {
      id: "s1-clash-time",
      stage: 0,
      kind: "problem",
      title: "Thiếu linh hoạt?",
      sub: "Ca làm khó thay đổi theo lịch học",
      baseAngle: -56,
      radiusRatio: 0.82,
    },

    // =========================================================
    // GIAI ĐOẠN 2: SUY NGHĨ (Base angles: -70° down to -214°)
    // =========================================================

    // Cụm: Thị trường cần gì?
    {
      id: "s2-mkt-need",
      stage: 1,
      kind: "hub",
      title: "Thị trường cần gì?",
      baseAngle: -110,
      radiusRatio: 0.75,
    },
    {
      id: "s2-mass-workforce",
      stage: 1,
      kind: "leaf",
      title: "Nhiều nhân lực",
      sub: "Đặc biệt với các vị trí thời vụ",
      baseAngle: -115,
      radiusRatio: 0.5,
    },
    {
      id: "s2-qual-workforce",
      stage: 1,
      kind: "leaf",
      title: "Nhân lực chất lượng",
      sub: "Có nền tảng & thái độ tốt",
      baseAngle: -122,
      radiusRatio: 0.9,
    },

    // Cụm 3: Sinh viên có gì?
    {
      id: "s2-sv-have",
      stage: 1,
      kind: "hub",
      title: "Sinh viên có gì?",
      baseAngle: -150,
      radiusRatio: 0.75,
    },
    {
      id: "s2-free-time",
      stage: 1,
      kind: "leaf",
      title: "Thời gian rảnh",
      sub: "Ngoài giờ lên giảng đường",
      baseAngle: -145,
      radiusRatio: 0.5,
    },
    {
      id: "s2-knowledge",
      stage: 1,
      kind: "leaf",
      title: "Kiến thức",
      sub: "Nền tảng trường đại học",
      baseAngle: -137,
      radiusRatio: 0.9,
    },

    // Cụm 5: Làm sao kết nối?
    {
      id: "s2-solution",
      stage: 1,
      kind: "hub",
      title: "Làm sao kết nối?",
      baseAngle: -180,
      radiusRatio: 0.7,
    },
    {
      id: "s2-tier-split",
      stage: 1,
      kind: "leaf",
      title: "Phân nhóm theo năm học",
      sub: "Năm 1-2, Năm 3-4, Ra trường",
      baseAngle: -185,
      radiusRatio: 0.9,
    },
    {
      id: "s2-verify-2way",
      stage: 1,
      kind: "leaf",
      title: "Xác thực hai bên",
      sub: "Công việc thật & năng lực thật",
      baseAngle: -200,
      radiusRatio: 0.5,
    },
    {
      id: "s2-single-hub",
      stage: 1,
      kind: "leaf",
      title: "Khung lộ trình phát triển thực tế",
      sub: "Từ dự án, part-time, thực tập đến chính thức",
      baseAngle: -210,
      radiusRatio: 0.8,
    },

    // =========================================================
    // GIAI ĐOẠN 3: SẢN PHẨM (Base angles: -226° down to -358°)
    // =========================================================
    {
      id: "s3-b2b-ads",
      stage: 2,
      kind: "badge",
      title: "Quảng cáo doanh nghiệp",
      sub: "B2B Branding & Tuyển chọn",
      link: "/services",
      baseAngle: -226,
      radiusRatio: 0.82,
    },
    {
      id: "s3-screen-1",
      stage: 2,
      kind: "screenshot",
      title: "Screenshot web #1",
      sub: "topsivi.vn/jobs",
      tag: "Phân tầng 3 nhóm SV",
      link: "/jobs",
      baseAngle: -240,
      radiusRatio: 0.98,
    },
    {
      id: "s3-cv-consult",
      stage: 2,
      kind: "leaf",
      title: "Tư vấn CV",
      sub: "Chuẩn hóa ATS 1-1",
      link: "/services",
      baseAngle: -248,
      radiusRatio: 0.46,
    },
    {
      id: "s3-services-circle",
      stage: 2,
      kind: "circle",
      title: "Dịch vụ hỗ trợ",
      sub: "Mentor & CV",
      link: "/services",
      baseAngle: -260,
      radiusRatio: 0.72,
    },
    {
      id: "s3-mock-interview",
      stage: 2,
      kind: "leaf",
      title: "Phỏng vấn thử",
      sub: "Tập dượt cùng chuyên gia HR",
      link: "/services",
      baseAngle: -272,
      radiusRatio: 0.46,
    },
    {
      id: "s3-logo",
      stage: 2,
      kind: "logo",
      title: "logo Topsivi",
      sub: "Nền tảng việc làm phân tầng",
      baseAngle: -282,
      radiusRatio: 0.64,
    },
    {
      id: "s3-screen-2",
      stage: 2,
      kind: "screenshot",
      title: "Screenshot web #2",
      sub: "topsivi.vn/cart",
      tag: "Giỏ hồ sơ 1-click",
      link: "/jobs",
      baseAngle: -296,
      radiusRatio: 1.0,
    },
    {
      id: "s3-screen-3",
      stage: 2,
      kind: "screenshot",
      title: "Screenshot web #3",
      sub: "topsivi.vn/services",
      tag: "Gói CV & Phỏng vấn",
      link: "/services",
      baseAngle: -314,
      radiusRatio: 0.98,
    },
    {
      id: "s3-trust-hub",
      stage: 2,
      kind: "hub",
      title: "100% Minh bạch",
      baseAngle: -326,
      radiusRatio: 0.7,
    },
    {
      id: "s3-no-deposit",
      stage: 2,
      kind: "leaf",
      title: "Cam kết 0đ cọc",
      sub: "Không thu phí sinh viên",
      baseAngle: -336,
      radiusRatio: 0.44,
    },
    {
      id: "s3-legal-verify",
      stage: 2,
      kind: "leaf",
      title: "Xác minh MST",
      sub: "Pháp lý doanh nghiệp rõ ràng",
      baseAngle: -342,
      radiusRatio: 1.02,
    },
    {
      id: "s3-screen-4",
      stage: 2,
      kind: "screenshot",
      title: "Screenshot web #4",
      sub: "topsivi.vn/profile",
      tag: "Hồ sơ & Lịch When2Meet",
      link: "/profile/@nguyenvanan",
      baseAngle: -348,
      radiusRatio: 0.8,
    },
    {
      id: "s3-stamp-guarantee",
      stage: 2,
      kind: "leaf",
      title: "Cam kết dấu mộc",
      sub: "Bảo chứng thực tập chuẩn",
      baseAngle: -358,
      radiusRatio: 0.48,
    },
  ];

  // Thin open connecting lines between cards
  const CONNECTIONS: [string, string][] = [
    // Stage 1 connections
    ["s1-itviec", "s1-req-exp"],
    ["s1-req-exp", "s1-career"],
    ["s1-req-exp", "s1-topcv"],
    ["s1-post-2", "s1-scattered"],
    ["s1-post-1", "s1-scattered"],
    ["s1-scattered", "s1-post-3"],
    ["s1-trap-deposit", "s1-clash-time"],
    ["s1-trap-deposit", "s1-jd-vague"],
    ["s1-clash-time", "s1-jd-vague"],

    // Stage 2 connections
    ["s2-sv-need", "s2-stamp"],
    ["s2-sv-need", "s2-flex-time"],
    ["s2-mkt-need", "s2-mass-workforce"],
    ["s2-mkt-need", "s2-qual-workforce"],
    ["s2-sv-have", "s2-free-time"],
    ["s2-sv-have", "s2-knowledge"],
    ["s2-biz-pain", "s2-hire-cost"],
    ["s2-biz-pain", "s2-filter-cv"],
    ["s2-solution", "s2-tier-split"],
    ["s2-solution", "s2-verify-2way"],
    ["s2-solution", "s2-single-hub"],

    // Stage 3 connections
    ["s3-screen-1", "s3-screen-2"],
    ["s3-screen-2", "s3-screen-3"],
    ["s3-screen-3", "s3-screen-4"],
    ["s3-services-circle", "s3-cv-consult"],
    ["s3-services-circle", "s3-mock-interview"],
    ["s3-trust-hub", "s3-no-deposit"],
    ["s3-trust-hub", "s3-legal-verify"],
    ["s3-trust-hub", "s3-stamp-guarantee"],
  ];

  const stageMeta = [
    {
      index: 0,
      code: "01",
      title: "Thực trạng",
      centerTargetP: 0.12,
    },
    {
      index: 1,
      code: "02",
      title: "Suy nghĩ",
      centerTargetP: 0.5,
    },
    {
      index: 2,
      code: "03",
      title: "Sản phẩm",
      centerTargetP: 0.88,
    },
  ];

  let trackEl: HTMLElement | undefined = $state();
  let viewportWidth = $state(1440);
  let viewportHeight = $state(900);
  let isMobile = $state(false);

  let targetProgress = $state(0);
  let smoothProgress = $state(0);

  // Total angular rotation across the entire scroll track (in degrees)
  const TOTAL_ROTATION_DEG = 450;

  // Center of orbital motion
  let originX = $derived(isMobile ? 24 : viewportWidth / 2);
  let originY = $derived(isMobile ? viewportHeight - 10 : viewportHeight + 35);

  // Expanded baseRadius to fill vertical space and spread the orbits far apart
  let baseRadius = $derived(
    isMobile
      ? Math.min(viewportWidth * 0.88, viewportHeight * 0.62)
      : Math.min(viewportWidth * 0.52, viewportHeight * 0.86),
  );

  // Compute live polar coordinates, opacity, scale for each node
  interface RenderNode extends OrbitNode {
    x: number;
    y: number;
    angleDeg: number;
    opacity: number;
    scale: number;
    visible: boolean;
  }

  let renderedNodes = $derived.by(() => {
    const list: RenderNode[] = [];
    const rot = smoothProgress * TOTAL_ROTATION_DEG;

    for (const node of ALL_NODES) {
      const angleDeg = node.baseAngle + rot;
      const rad = (angleDeg * Math.PI) / 180;
      const r = baseRadius * node.radiusRatio;

      const x = originX + r * Math.cos(rad);
      const y = originY - r * Math.sin(rad);

      // Visibility & opacity along the celestial horizon
      const minAngle = isMobile ? 4 : 8;
      const maxAngle = isMobile ? 86 : 172;

      let opacity = 0;
      let scale = 1;

      if (angleDeg >= minAngle && angleDeg <= maxAngle) {
        const inFadeSpan = isMobile ? 12 : 20;
        const outFadeSpan = isMobile ? 12 : 20;

        if (angleDeg < minAngle + inFadeSpan) {
          opacity = (angleDeg - minAngle) / inFadeSpan;
          scale = 0.9 + opacity * 0.1;
        } else if (angleDeg > maxAngle - outFadeSpan) {
          opacity = (maxAngle - angleDeg) / outFadeSpan;
          scale = 0.9 + opacity * 0.1;
        } else {
          opacity = 1;
          scale = 1;
        }
      }

      list.push({
        ...node,
        x,
        y,
        angleDeg,
        opacity: Math.max(0, Math.min(1, opacity)),
        scale: Math.max(0.88, Math.min(1.04, scale)),
        visible: opacity > 0.01,
      });
    }

    return list;
  });

  // Map for fast connection lookup
  let nodeMap = $derived(new Map(renderedNodes.map((n) => [n.id, n])));

  // Connecting lines
  let renderedLines = $derived.by(() => {
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      opacity: number;
    }[] = [];

    for (const [fromId, toId] of CONNECTIONS) {
      const a = nodeMap.get(fromId);
      const b = nodeMap.get(toId);
      if (!a || !b) continue;

      const lineOpacity = Math.min(a.opacity, b.opacity) * 0.55;
      if (lineOpacity <= 0.02) continue;

      lines.push({
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        opacity: lineOpacity,
      });
    }

    return lines;
  });

  // Which stage is currently dominant at zenith?
  let activeStage = $derived.by(() => {
    const rot = smoothProgress * TOTAL_ROTATION_DEG;
    const targetApex = isMobile ? 45 : 90;

    const diff0 = Math.abs(45 + rot - targetApex);
    const diff1 = Math.abs(-140 + rot - targetApex);
    const diff2 = Math.abs(-290 + rot - targetApex);

    if (diff0 <= diff1 && diff0 <= diff2) return 0;
    if (diff1 <= diff0 && diff1 <= diff2) return 1;
    return 2;
  });

  function handleRecruitClick() {
    if ($currentUser) {
      openPostJobModal();
    } else {
      openAuthModal("login");
    }
  }

  onMount(() => {
    initSmoothScroll();

    let st: ScrollTrigger | null = null;
    let tickerCallback: (() => void) | null = null;

    const teardownParallax = () => {
      if (st) {
        st.kill();
        st = null;
      }
      if (tickerCallback) {
        gsap.ticker.remove(tickerCallback);
        tickerCallback = null;
      }
    };

    const setupParallax = () => {
      if (!trackEl || st) return;

      const computeProgress = (self: ScrollTrigger) => {
        const H = trackEl ? trackEl.offsetHeight : 5000;
        const V = window.innerHeight || 900;
        const stickyDistance = Math.max(1, H - V);
        const totalDistance = Math.max(1, self.end - self.start); // equals H + V
        const scrolledIntoSection = self.progress * totalDistance;
        // At "top bottom": scrolledIntoSection = 0 -> p = -V / stickyDistance
        // At "top top": scrolledIntoSection = V -> p = 0 (reaches exact starting state)
        // At "bottom bottom": scrolledIntoSection = H -> p = 1 (reaches exact end state)
        // At "bottom top": scrolledIntoSection = H + V -> p = 1 + V / stickyDistance (exits smoothly)
        return (scrolledIntoSection - V) / stickyDistance;
      };

      st = ScrollTrigger.create({
        trigger: trackEl,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          targetProgress = computeProgress(self);
        },
      });

      // Synchronize immediately on load to prevent jumping
      const initialP = computeProgress(st);
      targetProgress = initialP;
      smoothProgress = initialP;

      tickerCallback = () => {
        const diff = targetProgress - smoothProgress;
        if (Math.abs(diff) > 0.0001) {
          smoothProgress += diff * 0.16;
        } else {
          smoothProgress = targetProgress;
        }
      };

      gsap.ticker.add(tickerCallback);
    };

    const handleResize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      isMobile = window.innerWidth < 768;

      if (isMobile) {
        teardownParallax();
      } else {
        setupParallax();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      teardownParallax();
    };
  });
</script>

<!-- STICKY PARALLAX SCROLL TRACK (~580vh = ~1.8 viewports per stage) — Hidden on mobile (<768px) -->
<section
  id="cau-chuyen-topsivi"
  bind:this={trackEl}
  class="hidden md:block relative w-full bg-obsidian-900 text-alabaster-50 select-none"
  style="height: 580vh;"
>
  <!-- Sticky Viewport Canvas -->
  <div
    class="sticky top-0 h-screen w-full overflow-hidden bg-obsidian-900 bg-organic-grid-dark relative"
  >
    <!-- Ambient Orbital Background Glows -->
    <div
      class="pointer-events-none absolute inset-0 transition-transform duration-75"
      style="transform: translate3d({(0.5 - smoothProgress) * 140}px, {(0.5 -
        smoothProgress) *
        50}px, 0);"
    >
      <div
        class="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-mint/10 blur-[130px]"
      ></div>
      <div
        class="absolute bottom-20 right-1/4 h-80 w-80 rounded-full bg-mint/8 blur-[110px]"
      ></div>
    </div>

    <!-- Background Concentric Orbital Guides (Widely spaced tracks) -->
    <svg
      class="pointer-events-none absolute inset-0 h-full w-full"
      style="opacity: 0.18;"
    >
      <circle
        cx={originX}
        cy={originY}
        r={baseRadius * 0.46}
        fill="none"
        stroke="#70ffaf"
        stroke-width="1.2"
      />
      <circle
        cx={originX}
        cy={originY}
        r={baseRadius * 0.65}
        fill="none"
        stroke="#70ffaf"
        stroke-width="1.2"
      />
      <circle
        cx={originX}
        cy={originY}
        r={baseRadius * 0.82}
        fill="none"
        stroke="#70ffaf"
        stroke-width="1.2"
      />
      <circle
        cx={originX}
        cy={originY}
        r={baseRadius * 1.0}
        fill="none"
        stroke="#70ffaf"
        stroke-width="1.2"
      />
    </svg>

    <!-- MAIN ORBITAL CANVAS: SVG CONNECTIONS + UPRIGHT EXPANDED CARDS -->
    <div class="pointer-events-none absolute inset-0 z-20 h-full w-full">
      <!-- Thin, Open Connecting Lines -->
      <svg class="h-full w-full">
        {#each renderedLines as line}
          <line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#70ffaf"
            stroke-width="1.3"
            stroke-opacity={line.opacity}
          />
        {/each}
      </svg>

      <!-- ALL CARDS: STRICTLY ALWAYS UPRIGHT (rotate(0deg)), LARGER BOUNDS -->
      {#each renderedNodes as node (node.id)}
        {#if node.visible}
          <div
            class="pointer-events-auto absolute w-max flex-shrink-0 select-none"
            style="
              left: {node.x}px;
              top: {node.y}px;
              opacity: {node.opacity};
              transform: translate(-50%, -50%) scale({node.scale});
              will-change: transform, opacity;
              width: max-content;
            "
          >
            <!-- 1. JOB POST IMAGE CARD -->
            {#if node.kind === "post"}
              <!-- If real image provided (e.g. Facebook post image) -->
              {#if node.image}
                <div
                  class="w-64 sm:w-72 lg:w-80 flex-shrink-0 max-w-none rounded-3xl border-2 border-alabaster-100 bg-obsidian-800 p-2 shadow-2xl overflow-hidden hover:border-mint transition-all duration-200 hover:scale-103"
                >
                  <div
                    class="relative overflow-hidden rounded-2xl border border-obsidian-700/60 bg-obsidian-900"
                  >
                    <img
                      src={url(node.image)}
                      alt={node.title}
                      class="w-full h-auto object-cover block"
                      loading="lazy"
                    />
                  </div>
                </div>
              {:else}
                <!-- Placeholder Frame for other posts (Threads, Job portal, Zalo) -->
                <div
                  class="w-64 sm:w-72 lg:w-80 flex-shrink-0 max-w-none rounded-3xl border-2 border-alabaster-200/90 bg-obsidian-800/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all hover:border-mint hover:shadow-mint-glow"
                >
                  <!-- Header -->
                  <div
                    class="flex items-center justify-between border-b border-obsidian-600/80 pb-2.5 mb-3"
                  >
                    <span
                      class="font-mono text-xs font-bold text-mint uppercase tracking-wider truncate max-w-[180px] whitespace-nowrap"
                    >
                      {node.postSource || node.sub}
                    </span>
                    <span class="h-2.5 w-2.5 rounded-full bg-mint flex-shrink-0"
                    ></span>
                  </div>

                  <!-- Placeholder Image Box -->
                  <div
                    class="relative mb-3 h-28 sm:h-32 w-full overflow-hidden rounded-2xl border border-dashed border-mint/40 bg-obsidian-900/90 flex flex-col items-center justify-center text-center p-3"
                  >
                    <svg
                      class="h-7 w-7 text-mint/70 mb-1.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span
                      class="font-mono text-xs sm:text-sm font-extrabold text-alabaster-50 tracking-tight whitespace-nowrap"
                    >
                      {node.title}
                    </span>
                    <span
                      class="font-mono text-[9px] sm:text-[10px] text-alabaster-400 mt-0.5 whitespace-nowrap"
                    >
                      [ Placeholder ảnh ]
                    </span>
                  </div>

                  <!-- Snippet -->
                  <p
                    class="text-xs sm:text-sm leading-relaxed text-alabaster-200 line-clamp-3"
                  >
                    {node.postSnippet}
                  </p>
                </div>
              {/if}

              <!-- 2. PLACEHOLDER WEB SCREENSHOT CARD (Stage 3) -->
            {:else if node.kind === "screenshot"}
              <a
                href={url(node.link || "/jobs")}
                class="block w-64 sm:w-72 lg:w-80 flex-shrink-0 max-w-none rounded-3xl border-2 border-mint/80 bg-obsidian-800/95 p-4 sm:p-5 shadow-mint-glow backdrop-blur-md transition-all hover:scale-104 hover:border-mint"
              >
                <!-- Browser mockup header -->
                <div
                  class="flex items-center justify-between border-b border-obsidian-600/80 pb-2 mb-2.5"
                >
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <span class="h-2.5 w-2.5 rounded-full bg-mint"></span>
                    <span class="h-2.5 w-2.5 rounded-full bg-obsidian-600"
                    ></span>
                    <span class="h-2.5 w-2.5 rounded-full bg-obsidian-600"
                    ></span>
                  </div>
                  <span
                    class="font-mono text-xs text-mint font-semibold truncate max-w-[150px] whitespace-nowrap"
                  >
                    {node.sub}
                  </span>
                </div>

                <!-- Preview Box -->
                <div
                  class="relative mb-2.5 h-28 sm:h-32 w-full overflow-hidden rounded-2xl border border-dashed border-mint/40 bg-obsidian-900/90 flex flex-col items-center justify-center text-center p-3"
                >
                  <svg
                    class="h-7 w-7 text-mint mb-1.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.8"
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span
                    class="font-display text-xs sm:text-sm font-extrabold text-alabaster-50 whitespace-nowrap"
                  >
                    {node.title}
                  </span>
                  <span
                    class="font-mono text-[9px] sm:text-[10px] text-mint mt-0.5 whitespace-nowrap"
                  >
                    [ Giao diện TopSiVi ]
                  </span>
                </div>

                <p
                  class="font-display text-sm sm:text-base font-bold text-alabaster-100 truncate whitespace-nowrap"
                >
                  {node.tag || node.sub}
                </p>
              </a>

              <!-- 3. CENTRAL TOPSIVI LOGO EMBLEM (Stage 3 Center) -->
            {:else if node.kind === "logo"}
              <div
                class="flex flex-col items-center justify-center w-max flex-shrink-0 rounded-3xl border-2 border-mint bg-obsidian-900 px-6 py-4 sm:px-8 sm:py-5 shadow-mint-glow-lg pulse-mint backdrop-blur-md"
              >
                <svg
                  class="h-9 w-16 sm:h-11 sm:w-20"
                  viewBox="0 0 88 44"
                  fill="none"
                >
                  <path d="M4 6H38V14H25V38H16V14H4V6Z" fill="#70ffaf" />
                  <path
                    d="M45 12C36 12 31 16.5 31 22C31 27.5 37 29.8 43.5 31.5C48.5 32.8 51 34.2 51 37C51 39.8 47.5 41.5 42 41.5C36.5 41.5 32.5 39 31 35.5L24 39.5C27 44.5 33.5 44 42 44C52.5 44 59.5 39 59.5 32C59.5 26 53.5 23 46 21C40.5 19.5 39 18.2 39 16.5C39 14.5 41.5 13.5 45 13.5C48.5 13.5 51.5 15 53.5 17.5L59.5 13C56 10.5 51 12 45 12Z"
                    fill="#f8faf7"
                  />
                  <path
                    d="M50 6L62 36L74 6H83L66 42H58L41 6H50Z"
                    fill="#70ffaf"
                  />
                </svg>
                <span
                  class="font-display text-sm sm:text-base font-black text-mint tracking-tight mt-1.5 whitespace-nowrap"
                >
                  TopSiVi Hub
                </span>
              </div>

              <!-- 4. CIRCLE HUB (Dịch vụ hỗ trợ) -->
            {:else if node.kind === "circle"}
              <a
                href={url(node.link || "/services")}
                class="flex h-28 w-28 sm:h-36 sm:w-36 flex-shrink-0 flex-col items-center justify-center rounded-full border-2 border-mint bg-obsidian-800 p-3 text-center shadow-mint-glow hover:bg-mint hover:text-obsidian-900 transition-all"
              >
                <span
                  class="font-display text-sm sm:text-base font-black leading-tight whitespace-nowrap"
                  >Dịch vụ</span
                >
                <span
                  class="font-display text-sm sm:text-base font-black leading-tight whitespace-nowrap"
                  >hỗ trợ</span
                >
              </a>

              <!-- 5. MIND-MAP QUESTION / SOLUTION HUB -->
            {:else if node.kind === "hub"}
              <div
                class="w-max flex-shrink-0 rounded-2xl sm:rounded-3xl border-2 border-mint bg-obsidian-800/95 px-6 py-3.5 sm:px-8 sm:py-4 shadow-mint-glow backdrop-blur-md"
              >
                <span
                  class="font-display text-sm sm:text-lg font-black text-mint whitespace-nowrap"
                >
                  {node.title}
                </span>
              </div>

              <!-- 6. PAIN POINT PROBLEM NODE -->
            {:else if node.kind === "problem"}
              <div
                class="w-max flex-shrink-0 rounded-2xl sm:rounded-3xl border-2 border-mint/80 bg-obsidian-800/95 px-5 py-3.5 sm:px-6 sm:py-4 shadow-xl backdrop-blur-md"
              >
                <span
                  class="font-display text-sm sm:text-base font-extrabold text-mint block leading-tight whitespace-nowrap"
                >
                  {node.title}
                </span>
                {#if node.sub}
                  <span
                    class="text-xs sm:text-sm text-alabaster-200 block leading-snug mt-1 whitespace-nowrap"
                  >
                    {node.sub}
                  </span>
                {/if}
              </div>

              <!-- 7. PLATFORM BADGE -->
            {:else if node.kind === "badge"}
              {#if node.logo}
                <!-- Khung trắng bo tròn với logo, tên trang bên dưới -->
                <div
                  class="flex flex-col items-center group w-max flex-shrink-0"
                >
                  <div
                    class="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-alabaster-100 bg-white p-2.5 sm:p-3 shadow-2xl transition-all duration-200 group-hover:scale-108 group-hover:border-mint group-hover:shadow-mint-glow"
                  >
                    <img
                      src={url(node.logo)}
                      alt={node.title}
                      class="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <span
                    class="font-display text-xs sm:text-sm font-extrabold text-alabaster-100 tracking-tight block text-center mt-2 group-hover:text-mint transition-colors whitespace-nowrap"
                  >
                    {node.title}
                  </span>
                </div>
              {:else if node.link}
                <a
                  href={url(node.link)}
                  class="block w-max flex-shrink-0 rounded-2xl border-2 border-alabaster-200/90 bg-obsidian-800/95 px-5 py-3 sm:px-6 sm:py-3.5 shadow-xl hover:border-mint transition-colors backdrop-blur-md"
                >
                  <span
                    class="font-display text-sm sm:text-base font-extrabold text-alabaster-50 block leading-tight whitespace-nowrap"
                  >
                    {node.title}
                  </span>
                  {#if node.sub}
                    <span
                      class="font-mono text-xs text-mint block leading-tight mt-0.5 whitespace-nowrap"
                    >
                      {node.sub}
                    </span>
                  {/if}
                </a>
              {:else}
                <div
                  class="w-max flex-shrink-0 rounded-2xl border-2 border-alabaster-200/90 bg-obsidian-800/95 px-5 py-3 sm:px-6 sm:py-3.5 shadow-xl backdrop-blur-md"
                >
                  <span
                    class="font-display text-sm sm:text-base font-extrabold text-alabaster-50 block leading-tight whitespace-nowrap"
                  >
                    {node.title}
                  </span>
                  {#if node.sub}
                    <span
                      class="font-mono text-xs text-alabaster-300 block leading-tight mt-0.5 whitespace-nowrap"
                    >
                      {node.sub}
                    </span>
                  {/if}
                </div>
              {/if}

              <!-- 8. CONCEPT LEAF -->
            {:else}
              {#if node.link}
                <a
                  href={url(node.link)}
                  class="block w-max flex-shrink-0 rounded-xl sm:rounded-2xl border border-mint/60 bg-obsidian-800/90 px-4 py-2.5 sm:px-5 sm:py-3 shadow-md hover:bg-mint hover:text-obsidian-900 transition-colors backdrop-blur-md"
                >
                  <span
                    class="font-display text-xs sm:text-sm font-bold block leading-tight whitespace-nowrap"
                    >{node.title}</span
                  >
                  {#if node.sub}
                    <span
                      class="text-[11px] sm:text-xs text-alabaster-300 block leading-tight mt-0.5 whitespace-nowrap"
                      >{node.sub}</span
                    >
                  {/if}
                </a>
              {:else}
                <div
                  class="w-max flex-shrink-0 rounded-xl sm:rounded-2xl border border-alabaster-200/80 bg-obsidian-800/90 px-4 py-2.5 sm:px-5 sm:py-3 shadow-md backdrop-blur-md"
                >
                  <span
                    class="font-display text-xs sm:text-sm font-bold text-alabaster-50 block leading-tight whitespace-nowrap"
                    >{node.title}</span
                  >
                  {#if node.sub}
                    <span
                      class="text-[11px] sm:text-xs text-alabaster-300 block leading-tight mt-0.5 whitespace-nowrap"
                      >{node.sub}</span
                    >
                  {/if}
                </div>
              {/if}
            {/if}
          </div>
        {/if}
      {/each}
    </div>

    <!-- BOTTOM CENTER HEMISPHERE / DOME (Permanently anchored at bottom center as orbital axis) -->
    <div
      class="pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex flex-col items-center justify-end"
    >
      <div
        class="relative flex h-40 w-[340px] sm:h-48 sm:w-[480px] flex-col items-center justify-center rounded-t-full border-t-2 border-x-2 border-mint bg-obsidian-800/95 px-8 pt-6 text-center shadow-[0_-20px_60px_rgba(112,255,175,0.22)] backdrop-blur-md"
      >
        <span
          class="font-mono text-xs font-bold uppercase tracking-widest text-mint mb-1.5"
        >
          0{activeStage + 1} / 03
        </span>

        <!-- Active Stage Title in the Dome -->
        <h2
          class="font-display text-3xl sm:text-5xl font-black tracking-tight text-alabaster-50 transition-all duration-300"
        >
          {stageMeta[activeStage].title}
        </h2>
      </div>
    </div>
  </div>
</section>

<!-- =============================================================== -->
<!-- FINAL CALL TO ACTION SECTION (Matches Sketch 5 before Footer)   -->
<!-- =============================================================== -->
<section
  class="relative border-t border-obsidian-700 bg-obsidian-900 py-20 sm:py-28 text-alabaster-50 overflow-hidden"
>
  <div
    class="pointer-events-none absolute inset-0 bg-organic-dots-dark opacity-40"
  ></div>
  <div
    class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-[500px] rounded-full bg-mint/10 blur-3xl"
  ></div>

  <div class="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
    <p
      class="font-mono text-xs font-bold uppercase tracking-widest text-mint mb-3"
    >
      SẴN SÀNG BẮT ĐẦU CÙNG TOPSIVI
    </p>
    <h2
      class="font-display text-2xl sm:text-4xl font-extrabold text-alabaster-50 tracking-tight mb-10"
    >
      Kết nối sinh viên tài năng & doanh nghiệp minh bạch
    </h2>

    <!-- Dual Action Buttons matching Sketch 5 ("Tìm việc ngay" & "Đăng tuyển ngay") -->
    <div
      class="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12"
    >
      <a
        href={url("/jobs")}
        class="group relative inline-flex min-w-[220px] items-center justify-center gap-3 rounded-2xl border-2 border-mint bg-mint px-8 py-4 font-display text-base sm:text-lg font-extrabold text-obsidian-900 shadow-mint-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-mint-400"
      >
        <span>Tìm việc ngay</span>
        <span
          class="transition-transform duration-200 group-hover:translate-x-1"
          >→</span
        >
      </a>

      <button
        type="button"
        onclick={handleRecruitClick}
        class="group relative inline-flex min-w-[220px] items-center justify-center gap-3 rounded-2xl border-2 border-alabaster-100 bg-obsidian-800 px-8 py-4 font-display text-base sm:text-lg font-extrabold text-alabaster-50 transition-all duration-200 hover:-translate-y-0.5 hover:border-mint hover:text-mint"
      >
        <span>Đăng tuyển ngay</span>
        <span
          class="transition-transform duration-200 group-hover:translate-x-1"
          >→</span
        >
      </button>
    </div>
  </div>
</section>
