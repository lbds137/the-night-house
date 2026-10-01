import { Marked } from 'marked';
import { markedSmartypants } from 'marked-smartypants';
import { parse } from 'yaml';
import channelsYaml from '../data/discord-channels.yaml?raw';
import { stripComments } from './comments.ts';
import { parseChannelIds } from './discord';
import { roleById } from './roles';
import { titleParts } from './site';

export { stripComments };

// Smart quotes match what kramdown produced on the Jekyll site. External links open in a new
// tab, which the Jekyll content spelled out per link with kramdown's `{:target="_blank"}`.
const marked = new Marked(markedSmartypants(), {
  gfm: true,
  async: false,
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      const newTab = /^https?:\/\//.test(href) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${escapeHtml(href)}"${titleAttr}${newTab}>${text}</a>`;
    },
  },
});

// The surface mentions sit on (--surface-2 in global.css); role colors are
// lightened until they reach WCAG AA contrast against it.
export const MENTION_BACKGROUND = '#1a1a1e';
export const MIN_CONTRAST = 4.5;

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Rgb = [number, number, number];

const parseHex = (hex: string): Rgb => {
  const value = hex.replace(/^#/, '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as Rgb;
};

const toHex = (rgb: Rgb) =>
  '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

const luminance = (rgb: Rgb) => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

export const contrastRatio = (hexA: string, hexB: string) =>
  contrast(parseHex(hexA), parseHex(hexB));

export function legibleRoleColor(hex: string): string {
  const base = parseHex(hex);
  // Integer steps, and the check runs on the rounded hex, so rounding can't dip below the bar.
  for (let step = 0; step <= 20; step++) {
    const candidate = toHex(base.map((c) => c + ((255 - c) * step) / 20) as Rgb);
    if (contrastRatio(candidate, MENTION_BACKGROUND) >= MIN_CONTRAST) return candidate;
  }
  return '#ffffff';
}

// A bilingual role name ("Rare Archive Access | גישה לארכיון נדיר") may wrap between its halves
// but never inside one, so a long name fits a phone screen. Like the site title, the separator
// isn't read aloud and the Hebrew half is marked as Hebrew.
const mentionName = (name: string) =>
  titleParts(name)
    .map(({ text, separator, hebrew }) =>
      separator
        ? `<span aria-hidden="true">${escapeHtml(text)}</span>`
        : `<span class="mention-part"${hebrew ? ' lang="he" dir="rtl"' : ''}>` +
          `${escapeHtml(text)}</span>`,
    )
    .join(' ');

export function roleMention(id: string): string {
  const role = roleById(id);
  if (role.color === undefined) {
    return `<span class="mention mention-role-default">@${mentionName(role.name)}</span>`;
  }
  return (
    `<span class="mention mention-role" style="--role-color: #${role.color}; ` +
    `--role-text: ${legibleRoleColor(role.color)}">@${mentionName(role.name)}</span>`
  );
}

export const channelPill = (name: string) =>
  `<span class="mention mention-channel">#${escapeHtml(name)}</span>`;

// A pill may only name a channel in discord-channels.yaml; anything else fails the build
// like an unknown role id, so a channel rename or a pill typo can't ship silently.
const channelIds = parseChannelIds(parse(channelsYaml));

export const channelMention = (name: string) => {
  if (!channelIds[name]) {
    throw new Error(`No Discord id for channel "${name}" in discord-channels.yaml`);
  }
  return channelPill(name);
};

// `!c!name!c!` is a channel mention and `!r!<role id>!r!` a role mention (see nodes.yaml).
export function replaceTokens(text: string): string {
  return text
    .replace(/!c!(.+?)!c!/g, (_, name: string) => channelMention(name))
    .replace(/!r!(\d+)!r!/g, (_, id: string) => roleMention(id));
}

// marked has no attribute-list syntax, so kramdown's `{: ...}` would print as literal text.
function prepare(text: string): string {
  const kramdownAttr = text.match(/\{:[^}]*\}/);
  if (kramdownAttr) {
    throw new Error(`Kramdown attribute syntax isn't supported: ${kramdownAttr[0]}`);
  }
  const prepared = replaceTokens(stripComments(text));
  // Any surviving marker is an unclosed or mistyped token that would print raw — valid
  // tokens were consumed above with both markers included, so even a lone `!r!` must fail.
  const leftover = prepared.match(/!c!|!r!/);
  if (leftover) throw new Error(`Unmatched token marker in content: ${leftover[0]}`);
  return prepared;
}

export const renderMarkdown = (text: string) => marked.parse(prepare(text)) as string;

export const renderInline = (text: string) => marked.parseInline(prepare(text)) as string;
