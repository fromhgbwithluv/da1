/**
 * Lightweight, safe client-side Markdown to HTML renderer for TopSiVi job posts
 */
export function renderMarkdown(md: string): string {
  if (!md) return '';

  // Escape raw HTML tags
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h4 class="font-bold text-black text-sm uppercase mt-4 mb-2">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="font-black text-black text-base uppercase mt-5 mb-2.5 border-b border-black pb-1">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="font-black text-black text-lg uppercase mt-6 mb-3 border-b-2 border-black pb-1.5">$1</h2>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-black text-black">$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em class="italic text-swiss-800">$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/gim, '<code class="font-mono text-xs bg-swiss-100 text-black px-1.5 py-0.5 rounded-swiss-sm border border-swiss-300">$1</code>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-2 border-black pl-3 py-1 my-2 italic text-swiss-600 bg-swiss-50 font-mono text-xs">$1</blockquote>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="font-bold underline text-black hover:text-signal-emerald">$1</a>');

  // Unordered Lists: lines starting with - or *
  const lines = html.split('\n');
  let inList = false;
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        processedLines.push('<ul class="space-y-1.5 my-2.5 pl-5 list-disc text-xs text-swiss-800 font-medium">');
        inList = true;
      }
      processedLines.push(`<li>${line.slice(2)}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (line.length > 0 && !line.startsWith('<h') && !line.startsWith('<block')) {
        processedLines.push(`<p class="text-xs leading-relaxed text-swiss-700 my-2">${line}</p>`);
      } else {
        processedLines.push(line);
      }
    }
  }

  if (inList) {
    processedLines.push('</ul>');
  }

  return processedLines.join('\n');
}
