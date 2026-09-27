import { describe, expect, it } from 'vitest';
import { SITE_TITLE, titleParts } from './site';

describe('titleParts', () => {
  it('splits the site title into its halves and separator', () => {
    expect(titleParts(SITE_TITLE)).toEqual([
      { text: 'The Night House', separator: false, hebrew: false },
      { text: '|', separator: true, hebrew: false },
      { text: 'בית הלילה', separator: false, hebrew: true },
    ]);
  });

  it('splits a Discord server name that uses "·"', () => {
    expect(titleParts('Gay Night House · בית לילה גאה')).toEqual([
      { text: 'Gay Night House', separator: false, hebrew: false },
      { text: '·', separator: true, hebrew: false },
      { text: 'בית לילה גאה', separator: false, hebrew: true },
    ]);
  });

  it('keeps a name without a separator whole', () => {
    expect(titleParts('The Night House')).toEqual([
      { text: 'The Night House', separator: false, hebrew: false },
    ]);
  });

  it('leaves a separator inside a word alone', () => {
    expect(titleParts('A|B')).toEqual([{ text: 'A|B', separator: false, hebrew: false }]);
  });
});
