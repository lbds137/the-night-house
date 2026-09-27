import { describe, expect, it } from 'vitest';
import commandsPage from '../pages/commands.astro?raw';
import { RESERVED_IDS, checkCommandGroups, commandGroups, type CommandGroup } from './commands';
import { fixedIds } from './testing/fixed-ids';

const group = (commands: CommandGroup['commands'], id = 'misc'): CommandGroup => ({
  id,
  name: 'Misc',
  commands,
});
const command = (name: string, usage: string[], message?: boolean) => ({
  name,
  usage,
  text: 'Does a thing.',
  ...(message ? { message } : {}),
});

describe('commands.yaml', () => {
  it('lists the member commands', () => {
    const names = commandGroups.flatMap((g) => g.commands.map((c) => c.name));
    expect(names).toContain('define');
    expect(names).toContain('gematria');
    // Staff tools and the commands other commands call stay off the page.
    for (const hidden of ['embed_exec', 'db', 'message_link', 'log_user', 'rule_edit']) {
      expect(names).not.toContain(hidden);
    }
  });

  // The page's own ids share the anchor space with the groups and commands.
  it('reserves every fixed id the Commands page renders', () => {
    const { ids, components } = fixedIds(commandsPage);
    expect(components).toContain('PermalinkCopier.astro');
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.filter((id) => !RESERVED_IDS.includes(id))).toEqual([]);
  });
});

describe('checkCommandGroups', () => {
  it('accepts slash usage with and without arguments, and example messages', () => {
    const groups = [
      group([command('define', ['/define <term>', '/define']), command('hex', ['#ff0000'], true)]),
    ];
    expect(checkCommandGroups(groups)).toBe(groups);
  });

  it('refuses usage that does not start with the command', () => {
    expect(() => checkCommandGroups([group([command('define', ['/defines x'])])])).toThrow(
      `define's usage "/defines x" should be "/define"`,
    );
    expect(() => checkCommandGroups([group([command('define', ['define x'])])])).toThrow(
      'should be "/define"',
    );
  });

  it('refuses a slash command or a blank line as a message example', () => {
    for (const line of ['/hex', '', ' ']) {
      expect(() => checkCommandGroups([group([command('hex', [line], true)])])).toThrow(
        'should be an example message',
      );
    }
  });

  it('refuses reused and reserved anchors', () => {
    const twice = [group([command('rule', ['/rule'])]), group([command('rule', ['/rule'])], 'b')];
    expect(() => checkCommandGroups(twice)).toThrow('command "rule" reuses the anchor "rule"');
    expect(() => checkCommandGroups([group([command('content', ['/content'])])])).toThrow(
      'reuses the anchor "content"',
    );
    expect(() => checkCommandGroups([group([command('misc', ['/misc'])])])).toThrow(
      'command "misc" reuses the anchor "misc"',
    );
  });

  it('refuses bad names, ids, and empty entries', () => {
    expect(() => checkCommandGroups([group([command('Define', ['/Define'])])])).toThrow(
      'is not a command name',
    );
    expect(() => checkCommandGroups([group([command('rule', ['/rule'])], 'Misc Stuff')])).toThrow(
      'needs a kebab-case id',
    );
    expect(() => checkCommandGroups([group([])])).toThrow('group "Misc" is empty');
    expect(() => checkCommandGroups([group([command('rule', [])])])).toThrow('rule has no usage');
    expect(() =>
      checkCommandGroups([group([{ name: 'rule', usage: ['/rule'], text: ' ' }])]),
    ).toThrow('rule has no text');
  });
});
