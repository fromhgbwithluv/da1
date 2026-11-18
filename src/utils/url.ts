/**
 * URL helper for handling Astro BASE_URL consistently across dev and production (e.g. GitHub Pages)
 */

export function getBaseUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

export function url(path: string = ''): string {
  const base = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
