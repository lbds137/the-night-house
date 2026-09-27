import { parse } from 'yaml';
import categoriesYaml from '../data/roles/categories.yaml?raw';
import nodesYaml from '../data/roles/nodes.yaml?raw';

export interface RoleCategory {
  id: string;
  name: string;
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
    throw new Error(`nodes.yaml: unknown node type ${JSON.stringify((node as { type: unknown }).type)}`);
  }
  if (node.type === 'role' && !/^[0-9a-fA-F]{6}$/.test(String(node.color))) {
    throw new Error(`nodes.yaml: role ${node.id} color must be 6 hex digits, got ${JSON.stringify(node.color)}`);
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

export function categoriesWithNodes(): { category: RoleCategory; nodes: CategoryNode[] }[] {
  return categories
    .map((category) => ({
      category,
      nodes: nodes.filter((node) => node.category_id === category.id),
    }))
    .filter(({ nodes }) => nodes.length > 0);
}
