// Screenshots the first screen of every built page at phone and desktop width, for the PR
// screenshot comment (.github/workflows/pr-screenshots.yml). Expects the site served at BASE_URL
// (e.g. `pnpm astro preview`) and drives headless Chrome over the DevTools protocol.
//   CHROME="google-chrome" BASE_URL=http://localhost:4321 node scripts/screenshots.mjs out-dir
// Locally on the Deck: CHROME="flatpak run com.google.Chrome".
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const outDir = process.argv[2] ?? 'screenshots';
const base = process.env.BASE_URL ?? 'http://localhost:4321';
const [chromeCmd, ...chromeArgs] = (process.env.CHROME ?? 'google-chrome').split(' ');
const port = 9444;
const sizes = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1280, height: 900, mobile: false },
];

// Pages from the build output: dist/x/index.html → /x/, dist/404.html → /404.html.
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
const pages = walk('dist')
  .filter((f) => f.endsWith('.html'))
  .map((f) => `/${relative('dist', f).split(sep).join('/')}`.replace(/index\.html$/, ''))
  .sort();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const slug = (path) => path.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'home';

const chrome = spawn(
  chromeCmd,
  [...chromeArgs, '--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars',
    `--user-data-dir=${join(process.cwd(), '.chrome-profile')}`, 'about:blank'],
  { stdio: 'ignore' },
);

let target;
for (let i = 0; i < 60 && !target; i++) {
  await sleep(500);
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find((t) => t.type === 'page');
  } catch {
    // Chrome isn't listening yet.
  }
}
if (!target) throw new Error('Chrome did not start');

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve));
let nextId = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  pending.get(msg.id)?.(msg);
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });

mkdirSync(outDir, { recursive: true });
for (const page of pages) {
  for (const size of sizes) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: size.width,
      height: size.height,
      deviceScaleFactor: 1,
      mobile: size.mobile,
    });
    await send('Page.navigate', { url: base + page });
    await sleep(1500);
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const file = `${slug(page)}-${size.name}.png`;
    writeFileSync(join(outDir, file), Buffer.from(data, 'base64'));
    console.log(`${page} ${size.name} → ${file}`);
  }
}

// Stopping the browser through the protocol, since killing a wrapper (flatpak) can leave it up.
const browser = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
const browserWs = new WebSocket(browser.webSocketDebuggerUrl);
await new Promise((resolve) => browserWs.addEventListener('open', resolve));
browserWs.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
await sleep(500);
ws.close();
chrome.kill();
