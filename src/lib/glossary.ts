import { stripComments } from './markdown';
import { stripAccents } from './search';

export interface GlossaryEntry {
  term: string;
  /** Anchor id, e.g. "chaos-magick"; also the entry's id in docs/glossary-sources.json. */
  slug: string;
  /** A–Z heading the entry sorts under ("Ásatrú" goes under A). */
  letter: string;
  markdown: string;
}

export interface GlossaryPage {
  entries: GlossaryEntry[];
  /** Whatever follows the entries, such as the "more to come" note. */
  trailer: string;
}

const TERM = /^\*\*(.+?)\*\*/;

/** Fixed ids on the glossary page (Base.astro, glossary.astro); `letter-*` ids are reserved too. */
export const RESERVED_IDS = [
  'content',
  'glossary-tools',
  'glossary-filter',
  'glossary-entries',
  'glossary-no-match',
];

export const slugify = (term: string) =>
  stripAccents(term)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Each entry is one blank-line-separated block starting with its bold term. */
export function parseGlossary(markdown: string): GlossaryPage {
  const blocks = stripComments(markdown).trim().split(/\n{2,}/);
  const entries: GlossaryEntry[] = [];
  let i = 0;
  for (; i < blocks.length; i++) {
    const match = TERM.exec(blocks[i]);
    if (!match) break;
    const term = match[1];
    const slug = slugify(term);
    // The A–Z bar can only reach entries filed under a letter.
    if (!/^[a-z]/.test(slug)) {
      throw new Error(`glossary.md: "${term}" must start with a letter A–Z to be in the index`);
    }
    entries.push({ term, slug, letter: slug[0].toUpperCase(), markdown: blocks[i] });
  }
  const rest = blocks.slice(i);
  const stray = rest.find((block) => TERM.test(block));
  if (stray) {
    const start = stray.slice(0, 60);
    throw new Error(`glossary.md: entry after non-entry text, so it would be lost: ${start}`);
  }
  // Entry anchors share the page with these ids; a collision would break the link silently.
  const seen = new Set<string>(RESERVED_IDS);
  for (const { slug, term } of entries) {
    if (seen.has(slug) || slug.startsWith('letter-')) {
      throw new Error(`glossary.md: "${term}" reuses the anchor "${slug}"`);
    }
    seen.add(slug);
  }
  return { entries, trailer: rest.join('\n\n') };
}

/** Entries grouped under their letters, in page order. */
export function byLetter(entries: GlossaryEntry[]): Map<string, GlossaryEntry[]> {
  const groups = new Map<string, GlossaryEntry[]>();
  for (const entry of entries) {
    const group = groups.get(entry.letter);
    if (group) group.push(entry);
    else groups.set(entry.letter, [entry]);
  }
  return groups;
}
