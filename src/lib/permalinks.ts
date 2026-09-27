/** The small "#" link that points at its own anchor; copy-link.ts also copies its URL on click. */
export const permalink = (id: string, label: string) =>
  `<a class="permalink" href="#${id}" aria-label="Link to ${label}">#</a>`;

/**
 * Gives each item of the rules' single ordered list the anchor `rule-N` and a permalink, so
 * staff can link "see rule 5" as /rules/#rule-5. The rules must stay one flat list: nesting
 * would shift the numbering, so it fails the build instead.
 */
export function numberRules(html: string): string {
  if ((html.match(/<ol[\s>]/g) ?? []).length !== 1 || /<ul[\s>]/.test(html)) {
    throw new Error('rules.md: expected exactly one ordered list and no other lists');
  }
  let n = 0;
  return html.replace(/<li>(\s*<p>)?/g, (_, p = '') => {
    n += 1;
    return `<li id="rule-${n}">${p}${permalink(`rule-${n}`, `rule ${n}`)} `;
  });
}
