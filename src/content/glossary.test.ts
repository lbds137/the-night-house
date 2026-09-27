import { describe, expect, it } from 'vitest';
import sourcesRaw from '../../docs/glossary-sources.json?raw';
import { parseGlossary } from '../lib/glossary';
import glossary from './glossary.md?raw';

interface Entry {
  id: string;
  term: string;
  draft: string;
  library?: { citations?: { file: string }[] };
}

const entries: Entry[] = JSON.parse(sourcesRaw);

describe('glossary sources', () => {
  it('holds exactly the entries on the page, in order', () => {
    const paragraphs = glossary.split('\n\n').filter((p: string) => p.startsWith('**'));
    expect(paragraphs).toEqual(entries.map((e) => e.draft));
  });

  // Anchors are public links (/glossary/#egregore); the sources file keys entries the same way.
  it('gives each entry the anchor its sources record uses', () => {
    expect(parseGlossary(glossary).entries.map((e) => e.slug)).toEqual(entries.map((e) => e.id));
  });

  // The A–Z bar jumps to each letter's first entry, so the page must stay alphabetical.
  it('keeps entries in alphabetical order', () => {
    const slugs = parseGlossary(glossary).entries.map((e) => e.slug);
    expect(slugs).toEqual([...slugs].sort());
  });

  // The repo is public; the owner's Drive also holds private and other people's writing.
  it('cites only the shared Knowledge library from Drive', () => {
    const outside = entries.flatMap((e) =>
      (e.library?.citations ?? [])
        .filter((c) => !c.file.startsWith('Knowledge/'))
        .map((c) => `${e.term}: ${c.file}`),
    );
    expect(outside).toEqual([]);
    expect(sourcesRaw).not.toContain('Personal/');
  });
});
