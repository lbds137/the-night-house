import { describe, expect, it } from 'vitest';
import {
  MENTION_BACKGROUND,
  MIN_CONTRAST,
  channelPill,
  contrastRatio,
  legibleRoleColor,
  renderInline,
  renderMarkdown,
} from './markdown';
import { nodes, type RoleNode } from './roles';

const DARK_RED = '604740881471242253'; // color 8b0000
const BLACK = '546393036255526912'; // color 1c1c1c, near-black
const MODERATOR = '499037360340598819'; // no color
const DEAD_CHAT = '857988434454773770'; // name has a straight apostrophe

describe('mention tokens', () => {
  it('renders a channel mention pill', () => {
    expect(renderInline('see !c!polemic-pit!c! first')).toBe(
      'see <span class="mention mention-channel">#polemic-pit</span> first',
    );
  });

  it('escapes HTML in channel names', () => {
    expect(channelPill('<b>')).toContain('#&lt;b&gt;');
  });

  it('fails on a channel name that is not in discord-channels.yaml', () => {
    expect(() => renderInline('!c!nowhere!c!')).toThrow('No Discord id for channel "nowhere"');
  });

  it('fails on a lone channel marker', () => {
    expect(() => renderInline('oops !c! unclosed')).toThrow('Unmatched token marker');
  });

  it('fails on a lone role marker', () => {
    expect(() => renderInline('!r!497610586750976020 unclosed')).toThrow('Unmatched token marker');
  });

  it('refuses a name that collides with Object.prototype', () => {
    expect(() => renderInline('!c!constructor!c!')).toThrow(
      'No Discord id for channel "constructor"',
    );
  });

  it('renders a role mention in the role color', () => {
    const html = renderInline(`!r!${DARK_RED}!r!`);
    expect(html).toContain('class="mention mention-role"');
    expect(html).toContain('--role-color: #8b0000');
    expect(html).toContain('@<span class="mention-part">Dark Red</span></span>');
  });

  it('renders a role with no color as a default mention', () => {
    expect(renderInline(`!r!${MODERATOR}!r!`)).toBe(
      '<span class="mention mention-role-default">@<span class="mention-part">Moderator</span> ' +
        '<span aria-hidden="true">|</span> ' +
        '<span class="mention-part" lang="he" dir="rtl">מתווך</span></span>',
    );
  });

  it('keeps a one-language role name as a single unbreakable part', () => {
    const html = renderInline(`!r!${DARK_RED}!r!`);
    expect(html.match(/class="mention-part"/g)).toHaveLength(1);
    expect(html).not.toContain('aria-hidden');
  });

  it('handles adjacent role and channel tokens', () => {
    const html = renderInline(`!r!${MODERATOR}!r!!c!roles!c!`);
    expect(html).toContain('מתווך</span></span><span class="mention mention-channel">#roles');
  });

  it('applies smart quotes to role names', () => {
    expect(renderInline(`!r!${DEAD_CHAT}!r!`)).toContain(
      'lang="he" dir="rtl">צ&#8217;אט מת</span>',
    );
  });

  it('fails on an unknown role id', () => {
    expect(() => renderInline('!r!123!r!')).toThrow('No role with id 123');
  });
});

describe('role colors', () => {
  it('leaves an already legible color alone', () => {
    expect(legibleRoleColor('ffffff')).toBe('#ffffff');
  });

  it('lightens a near-black color to AA contrast', () => {
    const color = legibleRoleColor('1c1c1c');
    expect(color).not.toBe('#1c1c1c');
    expect(contrastRatio(color, MENTION_BACKGROUND)).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  it('gives every role in nodes.yaml an AA-contrast mention color', () => {
    const colored = nodes.filter(
      (node): node is RoleNode & { color: string } => node.type === 'role' && !!node.color,
    );
    expect(colored.length).toBeGreaterThan(150);
    for (const role of colored) {
      const color = legibleRoleColor(role.color);
      expect(contrastRatio(color, MENTION_BACKGROUND), role.name).toBeGreaterThanOrEqual(
        MIN_CONTRAST,
      );
    }
  });

  it('uses the lightened color for the near-black Black role', () => {
    expect(renderInline(`!r!${BLACK}!r!`)).toContain(`--role-text: ${legibleRoleColor('1c1c1c')}`);
  });
});

describe('HTML comments', () => {
  it('removes comments, including multi-line ones', () => {
    expect(renderMarkdown('before\n\n<!--\nHidden\nTerms\n-->\n\nafter')).not.toContain('Hidden');
  });

  it('fails on an unclosed comment', () => {
    expect(() => renderMarkdown('text <!-- never closed')).toThrow('Unclosed HTML comment');
  });

  it('fails when stripping would rebuild an opener', () => {
    expect(() => renderMarkdown('a<!<!---->--b')).toThrow('combine into a new');
  });
});

describe('links and legacy syntax', () => {
  it('opens external links in a new tab', () => {
    expect(renderInline('[Discord](https://discord.com/terms)')).toBe(
      '<a href="https://discord.com/terms" target="_blank" rel="noopener">Discord</a>',
    );
  });

  it('keeps internal links in the same tab', () => {
    expect(renderInline('[Rules](/rules/)')).toBe('<a href="/rules/">Rules</a>');
  });

  it('fails on kramdown attribute syntax', () => {
    expect(() => renderInline('[x](https://example.com){: target="_blank"}')).toThrow(
      "Kramdown attribute syntax isn't supported",
    );
  });
});
