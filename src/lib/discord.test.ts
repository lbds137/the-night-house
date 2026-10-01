import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import rulesMarkdown from '../content/rules.md?raw';
import channelsYaml from '../data/discord-channels.yaml?raw';
import botRules from './__fixtures__/bot-rules-2026-09-27.json';
import {
  MODAL_LIMIT,
  parseChannelIds,
  parseRules,
  ruleEditBlocks,
  toDiscord,
} from './discord';

const channels = parseChannelIds(parse(channelsYaml));

describe('site rules → bot rules', () => {
  // The bot's `Rules` entry as Lila dumped it (`db dump Rules`) on 2026-09-27, when it already
  // matched the site. When a rule changes on purpose, paste its `pnpm discord:rules N` text
  // into the /edit modal, then update that rule here from a fresh dump, so this keeps checking
  // the live copy.
  it('reproduces the bot copy exactly', () => {
    const expected = Object.entries(botRules)
      .map(([key, text]) => [Number(key.replace('Rule #', '')), text] as const)
      .sort(([a], [b]) => a - b)
      .map(([, text]) => text);
    const converted = parseRules(rulesMarkdown).map((rule) => toDiscord(rule, channels));
    expect(converted).toEqual(expected);
  });

  it('makes one modal-ready block per rule: the /edit invocation, then the text', () => {
    const blocks = ruleEditBlocks(rulesMarkdown, channels);
    expect(blocks).toHaveLength(Object.keys(botRules).length);
    const converted = parseRules(rulesMarkdown).map((rule) => toDiscord(rule, channels));
    expect(blocks.map((block) => block.split('\n')[1])).toEqual(converted);
    expect(blocks[4]).toMatch(
      /^Rule 5 — \/edit rule rule:5, paste over the field's text:\n\*\*You are expected.*<#950127079695978598>/,
    );
    for (const block of blocks) {
      expect([...block.split('\n')[1]].length).toBeLessThanOrEqual(MODAL_LIMIT);
    }
  });

  it('selects rules', () => {
    const blocks = ruleEditBlocks(rulesMarkdown, channels, [13, 2]);
    expect(blocks[0]).toMatch(/^Rule 13 — /);
    expect(blocks[1]).toMatch(/^Rule 2 — /);
    expect(() => ruleEditBlocks(rulesMarkdown, channels, [14])).toThrow('no rule 14');
    expect(() => ruleEditBlocks(rulesMarkdown, channels, [NaN])).toThrow('no rule NaN');
  });

  it('refuses a rule too long for the modal field', () => {
    const long = `1. ${'x'.repeat(MODAL_LIMIT + 1)}`;
    expect(() => ruleEditBlocks(long, channels)).toThrow('max 4000');
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
    expect(() => toDiscord('!r!123!r!', channels)).toThrow('token !r!');
    // A lone marker (no closing !r!) escapes the pair-shaped token regex; it must still fail.
    expect(() => toDiscord('!r!123 no closer', channels)).toThrow('token !r!');
    expect(() => toDiscord('!c!constructor!c!', channels)).toThrow('channel "constructor"');
  });
});

describe('parseChannelIds', () => {
  it('refuses unquoted or malformed ids', () => {
    expect(() => parseChannelIds(parse('a: 950127079695978598'))).toThrow('quoted numeric id');
    expect(() => parseChannelIds(parse('a: "12"'))).toThrow('quoted numeric id');
    expect(() => parseChannelIds(parse('- a'))).toThrow('expected a map');
  });
});
