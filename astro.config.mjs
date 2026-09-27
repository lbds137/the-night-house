// @ts-check
import { defineConfig } from 'astro/config';

// Served from the custom domain in public/CNAME, so `base` stays unset.
export default defineConfig({
  site: 'https://thenighthouse.org',
  trailingSlash: 'always',
});
