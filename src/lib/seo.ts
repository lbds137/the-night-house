/**
 * JSON for a `<script type="application/ld+json">` element. `<` becomes `<` (still the
 * same JSON value) so no string in the data can close the script element early.
 */
export const jsonLd = (data: object) => JSON.stringify(data).replaceAll('<', '\\u003c');

/**
 * Site paths for page files from `import.meta.glob('./**\/*.astro')` in src/pages: nested
 * index pages map to their folder. The 404 page and dynamic routes (`[slug].astro`) are left
 * out, since they aren't pages a search engine should list.
 */
export function pagePaths(files: string[]): string[] {
  return files
    .map((file) => file.replace(/^\.\//, '').replace(/\.astro$/, ''))
    .filter((name) => name !== '404' && !name.includes('['))
    .map((name) => {
      const path = name.replace(/(^|\/)index$/, '');
      return path === '' ? '/' : `/${path}/`;
    })
    .sort();
}

/**
 * A glossary entry's definition as plain text: the bold term (and an alias in parentheses right
 * after it), Markdown marks and list bullets removed, and links reduced to their text.
 */
export const plainDefinition = (markdown: string) =>
  markdown
    .replace(/^\*\*[^*]+\*\*\s*(\([^)]*\))?\s*:\s*/, '')
    // Before the mark removal below, which would otherwise eat a URL's underscores.
    // A URL may hold one level of parentheses (Wikipedia's "Foo_(bar)"); a title may follow it.
    .replace(/\[([^\]]+)\]\((?:[^()\s]|\([^()\s]*\))+(?:\s+"[^"]*")?\)/g, '$1')
    .replace(/^\* /gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
