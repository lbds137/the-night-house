---
id: TASK-10
title: 'Blog: bind index description once; lazy excerpt in postDescription'
status: Deferred
assignee: []
created_date: '2026-11-19T22:51:00Z'
updated_date: '2026-11-20T02:18:00Z'
labels:
  - blog
  - deferred
dependencies: []
priority: low
ordinal: 30
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In lbds137/blog (from blog #35's review; 2 Lows, build-time perf only, output unchanged). (1) src/pages/index.astro calls frontMatterDescription(post) twice per post (guard + content): bind it once in the map callback. (2) src/lib.ts postDescription now always computes excerpt() even when the front-matter description wins (my #35 refactor made it eager; the old || was lazy): return frontMatterDescription(post) first, build the excerpt only after. The review loop stopped at round 3 (#33, #34, #35). The blog is Chats' repo; Night House builds there when called in. Trigger: fold it into the next blog code edit by either session. Move it to the blog's store if the blog adopts one.
<!-- SECTION:DESCRIPTION:END -->
