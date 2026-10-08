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
    expect(names).toContain('hebrew');
    expect(names).toContain('color');
    expect(names).toContain('pointer');
    expect(names).toContain('unhiatus');
    expect(names).toContain('view_avatar');
    expect(names).toContain('expand_emoji');
    // Staff tools and the commands other commands call stay off the page.
    for (const hidden of ['embed_exec', 'db', 'message_link', 'log_user', 'rule_edit']) {
      expect(names).not.toContain(hidden);
    }
    // The fleet is slash-first: the text twins are gone as entries.
    for (const retired of [
      'contrast',
      'contrasts',
      'rand_color',
      'atbash',
      'alefbet',
      'pyramid',
      'rand_hebrew',
      'message_pointer',
    ]) {
      expect(names).not.toContain(retired);
    }
  });

  // Retired and renamed commands live on as alias anchors, so old /commands/# links keep working.
  it('keeps the old anchors alive as aliases', () => {
    const aliases = commandGroups.flatMap((g) => g.commands.flatMap((c) => c.aliases ?? []));
    for (const old of [
      'contrast',
      'contrasts',
      'rand_color',
      'atbash',
      'alefbet',
      'pyramid',
      'rand_hebrew',
      'message_pointer',
    ]) {
      expect(aliases).toContain(old);
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

  it('accepts an invoked form instead of usage lines', () => {
    const menu = 'right-click a user → Apps → View Avatar';
    const groups = [group([{ name: 'view_avatar', text: 'Does a thing.', invoked: menu }])];
    expect(checkCommandGroups(groups)).toBe(groups);
  });

  it('refuses an invoked form with usage lines or message mode', () => {
    expect(() =>
      checkCommandGroups([group([{ name: 'x', text: 't', invoked: 'a menu', usage: ['/x'] }])]),
    ).toThrow('both usage lines and an invoked form');
    expect(() =>
      checkCommandGroups([group([{ name: 'x', text: 't', invoked: 'a menu', message: true }])]),
    ).toThrow('both a message command and an invoked one');
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

  describe('grouped slash commands', () => {
    const sub = (name: string, usage: string[]) => ({ name, usage, text: 'Does a thing.' });
    const grouped = (name: string, subcommands: ReturnType<typeof sub>[]) => ({
      name,
      subcommands,
    });

    it('accepts a root whose subcommands each carry usage and text', () => {
      const groups = [
        group([
          grouped('color', [sub('contrast', ['/color contrast <color>']), sub('hex', ['/color hex <color>'])]),
        ]),
      ];
      expect(checkCommandGroups(groups)).toBe(groups);
    });

    it('refuses a root that also carries usage, text, message mode or an invoked form', () => {
      const subs = [sub('hex', ['/color hex <c>'])];
      expect(() =>
        checkCommandGroups([group([{ name: 'color', usage: ['/color'], subcommands: subs }])]),
      ).toThrow('has both usage lines and subcommands');
      expect(() =>
        checkCommandGroups([group([{ name: 'color', text: 't', subcommands: subs }])]),
      ).toThrow('has both its own text and subcommands');
      expect(() =>
        checkCommandGroups([group([{ name: 'color', message: true, subcommands: subs }])]),
      ).toThrow('is both a message command and a grouped one');
      expect(() =>
        checkCommandGroups([group([{ name: 'color', invoked: 'a menu', subcommands: subs }])]),
      ).toThrow('has both an invoked form and subcommands');
      expect(() =>
        checkCommandGroups([group([{ name: 'color', subcommands: [] }])]),
      ).toThrow('has no subcommands');
    });

    it('refuses subcommand usage under another name and repeated subcommands', () => {
      expect(() =>
        checkCommandGroups([group([grouped('color', [sub('hex', ['/color hexes <color>'])])])]),
      ).toThrow('should be "/color hex"');
      expect(() =>
        checkCommandGroups([
          group([
            grouped('color', [sub('hex', ['/color hex <c>']), sub('hex', ['/color hex <c>'])]),
          ]),
        ]),
      ).toThrow('repeats the subcommand "hex"');
    });

    it('refuses subcommands with no usage or no text', () => {
      expect(() =>
        checkCommandGroups([group([grouped('color', [sub('hex', [])])])]),
      ).toThrow('color hex has no usage');
      expect(() =>
        checkCommandGroups([
          group([
            { name: 'color', subcommands: [{ name: 'hex', usage: ['/color hex'], text: ' ' }] },
          ]),
        ]),
      ).toThrow('color hex has no text');
    });

    it('refuses a bad or colliding alias', () => {
      expect(() =>
        checkCommandGroups([group([{ name: 'rule', usage: ['/rule'], text: 't', aliases: ['Rand Color'] }])]),
      ).toThrow('is not an anchor alias');
      expect(() =>
        checkCommandGroups([
          group([command('rule', ['/rule'])]),
          group([{ name: 'color', aliases: ['rule'], subcommands: [] }], 'b'),
        ]),
      ).toThrow('alias "rule" of "color" reuses the anchor "rule"');
    });
  });
});
