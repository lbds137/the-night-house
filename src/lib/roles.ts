import { parse } from 'yaml';
import categoriesYaml from '../data/roles/categories.yaml?raw';
import groupsYaml from '../data/roles/groups.yaml?raw';
import nodesYaml from '../data/roles/nodes.yaml?raw';

export interface RoleCategory {
  id: string;
  name: string;
}

export interface RoleGroup {
  id: string;
  name: string;
  /** Category ids, in page order. */
  categories: string[];
}

export interface RoleNode {
  type: 'role';
  category_id: string;
  id: string;
  name: string;
  color: string;
  text?: string;
  /** Slug of the glossary entry for this role's practice or identity, linked under its text. */
  glossary?: string;
}

export interface NoteNode {
  type: 'note';
  category_id: string;
  text: string;
}

export type CategoryNode = RoleNode | NoteNode;

export const categories: RoleCategory[] = parse(categoriesYaml);
export const nodes: CategoryNode[] = parse(nodesYaml);

for (const node of nodes) {
  if (node.type !== 'role' && node.type !== 'note') {
    const type = JSON.stringify((node as { type: unknown }).type);
    throw new Error(`nodes.yaml: unknown node type ${type}`);
  }
  if (node.type === 'role' && !/^[0-9a-fA-F]{6}$/.test(String(node.color))) {
    const color = JSON.stringify(node.color);
    throw new Error(`nodes.yaml: role ${node.id} color must be 6 hex digits, got ${color}`);
  }
}

const rolesById = new Map(
  nodes.filter((node): node is RoleNode => node.type === 'role').map((role) => [role.id, role]),
);

export function roleById(id: string): RoleNode {
  const role = rolesById.get(id);
  if (!role) throw new Error(`No role with id ${id} in nodes.yaml`);
  return role;
}

export const groups: RoleGroup[] = parse(groupsYaml);

// Same anchor as Jekyll's `slugify` of the name, so existing /roles/#... links keep working.
export const categoryAnchor = (category: RoleCategory) =>
  category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface CategoryWithNodes {
  category: RoleCategory;
  nodes: CategoryNode[];
}

export function categoriesWithNodes(): CategoryWithNodes[] {
  return categories
    .map((category) => ({
      category,
      nodes: nodes.filter((node) => node.category_id === category.id),
    }))
    .filter(({ nodes }) => nodes.length > 0);
}

export interface GroupWithCategories {
  group: RoleGroup;
  categories: CategoryWithNodes[];
}

/**
 * Sorts categories (the ones with roles in `withNodes`) into groups, checking that every such
 * category is in exactly one group, that groups name only real categories, and that group ids
 * are unique and differ from every category anchor.
 */
export function groupCategories(
  groupList: RoleGroup[],
  allCategories: RoleCategory[],
  withNodes: CategoryWithNodes[],
): GroupWithCategories[] {
  const byId = new Map(withNodes.map((c) => [c.category.id, c]));
  const known = new Set(allCategories.map((c) => c.id));
  const anchors = new Set(allCategories.map(categoryAnchor));
  const placed = new Set<string>();
  const groupIds = new Set<string>();
  for (const group of groupList) {
    if (anchors.has(group.id)) {
      throw new Error(`groups.yaml: group id "${group.id}" is also a category's anchor`);
    }
    if (groupIds.has(group.id)) throw new Error(`groups.yaml: two groups use id "${group.id}"`);
    groupIds.add(group.id);
    for (const id of group.categories) {
      if (!known.has(id)) throw new Error(`groups.yaml: no category "${id}" in categories.yaml`);
      if (placed.has(id)) throw new Error(`groups.yaml: category "${id}" is in two groups`);
      placed.add(id);
    }
  }
  const missing = [...byId.keys()].filter((id) => !placed.has(id));
  if (missing.length > 0) throw new Error(`groups.yaml: no group for ${missing.join(', ')}`);
  return groupList
    .map((group) => ({
      group,
      categories: group.categories.flatMap((id) => byId.get(id) ?? []),
    }))
    .filter(({ categories }) => categories.length > 0);
}

/** The Roles page's groups, each with its categories, from groups.yaml. */
export const groupsWithCategories = () =>
  groupCategories(groups, categories, categoriesWithNodes());
