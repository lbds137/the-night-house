export const SITE_TITLE = 'The Night House | בית הלילה';
// Jekyll's SEO tag dropped the pipe from the site name; page titles keep that form.
export const SITE_NAME = 'The Night House בית הלילה';
export const SITE_DESCRIPTION =
  'A friendly and inclusive Left Hand Path / Satanism focused server that is welcome to all, ' +
  'regardless of ethnicity/race, gender identity, sexual orientation, religious practice, etc. ' +
  'and does not tolerate discrimination, bigotry, or harassment.';
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

// The nested structure comes from the `experimental` branch (d7034d8). Its Resources pages were
// empty stubs, so that group waits until it has content.
export const MAIN_NAV: NavItem[] = [
  { title: 'Welcome', href: '/' },
  {
    title: 'Community',
    children: [
      { title: 'Rules', href: '/rules/' },
      { title: 'Roles', href: '/roles/' },
      { title: 'Glossary', href: '/glossary/' },
    ],
  },
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
