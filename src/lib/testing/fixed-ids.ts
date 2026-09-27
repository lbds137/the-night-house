// Test helper (Vite-only: import.meta.glob). A page's anchors share the id space with the fixed
// ids its layout and components render, so each page's tests check those against its reserved
// list.
import baseLayout from '../../layouts/Base.astro?raw';

const components = import.meta.glob<string>('../../components/*.astro', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * The literal `id="..."` values a page renders: from the Base layout, the page source, and every
 * component those import, followed transitively. Also returns which components that was.
 */
export function fixedIds(pageSource: string): { ids: string[]; components: string[] } {
  const rendered = new Set<string>();
  const visit = (source: string) => {
    for (const [, name] of source.matchAll(/(\w+)\.astro['"]/g)) {
      const path = `../../components/${name}.astro`;
      if (components[path] !== undefined && !rendered.has(path)) {
        rendered.add(path);
        visit(components[path]);
      }
    }
  };
  visit(baseLayout + pageSource);
  const source = [baseLayout, pageSource, ...[...rendered].map((path) => components[path])];
  const ids = [...source.join('\n').matchAll(/\bid="([^"{}]+)"/g)].map((m) => m[1]);
  return { ids, components: [...rendered].map((path) => path.replace('../../components/', '')) };
}
