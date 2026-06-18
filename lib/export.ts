import TurndownService from 'turndown';

// Lazily build a service per call — cheap, and avoids any module-load DOM concerns under SSR.
export const htmlToMarkdown = (html: string) =>
  new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' }).turndown(html || '');

export const copyMarkdown = async (html: string) => {
  await navigator.clipboard.writeText(htmlToMarkdown(html));
};

export const downloadMarkdown = (html: string, filename = 'note') => {
  const blob = new Blob([htmlToMarkdown(html)], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(filename || 'note').trim() || 'note'}.md`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportPdf = () => window.print();
