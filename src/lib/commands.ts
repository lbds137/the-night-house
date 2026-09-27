import { parse } from 'yaml';
import commandsYaml from '../data/commands.yaml?raw';

export interface BotCommand {
  /** The command's name in the bot, which is also its /commands/# anchor. */
  name: string;
  /** Ways to use it: `/name ...` lines, or example messages for a `message` command. */
  usage: string[];
  /** Fires on what a message says rather than on `/name`. */
  message?: boolean;
  /** Markdown: what it does. */
  text: string;
}

export interface CommandGroup {
  /** The group's /commands/# anchor. */
  id: string;
  name: string;
  commands: BotCommand[];
}

/** Fixed ids on the Commands page and its components, which no anchor may reuse. */
export const RESERVED_IDS = ['content', 'permalink-status'];

/**
 * Checks the groups the Commands page renders: every anchor unique, and every usage line of a
 * slash command starting with its own name, so a renamed command can't keep a stale example.
 */
export function checkCommandGroups(groups: CommandGroup[]): CommandGroup[] {
  const seen = new Set<string>(RESERVED_IDS);
  const claim = (id: string, what: string) => {
    if (seen.has(id)) throw new Error(`commands.yaml: ${what} reuses the anchor "${id}"`);
    seen.add(id);
  };
  for (const group of groups) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(group.id ?? '')) {
      throw new Error(`commands.yaml: group "${group.name}" needs a kebab-case id`);
    }
    claim(group.id, `group "${group.name}"`);
    if (!group.commands?.length) throw new Error(`commands.yaml: group "${group.name}" is empty`);
    for (const command of group.commands) {
      if (!/^[a-z][a-z0-9_]*$/.test(command.name ?? '')) {
        const name = JSON.stringify(command.name);
        throw new Error(`commands.yaml: ${name} is not a command name (lowercase, digits, _)`);
      }
      claim(command.name, `command "${command.name}"`);
      if (!command.text?.trim()) throw new Error(`commands.yaml: ${command.name} has no text`);
      if (!command.usage?.length) throw new Error(`commands.yaml: ${command.name} has no usage`);
      for (const line of command.usage) {
        const typed = new RegExp(`^/${command.name}( |$)`).test(line);
        const example = line.trim() !== '' && !line.startsWith('/');
        if (command.message ? !example : !typed) {
          const expected = command.message ? 'an example message' : `"/${command.name}"`;
          throw new Error(`commands.yaml: ${command.name}'s usage "${line}" should be ${expected}`);
        }
      }
    }
  }
  return groups;
}

export const commandGroups: CommandGroup[] = checkCommandGroups(parse(commandsYaml));
