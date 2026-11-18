import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

declare global {
  interface Window {
    __lenis?: Lenis;
    __lenisInitialized?: boolean;
  }
}

let lenisInstance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;

/**
 * Initializes a single shared Lenis smooth-scroll instance synchronized with GSAP ScrollTrigger.
 * Excludes modals, drawers, and any [data-lenis-prevent] / [role="dialog"] elements from wheel hijacking.
 */
export function initSmoothScroll(): Lenis | null {
  if (typeof window === 'undefined') return null;

  gsap.registerPlugin(ScrollTrigger);

  if (window.__lenis) {
    lenisInstance = window.__lenis;
    return lenisInstance;
  }

  // Respect user's reduced-motion accessibility setting if enabled
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return null;
  }

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.5,
    autoResize: true,
    prevent: (node: HTMLElement) => {
      if (!node || typeof node.closest !== 'function') return false;
      return Boolean(node.closest('[role="dialog"], [data-lenis-prevent]'));
    },
  });

  lenis.on('scroll', ScrollTrigger.update);

  tickerCallback = (time: number) => {
    lenis.raf(time * 1000);
  };

  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);

  lenisInstance = lenis;
  window.__lenis = lenis;

  if (!window.__lenisInitialized) {
    window.__lenisInitialized = true;

    // Smoothly handle in-page hash anchor links via Lenis
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;

      const destination = document.querySelector(hash) as HTMLElement | null;
      if (!destination) return;

      event.preventDefault();
      if (window.__lenis) {
        window.__lenis.scrollTo(destination, { offset: 0, duration: 1.2 });
      } else {
        destination.scrollIntoView({ behavior: 'smooth' });
      }
      history.pushState(null, '', hash);
    });
  }

  return lenis;
}

export function getLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;
  return window.__lenis ?? lenisInstance;
}

export function scrollToPosition(targetY: number, duration = 1.15): void {
  if (typeof window === 'undefined') return;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(targetY, { duration });
  } else {
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }
}

export { gsap, ScrollTrigger };

