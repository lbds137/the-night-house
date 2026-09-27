// Prints paste-ready `-rule_edit N <text>` commands that set the bot's rules to the site's.
// Usage: pnpm discord:rules [N ...] [--prefix=<bot prefix>]   (no N: every rule)
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { parseChannelIds, ruleEditLines } from '../src/lib/discord.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

let prefix: string | undefined;
const numbers: number[] = [];
for (const arg of process.argv.slice(2)) {
  // pnpm passes `--` through (`pnpm discord:rules -- 5`), unlike npm.
  if (arg === '--') continue;
  if (arg.startsWith('--prefix=')) {
    if (prefix !== undefined) throw new Error('Give --prefix only once');
    prefix = arg.slice('--prefix='.length);
  } else if (/^\d+$/.test(arg)) {
    numbers.push(Number(arg));
  } else {
    throw new Error(`Not a rule number or --prefix=<prefix>: ${arg}`);
  }
}

const lines = ruleEditLines(
  read('../src/content/rules.md'),
  parseChannelIds(parse(read('../src/data/discord-channels.yaml'))),
  numbers,
  prefix ?? '-',
);
// Blank line between commands: each one is its own Discord message.
console.log(lines.join('\n\n'));
