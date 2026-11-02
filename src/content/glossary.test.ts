import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import sourcesRaw from '../../docs/glossary-sources.json?raw';
import { RESERVED_IDS, parseGlossary } from '../lib/glossary';
import { nodes } from '../lib/roles';
import { fixedIds } from '../lib/testing/fixed-ids';
import glossaryPage from '../pages/glossary.astro?raw';
import glossary from './glossary.md?raw';

interface Entry {
  id: string;
  term: string;
  draft: string;
  library?: { citations?: { file: string }[]; report?: string };
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
    const { ids, components } = fixedIds(glossaryPage);
    expect(components).toContain('PermalinkCopier.astro');
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.filter((id) => !RESERVED_IDS.includes(id))).toEqual([]);
  });

  // The Discord `/define` command (yagpdb-custom-commands, everyone/knowledge/define.gohtml) can't
  // do Unicode NFD, so it folds only these accented letters; any other would slug differently
  // there than here. Add the letter to define.gohtml's reReplace map, then to this list.
  // Terms are checked in composed form (NFC); a combining mark still left over has no folded
  // form in the bot, which would turn it into a stray "-".
  it('uses only letters and marks the Discord /define command can fold', () => {
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

  // The research trail lives in a private repo. Guard by shape, so this file never has to
  // name it: every repo reference must be a public one, and every report a known form.
  it('names no private repo', () => {
    const publicRepos = ['the-night-house', 'yagpdb-custom-commands'];
    // A sentence-ending period or a .git suffix is not part of the repo's name.
    const repoRefs = [...sourcesRaw.matchAll(/lbds137\/([\w.-]+)/gi)].map((m) =>
      m[1].replace(/(\.git)?[.-]*$/i, '').toLowerCase(),
    );
    expect(repoRefs.filter((r) => !publicRepos.includes(r)), 'repo refs not public').toEqual([]);
    const reports = entries.map((e) => e.library?.report).filter((r) => r !== undefined);
    const unknown = reports.filter(
      (r) =>
        !/^private research repo docs\/\S+ @ [0-9a-f]{7,40}$/.test(r) &&
        r !== 'n/a' &&
        !r.startsWith('the-night-house '),
    );
    const forms = '"private research repo docs/<path> @ <commit>", "n/a", "the-night-house <note>"';
    expect(unknown, `library.report must be one of: ${forms}`).toEqual([]);
  });

  // The shape guard above can't see the name alone in free text (a note, a quote). A digest
  // catches that without this file spelling the name; a literal here would publish it. This
  // deters accidental leaks only: the digest isn't a secret, and a good guess can be confirmed.
  it('holds no token matching the private repo name', () => {
    const privateNameSha256 = 'c04dabf6cf8bbcae7215a99dc0cc32225bbe7c45d7073aa12d6684e71ef92c31';
    // Every text type the repo uses or could plausibly add; binaries are left out on purpose.
    const files = import.meta.glob<string>(
      [
        '/*.md',
        '/{docs,scripts,src}/**/*.{astro,css,html,js,json,md,mdx,mjs,svg,ts,yaml,yml}',
        '/.github/**/*.{yaml,yml}',
      ],
      { query: '?raw', import: 'default', eager: true },
    );
    // Without this, a pattern that matched nothing would pass forever.
    for (const known of [
      '/CLAUDE.md',
      '/docs/glossary-sources.json',
      '/scripts/og-card.mjs',
      '/src/content/glossary.md',
      '/.github/workflows/deploy.yml',
    ]) {
      expect(Object.keys(files)).toContain(known);
    }
    // Every run of adjacent hyphen-separated parts, so "<name>-notes" still counts as a match.
    const hyphenRuns = (token: string) => {
      const parts = token.split('-');
      return parts.flatMap((_, i) =>
        parts.slice(i).map((__, n) => parts.slice(i, i + n + 1).join('-')),
      );
    };
    const holdsName = (text: string) =>
      new Set(text.toLowerCase().split(/[^a-z0-9-]+/).flatMap(hyphenRuns)).values().some(
        (run) => createHash('sha256').update(run).digest('hex') === privateNameSha256,
      );
    const leaking = Object.keys(files).filter((path) => holdsName(files[path]));
    expect(leaking, 'these files hold the private repo name').toEqual([]);
  });
});
