import { describe, expect, it } from 'vitest';
import {
  MENTION_BACKGROUND,
  MIN_CONTRAST,
  contrastRatio,
  legibleRoleColor,
  renderInline,
  renderMarkdown,
} from './markdown';
import { nodes, type RoleNode } from './roles';

const MODERATOR = '499037360340598819'; // color 8b0000
const ADMIN = '804156307560071178'; // color 1c1c1c, near-black
const DEAD_CHAT = '857988434454773770'; // name has a straight apostrophe

describe('mention tokens', () => {
  it('renders a channel mention pill', () => {
    expect(renderInline('see !c!polemic-pit!c! first')).toBe(
      'see <span class="mention mention-channel">#polemic-pit</span> first',
    );
  });

  it('escapes HTML in channel names', () => {
    expect(renderInline('!c!<b>!c!')).toContain('#&lt;b&gt;');
  });

  it('renders a role mention in the role color', () => {
    const html = renderInline(`!r!${MODERATOR}!r!`);
    expect(html).toContain('class="mention mention-role"');
    expect(html).toContain('--role-color: #8b0000');
    expect(html).toContain('@Moderator | מתווך');
  });

  it('handles adjacent role and channel tokens', () => {
    const html = renderInline(`!r!${MODERATOR}!r!!c!roles!c!`);
    expect(html).toContain('@Moderator | מתווך</span><span class="mention mention-channel">#roles');
  });

  it('applies smart quotes to role names', () => {
    expect(renderInline(`!r!${DEAD_CHAT}!r!`)).toContain('@Dead Chat | צ&#8217;אט מת');
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
    const roles = nodes.filter((node): node is RoleNode => node.type === 'role');
    expect(roles.length).toBeGreaterThan(200);
    for (const role of roles) {
      const color = legibleRoleColor(role.color);
      expect(contrastRatio(color, MENTION_BACKGROUND), role.name).toBeGreaterThanOrEqual(
        MIN_CONTRAST,
      );
    }
  });

  it('uses the lightened color for the near-black Admin role', () => {
    expect(renderInline(`!r!${ADMIN}!r!`)).toContain(`--role-text: ${legibleRoleColor('1c1c1c')}`);
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
