import type { APIRoute } from 'astro';
import { pagePaths } from '../lib/seo';

// Every page under src/pages, nested folders included; pagePaths drops the 404 page.
const pages = pagePaths(Object.keys(import.meta.glob('./**/*.astro')));

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
