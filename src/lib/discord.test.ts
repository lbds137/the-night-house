import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import rulesMarkdown from '../content/rules.md?raw';
import channelsYaml from '../data/discord-channels.yaml?raw';
import botRules from './__fixtures__/bot-rules-2026-09-27.json';
import {
  MESSAGE_LIMIT,
  checkBotSafe,
  parseChannelIds,
  parseRules,
  ruleEditLines,
  toDiscord,
} from './discord';

const channels = parseChannelIds(parse(channelsYaml));

describe('site rules → bot rules', () => {
  // The bot's `Rules` entry as Lila dumped it (`db dump Rules`) on 2026-09-27, when it already
  // matched the site. When a rule changes on purpose, paste its `pnpm discord:rules N` line into
  // Discord, then update that rule here from a fresh dump, so this keeps checking the live copy.
  it('reproduces the bot copy exactly', () => {
    const expected = Object.entries(botRules)
      .map(([key, text]) => [Number(key.replace('Rule #', '')), text] as const)
      .sort(([a], [b]) => a - b)
      .map(([, text]) => text);
    const converted = parseRules(rulesMarkdown).map((rule) => toDiscord(rule, channels));
    expect(converted).toEqual(expected);
  });

  it('makes one paste-ready command per rule, each within Discord limits', () => {
    const lines = ruleEditLines(rulesMarkdown, channels);
    expect(lines).toHaveLength(Object.keys(botRules).length);
    expect(lines[4]).toMatch(/^-rule_edit 5 \*\*You are expected.*<#950127079695978598>/);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(MESSAGE_LIMIT);
  });

  it('selects rules and takes another prefix', () => {
    const lines = ruleEditLines(rulesMarkdown, channels, [13, 2], '!');
    expect(lines.map((l) => l.slice(0, 14))).toEqual(['!rule_edit 13 ', '!rule_edit 2 *']);
    expect(() => ruleEditLines(rulesMarkdown, channels, [14])).toThrow('no rule 14');
    expect(() => ruleEditLines(rulesMarkdown, channels, [NaN])).toThrow('no rule NaN');
  });
});

describe('parseRules', () => {
  it('reads a numbered list after an intro, skipping comments', () => {
    expect(parseRules('Intro\n\n---\n\n1. One\n\n<!-- 2. Draft -->\n2. Two\n')).toEqual([
      'One',
      'Two',
    ]);
  });

  it('refuses gaps, wrapped rules and a missing list', () => {
    expect(() => parseRules('1. One\n3. Three')).toThrow('rule 3 follows rule 1');
    expect(() => parseRules('1. One\ncontinued')).toThrow('must be one line');
    expect(() => parseRules('No list')).toThrow('no numbered rules');
  });
});

describe('toDiscord', () => {
  it('turns channel tokens into mentions', () => {
    expect(toDiscord('see !c!polemic-pit!c! now', channels)).toBe(
      'see <#950127079695978598> now',
    );
  });

  it('refuses a channel without an id and tokens it cannot convert', () => {
    expect(() => toDiscord('!c!nowhere!c!', channels)).toThrow('channel "nowhere"');
    expect(() => toDiscord('!r!123!r!', channels)).toThrow('token !r!123!r!');
  });
});

describe('checkBotSafe', () => {
  it('passes plain text and refuses what the bot would alter', () => {
    expect(() => checkBotSafe('**Bold** “curly” _it_ <#1> [a](https://x.y)')).not.toThrow();
    for (const text of ['say "hi"', 'a `code`', 'back\\slash', 'two  spaces', ' lead']) {
      expect(() => checkBotSafe(text)).toThrow('would alter');
    }
  });
});

describe('parseChannelIds', () => {
  it('refuses unquoted or malformed ids', () => {
    expect(() => parseChannelIds(parse('a: 950127079695978598'))).toThrow('quoted numeric id');
    expect(() => parseChannelIds(parse('a: "12"'))).toThrow('quoted numeric id');
    expect(() => parseChannelIds(parse('- a'))).toThrow('expected a map');
  });
});
