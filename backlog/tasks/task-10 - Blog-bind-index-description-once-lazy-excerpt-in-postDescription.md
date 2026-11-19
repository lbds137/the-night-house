---
id: TASK-10
title: 'Blog: bind index description once; lazy excerpt in postDescription'
status: To Do
assignee: []
created_date: '2026-11-19T22:51:00Z'
labels: []
dependencies: []
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From blog #35's review (2 Lows, build-time perf only, output unchanged). (1) src/pages/index.astro calls frontMatterDescription(post) twice per post (guard + content): bind it once in the map callback. (2) src/lib.ts postDescription now always computes excerpt() even when the front-matter description wins (my #35 refactor made it eager; the old || was lazy): return frontMatterDescription(post) first, build the excerpt only after. Stopped the review loop at round 3 (#33, #34, #35).
<!-- SECTION:DESCRIPTION:END -->
