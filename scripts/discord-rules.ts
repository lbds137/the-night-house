// Prints each rule as a block: the `/edit rule` invocation to run, then the text to paste into
// its modal field (rule_edit, the text command, retired 2026-10-01; modals store text verbatim).
// Usage: pnpm discord:rules [N ...]   (no N: every rule)
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { parseChannelIds, ruleEditBlocks } from '../src/lib/discord.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

const numbers: number[] = [];
for (const arg of process.argv.slice(2)) {
  // pnpm passes `--` through (`pnpm discord:rules -- 5`), unlike npm.
  if (arg === '--') continue;
  if (/^\d+$/.test(arg)) {
    numbers.push(Number(arg));
  } else {
    throw new Error(`Not a rule number: ${arg}`);
  }
}

const blocks = ruleEditBlocks(
  read('../src/content/rules.md'),
  parseChannelIds(parse(read('../src/data/discord-channels.yaml'))),
  numbers,
);
// Blank line between blocks: each rule stays one copy-paste unit.
console.log(blocks.join('\n\n'));
