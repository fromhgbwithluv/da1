import type { Job } from '../types/job';
import { showToast } from '../stores/toast';
import { url } from './url';

/**
 * Build a direct deep-link URL that automatically opens the Job Detail modal
 */
export function getJobShareUrl(job: Job): string {
  if (typeof window === 'undefined') return url('/jobs');
  const jobsPath = url('/jobs');
  const shareUrl = new URL(jobsPath, window.location.origin);
  shareUrl.searchParams.set('job', job.id);
  return shareUrl.toString();
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Share a job posting via Web Share API on mobile devices or copy direct link to clipboard.
 */
export async function shareJob(job: Job): Promise<'shared' | 'copied' | 'failed'> {
  const shareUrl = getJobShareUrl(job);
  const shareTitle = `${job.title} - ${job.company} | TopSiVi`;
  const shareText = `Cơ hội việc làm: ${job.title} tại ${job.company} (${job.salary})`;

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  if (isMobile && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return 'failed';
      }
      // Fall through to clipboard copy
    }
  }

  const copied = await copyTextToClipboard(shareUrl);
  if (copied) {
    showToast('Đã sao chép liên kết tin tuyển dụng!', 'success');
    return 'copied';
  }

  showToast('Không thể sao chép liên kết. Vui lòng thử lại!', 'remove');
  return 'failed';
}

