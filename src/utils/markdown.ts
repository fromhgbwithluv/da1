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
  html = html.replace(/^### (.*$)/gim, '<h4 class="font-display font-extrabold text-obsidian-900 text-sm mt-4 mb-2">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="font-display font-extrabold text-obsidian-900 text-[15px] mt-5 first:mt-0 mb-2.5 border-b border-obsidian-900/10 pb-1.5">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="font-display font-extrabold text-obsidian-900 text-base mt-6 first:mt-0 mb-3 border-b border-obsidian-900/15 pb-2">$1</h2>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-obsidian-900">$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em class="italic text-obsidian-700">$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/gim, '<code class="font-mono text-xs bg-alabaster-100 text-obsidian-900 px-1.5 py-0.5 rounded-md border border-obsidian-900/10">$1</code>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-2 border-mint-500 pl-3.5 py-1.5 my-2.5 italic text-obsidian-700 bg-alabaster-100/80 rounded-r-xl text-xs">$1</blockquote>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="font-semibold underline text-obsidian-900 hover:text-mint-700">$1</a>');

  // Unordered Lists: lines starting with - or *
  const lines = html.split('\n');
  let inList = false;
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        processedLines.push('<ul class="space-y-1.5 my-2.5 pl-5 list-disc text-xs sm:text-[13px] text-obsidian-700 leading-relaxed">');
        inList = true;
      }
      processedLines.push(`<li>${line.slice(2)}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (line.length > 0 && !line.startsWith('<h') && !line.startsWith('<block')) {
        processedLines.push(`<p class="text-xs sm:text-[13px] leading-relaxed text-obsidian-700 my-2">${line}</p>`);
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
