import { parse } from 'yaml';
import commandsYaml from '../data/commands.yaml?raw';

export interface BotSubcommand {
  /** The subcommand's name under its root, e.g. "contrast" under /color. */
  name: string;
  /** Ways to use it: `/root sub ...` lines. */
  usage: string[];
  /** Markdown: what it does. */
  text: string;
}

export interface BotCommand {
  /** The command's name in the bot, which is also its /commands/# anchor. */
  name: string;
  /** Ways to use it: `/name ...` lines, or example messages for a `message` command. An
   * invoked (context-menu) command carries none, and a grouped slash command carries none
   * (its subcommands carry the usage lines). */
  usage?: string[];
  /** Fires on what a message says rather than on `/name`. */
  message?: boolean;
  /** A context-menu path: how the member invokes it instead of typing or sending a message. */
  invoked?: string;
  /** Markdown: what it does. A grouped slash command gives each subcommand its own instead. */
  text?: string;
  /** Slash subcommands: the entry renders one row per sub, like Discord's command picker. */
  subcommands?: BotSubcommand[];
  /** Old anchors that now live here, so links to retired or renamed commands keep working. */
  aliases?: string[];
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
 * Checks the groups the Commands page renders: every anchor unique (command names, group ids
 * and old-name aliases share the space), every usage line of a slash command starting with its
 * own name, and grouped slash commands shaped as the page renders them, so a renamed command
 * can't keep a stale example.
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
      const aliases = command.aliases ?? [];
      // YAML accepts `aliases: pyramid` as a scalar; iterating it would check it one character
      // at a time and fail far from the cause.
      if (!Array.isArray(aliases)) {
        throw new Error(
          `commands.yaml: ${command.name}'s aliases must be a list, e.g. ["old_name"]`,
        );
      }
      for (const alias of aliases) {
        if (!/^[a-z][a-z0-9_]*$/.test(alias ?? '')) {
          throw new Error(
            `commands.yaml: ${JSON.stringify(alias)} is not an anchor alias (lowercase, digits, _)`,
          );
        }
        claim(alias, `alias "${alias}" of "${command.name}"`);
      }
      if (command.subcommands) {
        // A grouped slash command renders one row per subcommand, so the entry itself carries
        // no usage, message form, invoked path or text.
        if (!Array.isArray(command.subcommands)) {
          throw new Error(`commands.yaml: ${command.name}'s subcommands must be a list`);
        }
        if (!command.subcommands.length) {
          throw new Error(`commands.yaml: ${command.name} has no subcommands`);
        }
        if (command.usage?.length) {
          throw new Error(`commands.yaml: ${command.name} has both usage lines and subcommands`);
        }
        if (command.message) {
          throw new Error(
            `commands.yaml: ${command.name} is both a message command and a grouped one`,
          );
        }
        if (command.invoked?.trim()) {
          throw new Error(
            `commands.yaml: ${command.name} has both an invoked form and subcommands`,
          );
        }
        if (command.text?.trim()) {
          throw new Error(`commands.yaml: ${command.name} has both its own text and subcommands`);
        }
        const seenSubs = new Set<string>();
        for (const sub of command.subcommands) {
          if (!/^[a-z][a-z0-9_]*$/.test(sub.name ?? '')) {
            const name = JSON.stringify(sub.name);
            throw new Error(
              `commands.yaml: ${command.name}'s subcommand ${name} is not a command name ` +
                '(lowercase, digits, _)',
            );
          }
          if (seenSubs.has(sub.name)) {
            throw new Error(
              `commands.yaml: ${command.name} repeats the subcommand "${sub.name}"`,
            );
          }
          seenSubs.add(sub.name);
          if (!sub.text?.trim()) {
            throw new Error(`commands.yaml: ${command.name} ${sub.name} has no text`);
          }
          if (!sub.usage?.length) {
            throw new Error(`commands.yaml: ${command.name} ${sub.name} has no usage`);
          }
          if (!Array.isArray(sub.usage)) {
            throw new Error(
              `commands.yaml: ${command.name} ${sub.name}'s usage must be a list of strings`,
            );
          }
          for (const line of sub.usage) {
            if (!new RegExp(`^/${command.name} ${sub.name}( |$)`).test(line)) {
              throw new Error(
                `commands.yaml: ${command.name} ${sub.name}'s usage "${line}" should be ` +
                  `"/${command.name} ${sub.name}"`,
              );
            }
          }
        }
      } else if (command.invoked?.trim()) {
        // A context-menu command is neither typed nor fired by a message, so it takes an
        // invoked path and no usage lines.
        if (command.usage?.length) {
          throw new Error(
            `commands.yaml: ${command.name} has both usage lines and an invoked form`,
          );
        }
        if (command.message) {
          throw new Error(
            `commands.yaml: ${command.name} is both a message command and an invoked one`,
          );
        }
        if (!command.text?.trim()) throw new Error(`commands.yaml: ${command.name} has no text`);
      } else {
        if (!command.text?.trim()) throw new Error(`commands.yaml: ${command.name} has no text`);
        if (!command.usage?.length) throw new Error(`commands.yaml: ${command.name} has no usage`);
        if (!Array.isArray(command.usage)) {
          throw new Error(
            `commands.yaml: ${command.name}'s usage must be a list of strings`,
          );
        }
        for (const line of command.usage) {
          const typed = new RegExp(`^/${command.name}( |$)`).test(line);
          const example = line.trim() !== '' && !line.startsWith('/');
          if (command.message ? !example : !typed) {
            const expected = command.message ? 'an example message' : `"/${command.name}"`;
            throw new Error(
              `commands.yaml: ${command.name}'s usage "${line}" should be ${expected}`,
            );
          }
        }
      }
    }
  }
  return groups;
}

export const commandGroups: CommandGroup[] = checkCommandGroups(parse(commandsYaml));
