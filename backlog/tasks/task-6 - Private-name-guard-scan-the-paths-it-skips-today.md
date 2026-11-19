---
id: TASK-6
title: 'Private-name guard: scan the paths it skips today'
status: Done
assignee: []
created_date: '2026-11-19T21:29:00Z'
updated_date: '2026-11-19T21:40:00Z'
labels:
  - tests
dependencies: []
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The private-repo-name digest guard in src/content/glossary.test.ts doesn't scan public/, root *.mjs/*.json, .github/*.md or *.txt. Never put the name in as a literal; the guard stays a digest. Trigger: the next edit to that test.
<!-- SECTION:DESCRIPTION:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped in branch guard-backlog. The digest guard in src/content/glossary.test.ts now also scans: root *.{json,mjs,txt}; .github/**/*.md; public/ text files plus CNAME; backlog/**/*.{md,yml} (claude-review finding 1 on #126); and .claude/settings.json (only the tracked file, not settings.local.json or worktrees/). Each new pattern has a known file in the positive-control list. Probe: with the digest swapped for a token found only in settings.json, the test failed on that file alone.

Follow-up (claude-review on #127): positive controls added for astro.config.mjs, pnpm-lock.yaml, LICENSE, .gitignore, site.webmanifest and browserconfig.xml, plus a shape check that backlog/tasks/*.md matched. The guard now also scans LICENSE, .gitignore and root *.yaml/*.yml. Root *.txt and .github/**/*.md are forward-looking (no file yet). Correction: #127's description wrongly claimed every new pattern had a control.
<!-- SECTION:FINAL_SUMMARY:END -->
