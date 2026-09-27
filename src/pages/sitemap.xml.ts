import type { APIRoute } from 'astro';

// Every page in src/pages except the 404 page, which search engines shouldn't list.
const pages = Object.keys(import.meta.glob('./*.astro'))
  .map((file) => file.slice(2, -'.astro'.length))
  .filter((name) => name !== '404')
  .map((name) => (name === 'index' ? '/' : `/${name}/`))
  .sort();

export const GET: APIRoute = ({ site }) => {
  const urls = pages.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
