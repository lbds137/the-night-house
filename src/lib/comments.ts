// No imports, so plain `node` scripts (scripts/discord-rules.ts) can load it as well as Vite.

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
