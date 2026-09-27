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

  it('ignores look-alike attributes such as data-href, data-src and xlink:href', () => {
    const html =
      '<div data-href="/nowhere/"></div><img data-src="/lazy.png">' +
      '<svg><use xlink:href="#icon"></use></svg>';
    expect(internalLinks(html)).toEqual([]);
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

  it('resolves an anchor-only link against its own page', () => {
    const own = [{ path: '/a/', html: '<a href="#top">t</a><h1 id="top">A</h1>' }];
    expect(findBrokenLinks(own, files)).toEqual([]);
    const missing = [{ path: '/a/', html: '<a href="#top">t</a>' }];
    expect(findBrokenLinks(missing, files)).toEqual(['/a/: #top (no element with id "top")']);
  });

  it('does not count data-id as an id', () => {
    const fake = [{ path: '/a/', html: '<a href="#x">x</a><div data-id="x"></div>' }];
    expect(findBrokenLinks(fake, files)).toEqual(['/a/: #x (no element with id "x")']);
  });

  it('keeps a second "#" as part of the fragment', () => {
    const page = [{ path: '/a/', html: '<a href="#a#b">x</a><div id="a#b"></div>' }];
    expect(findBrokenLinks(page, files)).toEqual([]);
  });

  it('says so plainly when an anchor points into a file', () => {
    const page = [{ path: '/a/', html: '<a href="/og-card.png#top">x</a>' }];
    expect(findBrokenLinks(page, files)).toEqual([
      '/a/: /og-card.png#top (an #anchor on a file, which has no ids)',
    ]);
  });
});
