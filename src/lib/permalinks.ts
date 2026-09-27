/** The small "#" link that points at its own anchor; PermalinkCopier also copies its URL. */
export const permalink = (id: string, label: string) =>
  `<a class="permalink" href="#${id}" aria-label="Link to ${label}">#</a>`;

/**
 * Gives each item of the rules' single ordered list the anchor `rule-N` and a permalink, so
 * staff can link "see rule 5" as /rules/#rule-5. The rules must stay one flat list of plain
 * `<li>` items: nesting, or an item with attributes the numbering would skip, fails the build.
 */
export function numberRules(html: string): string {
  if ((html.match(/<ol[\s>]/g) ?? []).length !== 1 || /<ul[\s>]/.test(html)) {
    throw new Error('rules.md: expected exactly one ordered list and no other lists');
  }
  if (/<li\s/.test(html)) {
    throw new Error('rules.md: a list item has attributes, so it would not be numbered');
  }
  let n = 0;
  return html.replace(/<li>(\s*<p>)?/g, (_, p = '') => {
    n += 1;
    return `<li id="rule-${n}">${p}${permalink(`rule-${n}`, `rule ${n}`)} `;
  });
}

/** Puts a permalink at the start of an entry's first paragraph. */
export function withPermalink(html: string, id: string, label: string): string {
  if (!html.startsWith('<p>')) {
    throw new Error(`"${label}" does not start with a paragraph, so it has no place for its link`);
  }
  return `<p>${permalink(id, label)} ${html.slice('<p>'.length)}`;
}

/**
 * Turns "(see X)" and "(compare X)" in a glossary entry into links to entry X. Every reference
 * must name an entry (case-insensitive), so a renamed or dropped term fails the build instead of
 * leaving a dead pointer.
 */
export function linkCrossReferences(markdown: string, slugByTerm: Map<string, string>): string {
  return markdown.replace(/\((see|compare) ([^)]+)\)/g, (_, verb: string, term: string) => {
    const slug = slugByTerm.get(term.toLowerCase());
    if (!slug) throw new Error(`glossary.md: "(${verb} ${term})" names no glossary entry`);
    return `(${verb} [${term}](#${slug}))`;
  });
}
