import { Marked } from 'marked';
import { markedSmartypants } from 'marked-smartypants';
import { roleById } from './roles';

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

export function roleMention(id: string): string {
  const role = roleById(id);
  return (
    `<span class="mention mention-role" style="--role-color: #${role.color}; ` +
    `--role-text: ${legibleRoleColor(role.color)}">@${escapeHtml(role.name)}</span>`
  );
}

export const channelMention = (name: string) =>
  `<span class="mention mention-channel">#${escapeHtml(name)}</span>`;

// `!c!name!c!` is a channel mention and `!r!<role id>!r!` a role mention (see nodes.yaml).
export function replaceTokens(text: string): string {
  return text
    .replace(/!c!(.+?)!c!/g, (_, name: string) => channelMention(name))
    .replace(/!r!(\d+)!r!/g, (_, id: string) => roleMention(id));
}

// HTML comments hold not-yet-written entries (e.g. in glossary.md); keep them out of the page.
// An opener left in the output (unclosed, or rebuilt from pieces like `<!<!---->--`) would hide
// the rest of the page, so either case fails the build instead.
export function stripComments(text: string): string {
  let output = '';
  let position = 0;
  for (;;) {
    const open = text.indexOf('<!--', position);
    if (open === -1) break;
    const close = text.indexOf('-->', open + 4);
    if (close === -1) {
      throw new Error(`Unclosed HTML comment near: ${text.slice(open, open + 60)}`);
    }
    output += text.slice(position, open);
    position = close + 3;
  }
  output += text.slice(position);
  if (output.includes('<!--')) {
    throw new Error('HTML comment markers combine into a new `<!--` once comments are removed');
  }
  return output;
}

// marked has no attribute-list syntax, so kramdown's `{: ...}` would print as literal text.
function prepare(text: string): string {
  const kramdownAttr = text.match(/\{:[^}]*\}/);
  if (kramdownAttr) {
    throw new Error(`Kramdown attribute syntax isn't supported: ${kramdownAttr[0]}`);
  }
  return replaceTokens(stripComments(text));
}

export const renderMarkdown = (text: string) => marked.parse(prepare(text)) as string;

export const renderInline = (text: string) => marked.parseInline(prepare(text)) as string;
