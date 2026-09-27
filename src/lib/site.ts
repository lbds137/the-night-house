export const SITE_TITLE = 'The Night House | בית הלילה';
// Jekyll's SEO tag dropped the pipe from the site name; page titles keep that form.
export const SITE_NAME = 'The Night House בית הלילה';
export const SITE_DESCRIPTION =
  'A friendly and inclusive Left Hand Path / Satanism focused server that is welcome to all, ' +
  'regardless of ethnicity/race, gender identity, sexual orientation, religious practice, etc. ' +
  'and does not tolerate discrimination, bigotry, or harassment.';
export interface TitlePart {
  text: string;
  /** The "|" or "·" between the halves: shown, but not read aloud. */
  separator: boolean;
  hebrew: boolean;
}

/**
 * A bilingual name ("The Night House | בית הלילה", or a Discord server name that uses "·") as
 * its halves and separators, so each half can wrap as a unit and the Hebrew one reads RTL.
 * The browser script in DiscordInvite.astro imports this, so it must stay import-free.
 */
export const titleParts = (title: string): TitlePart[] =>
  title.split(/\s+([|·])\s+/).map((text, i) => ({
    text,
    separator: i % 2 === 1,
    hebrew: /[֐-׿]/.test(text),
  }));

// Keep this on one line: .github/workflows/invite-check.yml reads it with sed.
export const DISCORD_INVITE_CODE = 'v4kjNpF';

/** Link-preview image (Discord, social sites); rendered by scripts/og-card.mjs. */
export const OG_IMAGE = {
  path: '/og-card.png',
  width: 1200,
  height: 630,
  alt: 'The Night House logo, a magenta sigil in a ring of Hebrew letters, beside the name',
};

export interface NavLink {
  title: string;
  href: string;
  external?: boolean;
  /** The community's own profile elsewhere; listed as `sameAs` in the site's structured data. */
  profile?: boolean;
}

export interface NavGroup {
  title: string;
  children: NavLink[];
}

export type NavItem = NavLink | NavGroup;

export const isNavGroup = (item: NavItem): item is NavGroup => 'children' in item;

export const DISCORD_INVITE_URL = `https://discord.com/invite/${DISCORD_INVITE_CODE}`;

// Groups (a dropdown, from the `experimental` branch, d7034d8) are for the planned Resources
// pages, which wait until they have content.
export const MAIN_NAV: NavItem[] = [
  { title: 'Welcome', href: '/' },
  { title: 'Rules', href: '/rules/' },
  { title: 'Guide', href: '/guide/' },
  { title: 'Roles', href: '/roles/' },
  { title: 'Glossary', href: '/glossary/' },
  { title: 'Commands', href: '/commands/' },
];

/** The community elsewhere on the web, listed in the site footer. */
export const FOOTER_LINKS: NavLink[] = [
  {
    title: 'Disboard',
    href: 'https://disboard.org/server/462036216909398026',
    external: true,
    profile: true,
  },
  // A stats dashboard about the server, not a profile of it.
  { title: 'Stats', href: 'https://statbot.net/dashboard/462036216909398026', external: true },
  { title: 'Twitter', href: 'https://twitter.com/TheNightHouse/', external: true, profile: true },
];
