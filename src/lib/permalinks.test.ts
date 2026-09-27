import { describe, expect, it } from 'vitest';
import glossaryMarkdown from '../content/glossary.md?raw';
import rulesMarkdown from '../content/rules.md?raw';
import { parseGlossary } from './glossary';
import { renderMarkdown } from './markdown';
import { linkCrossReferences, numberRules, withPermalink } from './permalinks';

describe('numberRules', () => {
  it('numbers each item and adds a permalink inside its first paragraph', () => {
    const html = '<ol>\n<li><p><strong>One</strong></p>\n</li>\n<li><p>Two</p>\n</li>\n</ol>';
    const out = numberRules(html);
    expect(out).toContain('<li id="rule-1"><p><a class="permalink" href="#rule-1"');
    expect(out).toContain('<li id="rule-2"><p><a class="permalink" href="#rule-2"');
    expect(out).toContain('aria-label="Link to rule 2"');
  });

  it('handles tight list items without paragraphs', () => {
    expect(numberRules('<ol><li>One</li></ol>')).toContain('<li id="rule-1"><a class="permalink"');
  });

  it('refuses nested or extra lists, which would shift the numbering', () => {
    expect(() => numberRules('<ol><li>One<ol><li>a</li></ol></li></ol>')).toThrow(/one ordered/);
    expect(() => numberRules('<ol><li>One<ul><li>a</li></ul></li></ol>')).toThrow(/one ordered/);
  });

  it('refuses an item with attributes, which the numbering would skip', () => {
    expect(() => numberRules('<ol><li>One</li><li class="task">Two</li></ol>')).toThrow(
      /attributes/,
    );
  });

  it('numbers the real rules the same way Markdown does', () => {
    const count = (rulesMarkdown.match(/^\d+\. /gm) ?? []).length;
    const out = numberRules(renderMarkdown(rulesMarkdown));
    expect(count).toBeGreaterThan(0);
    expect(out).toContain(`id="rule-${count}"`);
    expect(out).not.toContain(`id="rule-${count + 1}"`);
  });
});

describe('withPermalink', () => {
  it('puts the link at the start of the first paragraph', () => {
    const html = '<p><strong>Egregore</strong>: a group.</p>';
    expect(withPermalink(html, 'egregore', 'Egregore')).toBe(
      '<p><a class="permalink" href="#egregore" aria-label="Link to Egregore">#</a> ' +
        '<strong>Egregore</strong>: a group.</p>',
    );
  });

  it('refuses an entry that does not open with a paragraph', () => {
    expect(() => withPermalink('<ul><li>x</li></ul>', 'x', 'X')).toThrow(/paragraph/);
  });

  it('escapes the label so a quote in a term cannot end the attribute', () => {
    expect(withPermalink('<p>x</p>', 'x', 'The "Void" & <more>')).toContain(
      'aria-label="Link to The &quot;Void&quot; &amp; &lt;more>"',
    );
  });
});

describe('linkCrossReferences', () => {
  const slugs = new Map([
    ['upg', 'upg'],
    ['sanguinarian vampirism', 'sanguinarian-vampirism'],
  ]);

  it('links "(see X)" and "(compare X)" to the named entries', () => {
    expect(linkCrossReferences('an insight (see UPG) and (compare Sanguinarian vampirism)', slugs))
      .toBe(
        'an insight (see [UPG](#upg)) and ' +
          '(compare [Sanguinarian vampirism](#sanguinarian-vampirism))',
      );
  });

  it('refuses a reference to a term that has no entry', () => {
    expect(() => linkCrossReferences('(see Therian)', slugs)).toThrow(/Therian/);
  });

  it('matches a reference within one line only', () => {
    const md = 'first (see the notes\nbelow) and more';
    expect(linkCrossReferences(md, slugs)).toBe(md);
  });

  it('resolves every reference in the real glossary', () => {
    const { entries } = parseGlossary(glossaryMarkdown);
    const bySlug = new Map(entries.map((e) => [e.term.toLowerCase(), e.slug]));
    const linked = entries.map((e) => linkCrossReferences(e.markdown, bySlug)).join('\n');
    expect(linked).toContain('(see [UPG](#upg))');
  });
});
