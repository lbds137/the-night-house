import { describe, expect, it } from 'vitest';
import { byLetter, parseGlossary, slugify } from './glossary';

describe('slugify', () => {
  it('folds accents and joins words with hyphens', () => {
    expect(slugify('Ásatrú')).toBe('asatru');
    expect(slugify('Santería')).toBe('santeria');
    expect(slugify('Right hand path')).toBe('right-hand-path');
    expect(slugify('Clair-senses')).toBe('clair-senses');
    expect(slugify('UPG')).toBe('upg');
  });
});

describe('parseGlossary', () => {
  const sample = [
    '**Ásatrú**: a revival.',
    '**Clair-senses**: senses, such as:\n* **Clairvoyance**, seeing;\n* **Clairaudience**, hearing.',
    '**Egregore**: a group entity.',
    '<p class="more-to-come">(more to come!)</p>',
  ].join('\n\n');

  it('splits entries, keeping multi-line ones whole', () => {
    const { entries, trailer } = parseGlossary(sample);
    expect(entries.map((e) => [e.term, e.slug, e.letter])).toEqual([
      ['Ásatrú', 'asatru', 'A'],
      ['Clair-senses', 'clair-senses', 'C'],
      ['Egregore', 'egregore', 'E'],
    ]);
    expect(entries[1].markdown).toContain('* **Clairaudience**');
    expect(trailer).toBe('<p class="more-to-come">(more to come!)</p>');
  });

  it('groups entries by letter in page order', () => {
    const groups = byLetter(parseGlossary(sample).entries);
    expect([...groups.keys()]).toEqual(['A', 'C', 'E']);
  });

  it('refuses an entry placed after the trailer', () => {
    expect(() => parseGlossary(`${sample}\n\n**Void**: nothing.`)).toThrow(/Void/);
  });

  it('refuses two entries with the same anchor', () => {
    expect(() => parseGlossary('**Santeria**: one.\n\n**Santería**: two.')).toThrow(/santeria/);
  });
});
