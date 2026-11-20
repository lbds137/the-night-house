---
id: TASK-7
title: 'Blog automerge: drop the unconditional sleep 30'
status: Deferred
assignee: []
created_date: '2026-11-19T21:29:00Z'
updated_date: '2026-11-20T02:18:00Z'
labels:
  - blog
  - workflow
  - deferred
dependencies: []
priority: medium
ordinal: 10
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
lbds137/blog's claude-code-review.yml (~line 181) still sleeps 30 s, unconditionally, before polling checks: the delay the night-house removed. Fix it the same way (Dependabot-only, or a short first poll). Editing claude-code-review.yml means a hand-merged PR with no CI review, in Chats' repo, so it's Chats' call. Trigger: raise it with Chats, or fold it into the next blog workflow edit. Move it to the blog's store if the blog adopts one.
<!-- SECTION:DESCRIPTION:END -->
