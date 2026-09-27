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
    '**Clair-senses**: senses, such as:\n' +
      '* **Clairvoyance**, seeing;\n' +
      '* **Clairaudience**, hearing.',
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

  // CLAUDE.md: comments park unwritten text anywhere in content files.
  it('ignores HTML comments between entries', () => {
    const withComment = '**Ásatrú**: a revival.\n\n<!--\nAscension\n-->\n\n**Egregore**: a group.';
    expect(parseGlossary(withComment).entries.map((e) => e.slug)).toEqual(['asatru', 'egregore']);
  });

  it('refuses a term the A–Z bar could not reach', () => {
    expect(() => parseGlossary('**1st Degree**: an initiation.')).toThrow(/1st Degree/);
    expect(() => parseGlossary('**…**: nothing.')).toThrow(/letter A–Z/);
  });

  it("refuses an anchor the page's own ids already use", () => {
    expect(() => parseGlossary('**Letter A**: a heading.')).toThrow(/letter-a/);
    expect(() => parseGlossary('**Content**: stuff.')).toThrow(/"content"/);
  });

  it('handles a glossary with no entries yet', () => {
    const { entries, trailer } = parseGlossary('<p>(more to come!)</p>');
    expect(entries).toEqual([]);
    expect(trailer).toBe('<p>(more to come!)</p>');
    expect(byLetter(entries).size).toBe(0);
  });
});
