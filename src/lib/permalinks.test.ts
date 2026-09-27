import { describe, expect, it } from 'vitest';
import rulesMarkdown from '../content/rules.md?raw';
import { renderMarkdown } from './markdown';
import { numberRules } from './permalinks';

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

  it('numbers the real rules the same way Markdown does', () => {
    const count = (rulesMarkdown.match(/^\d+\. /gm) ?? []).length;
    const out = numberRules(renderMarkdown(rulesMarkdown));
    expect(count).toBeGreaterThan(0);
    expect(out).toContain(`id="rule-${count}"`);
    expect(out).not.toContain(`id="rule-${count + 1}"`);
  });
});
