import { describe, expect, it } from 'vitest';
import sourcesRaw from '../../docs/glossary-sources.json?raw';
import baseLayout from '../layouts/Base.astro?raw';
import { RESERVED_IDS, parseGlossary } from '../lib/glossary';
import { nodes } from '../lib/roles';
import glossaryPage from '../pages/glossary.astro?raw';
import glossary from './glossary.md?raw';

interface Entry {
  id: string;
  term: string;
  draft: string;
  library?: { citations?: { file: string }[] };
}

const entries: Entry[] = JSON.parse(sourcesRaw);

describe('role links into the glossary', () => {
  it('name real entries', () => {
    const slugs = new Set(parseGlossary(glossary).entries.map((e) => e.slug));
    const linked = nodes.flatMap((n) => (n.type === 'role' && n.glossary ? [n.glossary] : []));
    expect(linked.length).toBeGreaterThan(0);
    expect(linked.filter((slug) => !slugs.has(slug))).toEqual([]);
  });
});

describe('glossary sources', () => {
  it('holds exactly the entries on the page, in order', () => {
    const onPage = parseGlossary(glossary).entries.map((e) => e.markdown);
    expect(onPage).toEqual(entries.map((e) => e.draft));
  });

  // The parser refuses entry anchors in RESERVED_IDS, so it must list every fixed id on the page.
  it('reserves every fixed id the glossary page uses', () => {
    // Only the components the page actually renders: those the layout and page import, and
    // whatever those import in turn.
    const components = import.meta.glob<string>('../components/*.astro', {
      query: '?raw',
      import: 'default',
      eager: true,
    });
    const rendered = new Set<string>();
    const visit = (source: string) => {
      for (const [, name] of source.matchAll(/(\w+)\.astro['"]/g)) {
        const path = `../components/${name}.astro`;
        if (components[path] !== undefined && !rendered.has(path)) {
          rendered.add(path);
          visit(components[path]);
        }
      }
    };
    visit(baseLayout + glossaryPage);
    expect([...rendered]).toContain('../components/PermalinkCopier.astro');
    const renderedSources = [...rendered].map((path) => components[path]);
    const source = [baseLayout, glossaryPage, ...renderedSources].join('\n');
    const fixedIds = [...source.matchAll(/\bid="([^"{}]+)"/g)].map((m) => m[1]);
    expect(fixedIds.length).toBeGreaterThan(0);
    expect(fixedIds.filter((id) => !RESERVED_IDS.includes(id))).toEqual([]);
  });

  // The Discord `-define` command (lbds137/yagpdb-custom-commands, utility/define.gohtml) can't
  // do Unicode NFD, so it folds only these accented letters; any other would slug differently
  // there than here. Add the letter to define.gohtml's reReplace map, then to this list.
  // Terms are checked in composed form (NFC); a combining mark still left over has no folded
  // form in the bot, which would turn it into a stray "-".
  it('uses only letters and marks the Discord -define command can fold', () => {
    const botFolds = 'àáâãäåāèéêëēìíîïīòóôõöōùúûūüñçýÿ';
    const foldable = (c: string) =>
      !/[\p{L}\p{M}]/u.test(c) || /[a-z]/.test(c) || botFolds.includes(c);
    const unfoldable = (term: string) =>
      [...term.normalize('NFC').toLowerCase()].filter((c) => !foldable(c));
    expect(unfoldable('Čech')).toEqual(['č']);
    expect(unfoldable('Ásatru')).toEqual([]); // decomposed "Á" composes to a folded letter
    expect(unfoldable('q́')).toEqual(['́']); // no composed form: the mark remains
    expect(entries.flatMap((e) => unfoldable(e.term).map((c) => `${e.term}: ${c}`))).toEqual([]);
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
