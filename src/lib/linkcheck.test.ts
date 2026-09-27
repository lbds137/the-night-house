import { describe, expect, it } from 'vitest';
import { findBrokenLinks, internalLinks } from './linkcheck';

describe('internalLinks', () => {
  it('collects site paths and anchors from href, src and srcset, not external URLs', () => {
    const html =
      '<a href="/rules/">r</a><a href="#x">x</a><a href="https://discord.com/">d</a>' +
      '<link href="//fonts.example/">' +
      '<img src="/_astro/a.webp" srcset="/_astro/a.webp 1x, /_astro/b.webp 2x">';
    expect(internalLinks(html)).toEqual([
      '/rules/',
      '#x',
      '/_astro/a.webp',
      '/_astro/a.webp',
      '/_astro/b.webp',
    ]);
  });
});

describe('findBrokenLinks', () => {
  const pages = [
    { path: '/', html: '<main id="content"><a href="/glossary/#upg">UPG</a></main>' },
    { path: '/glossary/', html: '<div id="upg"></div><a href="#upg">#</a>' },
  ];
  const files = new Set(['/og-card.png']);

  it('passes links to existing pages, anchors and files', () => {
    const withFile = [...pages, { path: '/x/', html: '<img src="/og-card.png">' }];
    expect(findBrokenLinks(withFile, files)).toEqual([]);
  });

  it('reports a page that was not built', () => {
    const bad = [...pages, { path: '/x/', html: '<a href="/resources/">r</a>' }];
    expect(findBrokenLinks(bad, files)).toEqual(['/x/: /resources/ (no such page or file)']);
  });

  it('reports an anchor with no matching id, on the same page or another', () => {
    const bad = [
      ...pages,
      { path: '/x/', html: '<a href="#gone">a</a><a href="/glossary/#therian">b</a>' },
    ];
    expect(findBrokenLinks(bad, files)).toEqual([
      '/x/: #gone (no element with id "gone")',
      '/x/: /glossary/#therian (no element with id "therian")',
    ]);
  });

  it('reports a missing file', () => {
    const bad = [...pages, { path: '/x/', html: '<img src="/missing.png">' }];
    expect(findBrokenLinks(bad, files)).toEqual(['/x/: /missing.png (no such page or file)']);
  });
});
