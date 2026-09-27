import { describe, expect, it } from 'vitest';
import { filterMatches, foldForSearch } from './search';

describe('foldForSearch', () => {
  it('ignores accents, case and extra whitespace', () => {
    expect(foldForSearch('  Santería\n  and  ÁSATRÚ ')).toBe('santeria and asatru');
  });
});

describe('filterMatches', () => {
  const texts = ['Santería: an Afro-Cuban religion.', 'Egregore: a group entity.'].map(
    foldForSearch,
  );

  it('keeps everything for an empty or blank query', () => {
    expect(filterMatches(texts, '')).toEqual([true, true]);
    expect(filterMatches(texts, '   ')).toEqual([true, true]);
  });

  it('matches without accents or case, anywhere in the entry', () => {
    expect(filterMatches(texts, 'SANTERIA')).toEqual([true, false]);
    expect(filterMatches(texts, 'group')).toEqual([false, true]);
    expect(filterMatches(texts, 'nothing like this')).toEqual([false, false]);
  });
});
