export interface SourceRef {
  slug: string;
  chunk_index: number;
}

function toTitle(slugPart: string): string {
  return slugPart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatCitation(source: SourceRef): string {
  const { slug } = source;
  if (slug.startsWith('journal/')) {
    const parts = slug.split('/');
    const entry = parts[1] || '';
    return `journal entry "${toTitle(entry)}"`;
  }
  if (slug.startsWith('books/')) {
    const parts = slug.split('/');
    const book = toTitle(parts[1] || '');
    const chapter = toTitle(parts[2] || '');
    return `${book}, ${chapter}`;
  }
  if (slug.startsWith('docs/codex/')) {
    const parts = slug.split('/');
    const doc = toTitle(parts[2] || '');
    return `codex article "${doc}"`;
  }
  return toTitle(slug);
}
