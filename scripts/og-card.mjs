// Renders public/og-card.png, the 1200×630 preview image Discord and other sites show for links
// to the site. Run with `node scripts/og-card.mjs` after changing the logo or the site's name.
// Text is rendered with the system's fonts, so Noto Sans and Noto Sans Hebrew must be installed.
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const logo = await sharp(readFileSync(new URL('src/assets/logo.png', root)))
  .resize(470, 470)
  .png()
  .toBuffer();

// Colors from src/styles/global.css.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="glow" cx="0.3" cy="0.5" r="0.7">
      <stop offset="0" stop-color="#b62e21" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#b62e21" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#000000"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <image href="data:image/png;base64,${logo.toString('base64')}"
    x="70" y="80" width="470" height="470"/>
  <g font-family="Noto Sans" fill="#f2f3f5">
    <text x="590" y="250" font-size="64" font-weight="700">The Night House</text>
    <text x="590" y="340" font-size="56" font-weight="700" font-family="Noto Sans Hebrew"
      fill="#d6402f">בית הלילה</text>
    <text x="590" y="420" font-size="32" fill="#dbdee1">An inclusive Left Hand Path</text>
    <text x="590" y="462" font-size="32" fill="#dbdee1">occult community on Discord</text>
    <text x="590" y="540" font-size="26" fill="#949ba4">thenighthouse.org</text>
  </g>
</svg>`;

const out = new URL('public/og-card.png', root).pathname;
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
console.log('wrote public/og-card.png');
