// @ts-check
import { defineConfig } from 'astro/config';
import checkLinks from './src/integrations/check-links.ts';

// Served from the custom domain in public/CNAME, so `base` stays unset.
export default defineConfig({
  site: 'https://thenighthouse.org',
  trailingSlash: 'always',
  integrations: [checkLinks()],
});
