import { describe, expect, it } from 'vitest';
import {
  categoriesWithNodes,
  groupCategories,
  groupsWithCategories,
  type CategoryWithNodes,
  type RoleCategory,
  type RoleGroup,
} from './roles';

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

describe('groupCategories', () => {
  const categories: RoleCategory[] = [
    { id: 'pronouns', name: 'Pronouns' },
    { id: 'staff', name: 'Staff' },
    { id: 'empty', name: 'Empty' },
  ];
  const role = (categoryId: string) => ({
    type: 'role' as const,
    category_id: categoryId,
    id: '1',
    name: 'Role',
    color: '000000',
  });
  // `empty` has no roles, so it needn't be in a group.
  const withNodes: CategoryWithNodes[] = categories
    .filter((c) => c.id !== 'empty')
    .map((category) => ({ category, nodes: [role(category.id)] }));
  const group = (id: string, ids: string[]): RoleGroup => ({ id, name: id, categories: ids });

  it('returns groups in order, with their categories in order', () => {
    const result = groupCategories(
      [group('you', ['pronouns']), group('server', ['staff'])],
      categories,
      withNodes,
    );
    expect(result.map((g) => [g.group.id, g.categories.map((c) => c.category.id)])).toEqual([
      ['you', ['pronouns']],
      ['server', ['staff']],
    ]);
  });

  it('drops a group whose categories have no roles', () => {
    const result = groupCategories(
      [group('you', ['pronouns', 'staff']), group('nothing', ['empty'])],
      categories,
      withNodes,
    );
    expect(result.map((g) => g.group.id)).toEqual(['you']);
  });

  it.each([
    ['a category with roles in no group', [group('you', ['pronouns'])], 'no group for staff'],
    [
      'a category in two groups',
      [group('a', ['pronouns', 'staff']), group('b', ['staff'])],
      'category "staff" is in two groups',
    ],
    [
      'an unknown category',
      [group('a', ['pronouns', 'staff', 'nope'])],
      'no category "nope" in categories.yaml',
    ],
    [
      'two groups with one id',
      [group('a', ['pronouns']), group('a', ['staff'])],
      'two groups use id "a"',
    ],
    [
      "a group id that is a category's anchor",
      [group('staff', ['pronouns', 'staff'])],
      'group id "staff" is also a category\'s anchor',
    ],
  ])('rejects %s', (_, groups, message) => {
    expect(() => groupCategories(groups, categories, withNodes)).toThrow(message);
  });
});
