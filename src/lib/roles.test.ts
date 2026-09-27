import { describe, expect, it } from 'vitest';
import { categoriesWithNodes, groupsWithCategories } from './roles';

describe('role groups', () => {
  it('put every category with roles in exactly one group', () => {
    const grouped = groupsWithCategories().flatMap(({ categories }) =>
      categories.map(({ category }) => category.id),
    );
    const all = categoriesWithNodes().map(({ category }) => category.id);
    expect([...grouped].sort()).toEqual([...all].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });
});
