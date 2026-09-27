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
const commandTimeoutMs = 15000;
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

// Every page must answer before any screenshot: a server that never came up fails here.
for (const page of pages) {
  const expected = page === '/404.html' ? 404 : 200;
  const { status } = await fetch(base + page).catch((error) => {
    throw new Error(`${base}${page} is unreachable: ${error.message}`);
  });
  if (status !== expected && status !== 200) {
    throw new Error(`${base}${page} answered HTTP ${status}`);
  }
}

const chrome = spawn(
  chromeCmd,
  [...chromeArgs, '--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars',
    `--user-data-dir=${join(process.cwd(), '.chrome-profile')}`, 'about:blank'],
  { stdio: ['ignore', 'ignore', 'pipe'] },
);
// Chrome's last words, reported if it dies before the run finishes.
let chromeStderr = '';
let finished = false;
chrome.stderr.on('data', (chunk) => (chromeStderr = (chromeStderr + chunk).slice(-2000)));
chrome.on('error', (error) => {
  console.error(`Couldn't start Chrome ("${chromeCmd}"): ${error.message}. Set CHROME.`);
  process.exit(1);
});
chrome.on('exit', (code, signal) => {
  if (finished) return;
  console.error(`Chrome exited early (code ${code}, signal ${signal}). Its stderr:`);
  console.error(chromeStderr);
  process.exit(1);
});

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
  // Only replies to our own numbered commands; Chrome's events carry no id.
  if (Number.isInteger(msg.id) && pending.has(msg.id)) {
    const settle = pending.get(msg.id);
    pending.delete(msg.id);
    settle(msg);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Chrome didn't answer ${method} within ${commandTimeoutMs / 1000}s`));
    }, commandTimeoutMs);
    pending.set(id, (m) => {
      clearTimeout(timer);
      if (m.error) reject(new Error(`${method}: ${JSON.stringify(m.error)}`));
      else resolve(m.result);
    });
    ws.send(JSON.stringify({ id, method, params }));
  });

// Waits for the page to finish loading (fonts and images included), then a moment for layout.
const loaded = async () => {
  for (let i = 0; i < 40; i++) {
    const { result } = await send('Runtime.evaluate', {
      expression: 'document.readyState === "complete" && document.fonts.status === "loaded"',
      returnByValue: true,
    });
    if (result.value) return;
    await sleep(250);
  }
  throw new Error('page did not finish loading within 10s');
};

mkdirSync(outDir, { recursive: true });
for (const page of pages) {
  for (const size of sizes) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: size.width,
      height: size.height,
      deviceScaleFactor: 1,
      mobile: size.mobile,
    });
    const { errorText } = await send('Page.navigate', { url: base + page });
    if (errorText) throw new Error(`${page}: ${errorText}`);
    await loaded();
    await sleep(300);
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const file = `${slug(page)}-${size.name}.png`;
    writeFileSync(join(outDir, file), Buffer.from(data, 'base64'));
    console.log(`${page} ${size.name} → ${file}`);
  }
}

// Stopping the browser through the protocol, since killing a wrapper (flatpak) can leave it up.
finished = true;
const browser = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
const browserWs = new WebSocket(browser.webSocketDebuggerUrl);
await new Promise((resolve) => browserWs.addEventListener('open', resolve));
browserWs.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
await sleep(500);
ws.close();
chrome.kill();
