/** A built page: its site path ("/glossary/") and HTML. */
export interface BuiltPage {
  path: string;
  html: string;
}

// Whitespace before the name, so data-href, data-src, xlink:href or data-id don't count.
const LINK = /\s(href|src|srcset)="([^"]*)"/g;
const ID = /\sid="([^"]+)"/g;

const srcsetUrls = (value: string) => value.split(',').map((c) => c.trim().split(/\s+/)[0]);

/** Site-internal URLs in a page: `/...` paths and `#anchors`, from href, src and srcset. */
export function internalLinks(html: string): string[] {
  const links: string[] = [];
  for (const [, attribute, value] of html.matchAll(LINK)) {
    const urls = attribute === 'srcset' ? srcsetUrls(value) : [value];
    links.push(...urls.filter((url) => /^[/#]/.test(url) && !url.startsWith('//')));
  }
  return links;
}

const decode = (fragment: string) => {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
};

/**
 * Internal links that lead nowhere: a page or file that wasn't built, or an `#anchor` that no
 * element on the target page has as its id. `files` holds every other built file's path.
 */
export function findBrokenLinks(pages: BuiltPage[], files: Set<string>): string[] {
  const idsByPage = new Map(
    pages.map((page) => [page.path, new Set([...page.html.matchAll(ID)].map((m) => m[1]))]),
  );
  const broken: string[] = [];
  for (const page of pages) {
    for (const link of new Set(internalLinks(page.html))) {
      // Everything after the first "#" is the fragment, even if it holds another "#".
      const hash = link.indexOf('#');
      const rawPath = hash === -1 ? link : link.slice(0, hash);
      const fragment = hash === -1 ? '' : link.slice(hash + 1);
      const path = rawPath === '' ? page.path : rawPath.split('?')[0];
      const ids = idsByPage.get(path);
      if (!ids && !files.has(path)) {
        broken.push(`${page.path}: ${link} (no such page or file)`);
      } else if (fragment && !ids) {
        broken.push(`${page.path}: ${link} (an #anchor on a file, which has no ids)`);
      } else if (fragment && !ids?.has(decode(fragment))) {
        broken.push(`${page.path}: ${link} (no element with id "${fragment}")`);
      }
    }
  }
  return broken;
}
