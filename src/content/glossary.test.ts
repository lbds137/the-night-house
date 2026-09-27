import { describe, expect, it } from 'vitest';
import sourcesRaw from '../../docs/glossary-sources.json?raw';
import glossary from './glossary.md?raw';

interface Entry {
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
