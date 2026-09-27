# The Night House | בית הלילה

An Astro site, hosted on GitHub Pages, for The Night House Discord server - an inclusive Left Hand Path (LHP) occult community.

🌙 **[Visit the Site](https://thenighthouse.org/)** | 🎮 **[Join our Discord](https://discord.gg/thenighthouse)**

## About

The Night House is an 18+ occult/magick-focused Discord server created specifically for Left Hand Path practitioners. Unlike many LHP communities, we prioritize:

- 🏳️‍⚧️ **Inclusivity**: Welcoming to all regardless of identity or background
- 🚫 **Anti-bigotry**: Zero tolerance for discrimination
- 📚 **Knowledge sharing**: Open exchange of ideas and practices
- 🤝 **Respectful dialogue**: Fostering productive conversations

## Features

- **Welcome Page**: Introduction and Discord invite widget
- **Server Rules**: Comprehensive community guidelines
- **Role System**: Self-assignable Discord server roles documentation
- **Glossary**: Occult and LHP terminology definitions

## Development

### Prerequisites

- Node.js >= 24 (the version the deploy workflow uses)
- pnpm 10 (pinned in `package.json`'s `packageManager`)
- Git

### Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/lbds137/the-night-house.git
   cd the-night-house
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the site locally:
   ```bash
   pnpm dev
   ```

4. Visit `http://localhost:4321` in your browser

`pnpm build` type-checks (`astro check`), runs the tests (`pnpm test` runs them alone) and builds
the site into `dist/`; it's the same command the deploy workflow runs, and pull requests run it as
a check.

### Project Structure

```
├── public/             # Served as-is: CNAME, favicons
├── src/
│   ├── assets/         # Images Astro optimizes at build time (the logo)
│   ├── content/        # Page text in Markdown (welcome, rules, roles intro, glossary)
│   ├── data/roles/     # Role categories and role definitions (YAML)
│   ├── components/     # Header, navigation, role category, Discord invite card
│   ├── layouts/        # Page shell
│   ├── lib/            # Site config and nav, Markdown rendering, roles data
│   ├── pages/          # One file per route
│   └── styles/         # global.css (Discord Onyx-style theme)
└── astro.config.mjs
```

In Markdown and role text, `!c!channel-name!c!` renders a channel mention and `!r!<role id>!r!` a
role mention in that role's color. External links open in a new tab automatically.

### Key Technologies

- **Astro** - Static site generator
- **GitHub Pages** - Hosting, deployed by the `withastro/action` workflow
- **marked** - Markdown rendering for page text and role descriptions
- **TypeScript** - Components and the Discord invite card's live member counts

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines

- Maintain the existing code style
- Test your changes locally before submitting
- Update documentation as needed
- Be respectful and inclusive in all interactions

## Deployment

`.github/workflows/deploy.yml` builds and deploys the site to GitHub Pages on every push to `main`
(the repository's Pages source must be set to "GitHub Actions"). No manual deployment needed!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Discord community members who make The Night House special
- Astro and GitHub Pages teams for excellent tools
- All contributors who help improve this site

---

*"A friendly and inclusive Left Hand Path / Satanism focused server that is welcome to all"*