---
id: TASK-6
title: 'Private-name guard: scan the paths it skips today'
status: Deferred
assignee: []
created_date: '2026-11-19T21:29:00Z'
labels:
  - tests
  - deferred
dependencies: []
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The private-repo-name digest guard in src/content/glossary.test.ts doesn't scan public/, root *.mjs/*.json, .github/*.md or *.txt. Never put the name in as a literal; the guard stays a digest. Trigger: the next edit to that test.
<!-- SECTION:DESCRIPTION:END -->
