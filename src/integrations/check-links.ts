import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { type BuiltPage, findBrokenLinks } from '../lib/linkcheck';

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );

/** Fails the build when a built page links to a page, file or #anchor that doesn't exist. */
export default function checkLinks(): AstroIntegration {
  return {
    name: 'check-links',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const pages: BuiltPage[] = [];
        const files = new Set<string>();
        for (const file of walk(root)) {
          const path = `/${relative(root, file).split(sep).join('/')}`;
          if (path.endsWith('.html')) {
            // A folder's index.html is served as the folder: /glossary/index.html → /glossary/.
            const pagePath = path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : path;
            pages.push({ path: pagePath, html: readFileSync(file, 'utf8') });
          } else {
            files.add(path);
          }
        }
        const broken = findBrokenLinks(pages, files);
        if (broken.length > 0) {
          throw new Error(`Broken internal links:\n  ${broken.join('\n  ')}`);
        }
        logger.info(`${pages.length} pages checked, no broken internal links`);
      },
    },
  };
}
