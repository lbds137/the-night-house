// Turns the site's rules into the bot's copy (YAGPDB's `Rules` entry, set by `/rule_edit`).
// Only relative `.ts` imports, so `node scripts/discord-rules.ts` can load it without Vite.
import { stripComments } from './comments.ts';

export type ChannelIds = Record<string, string>;

// Discord's message limit for accounts without Nitro; the whole `/rule_edit` line must fit.
export const MESSAGE_LIMIT = 2000;

export function parseChannelIds(parsed: unknown): ChannelIds {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('discord-channels.yaml: expected a map of channel name to id');
  }
  for (const [name, id] of Object.entries(parsed)) {
    // An unquoted id parses as a number and loses its last digits.
    if (typeof id !== 'string' || !/^\d{17,20}$/.test(id)) {
      throw new Error(`discord-channels.yaml: ${name} needs a quoted numeric id, got ${id}`);
    }
  }
  return parsed as ChannelIds;
}

// Each rule is one line of rules.md's single ordered list, numbered 1, 2, 3… in order. The list
// ends the file, so any other text after it (a rule wrapped onto a second line) is refused.
export function parseRules(markdown: string): string[] {
  const rules: string[] = [];
  for (const line of stripComments(markdown).split('\n')) {
    const item = line.match(/^(\d+)\. (.*)$/);
    if (!item) {
      if (rules.length && line.trim()) {
        throw new Error(
          `rules.md: a rule must be one line; found after rule ${rules.length}: ${line}`,
        );
      }
      continue;
    }
    if (Number(item[1]) !== rules.length + 1) {
      throw new Error(`rules.md: rule ${item[1]} follows rule ${rules.length}`);
    }
    rules.push(item[2].trim());
  }
  if (rules.length === 0) throw new Error('rules.md: no numbered rules found');
  return rules;
}

// Site tokens → Discord syntax: `!c!name!c!` becomes a channel mention `<#id>`.
export function toDiscord(text: string, channels: ChannelIds): string {
  const converted = text.replace(/!c!(.+?)!c!/g, (_, name: string) => {
    const id = channels[name];
    if (!id) throw new Error(`No Discord id for channel "${name}" in discord-channels.yaml`);
    return `<#${id}>`;
  });
  const leftover = converted.match(/!r!.*?!r!|!c!/);
  if (leftover) throw new Error(`No Discord form for the token ${leftover[0]}`);
  return converted;
}

// YAGPDB splits a command on single spaces, eats `\` as an escape and groups words in `"` or
// `` ` ``, then rejoins the last argument with single spaces. Text free of those characters and of
// doubled spaces comes through unchanged; anything else would be stored altered.
export function checkBotSafe(text: string): void {
  const bad = text.match(/["`\\]| {2}|^\s|\s$/);
  if (bad) {
    throw new Error(`The bot's argument parser would alter ${JSON.stringify(bad[0])} in: ${text}`);
  }
}

export function ruleEditLines(
  markdown: string,
  channels: ChannelIds,
  only: number[] = [],
  prefix = '/',
): string[] {
  const rules = parseRules(markdown);
  for (const n of only) {
    if (!Number.isInteger(n) || n < 1 || n > rules.length) {
      throw new Error(`There is no rule ${n} (rules.md has ${rules.length})`);
    }
  }
  const wanted = only.length ? only : rules.map((_, i) => i + 1);
  return wanted.map((n) => {
    const text = toDiscord(rules[n - 1], channels);
    checkBotSafe(text);
    const line = `${prefix}rule_edit ${n} ${text}`;
    if (line.length > MESSAGE_LIMIT) {
      throw new Error(`Rule ${n} is ${line.length} characters as a command (max ${MESSAGE_LIMIT})`);
    }
    return line;
  });
}
