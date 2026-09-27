import { describe, expect, it } from 'vitest';
import { jsonLd, pagePaths, plainDefinition } from './seo';

describe('jsonLd', () => {
  it('keeps a string from closing the script element, without changing the data', () => {
    const data = { name: 'x</script><script>alert(1)</script>' };
    const out = jsonLd(data);
    expect(out).not.toContain('<');
    expect(JSON.parse(out)).toEqual(data);
  });
});

describe('pagePaths', () => {
  it('maps page files to paths, including nested ones', () => {
    const files = [
      './index.astro',
      './rules.astro',
      './resources/index.astro',
      './resources/books.astro',
    ];
    expect(pagePaths(files)).toEqual(['/', '/resources/', '/resources/books/', '/rules/']);
  });

  it('leaves out the 404 page and dynamic routes', () => {
    const files = ['./404.astro', './[slug].astro', './glossary.astro'];
    expect(pagePaths(files)).toEqual(['/glossary/']);
  });
});

describe('plainDefinition', () => {
  it('drops the term, an alias after it, and Markdown marks', () => {
    const asatru = '**Ásatrú** (also Asatru): a *modern* revival.';
    expect(plainDefinition(asatru)).toBe('a modern revival.');
    const satan = '**Satan**: in the Hebrew Bible, *ha-satan* is a title.';
    expect(plainDefinition(satan)).toBe('in the Hebrew Bible, ha-satan is a title.');
  });

  it('flattens a bulleted list into one line', () => {
    const md =
      '**Clair-senses**: senses, such as:\n' + '* **Clairvoyance**, seeing;\n* **Clairaudience**.';
    expect(plainDefinition(md)).toBe('senses, such as: Clairvoyance, seeing; Clairaudience.');
  });

  it('keeps a link text and drops its URL', () => {
    const md = '**Tenets**: in [*its* words](https://example.org/a_b_c):\n1. First.';
    expect(plainDefinition(md)).toBe('in its words: 1. First.');
  });
});
