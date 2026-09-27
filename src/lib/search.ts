// Shared by the build and the browser: keep this module free of imports so the glossary
// page's client script doesn't pull the Markdown pipeline into its bundle.

export const stripAccents = (text: string) => text.normalize('NFD').replace(/\p{Mn}/gu, '');

/** Accent- and case-insensitive, whitespace-collapsed text for the filter box. */
export const foldForSearch = (text: string) =>
  stripAccents(text).toLowerCase().replace(/\s+/g, ' ').trim();

/** Which entries the filter keeps; an empty query keeps them all. */
export function filterMatches(foldedTexts: string[], query: string): boolean[] {
  const needle = foldForSearch(query);
  return foldedTexts.map((text) => needle === '' || text.includes(needle));
}
