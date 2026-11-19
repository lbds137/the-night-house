---
id: TASK-9
title: Pin pr-ci-wait's CI anchor and automerge job in .claude/settings.json
status: Done
assignee:
  - night-house
created_date: '2026-11-19T21:40:00Z'
updated_date: '2026-11-19T22:09:00Z'
labels:
  - workflow
dependencies: []
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seen in this repo's pr-ci-wait output on #126 and #127: 'no anchor configured (SYG_CI_ANCHOR unset) — using the quiet-window rule' and 'automerge: no check (SYG_CI_AUTOMERGE_JOB unset)'. The quiet-window rule misses a workflow created after its 90 s window. Seyag pins SYG_CI_ANCHOR and SYG_CI_AUTOMERGE_JOB=automerge. Here the automerge job is 'automerge' in the Claude Code Review workflow; choose the anchor workflow name from .github/workflows, and run pr-ci-wait --help first to confirm what each variable expects. It's a settings.json edit, so name it in the PR.
<!-- SECTION:DESCRIPTION:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Pinned in .claude/settings.json: SYG_CI_ANCHOR="Claude Code Review" (the workflow name; it holds the automerge job, which needs claude-review and combined-build, so it settles last) and SYG_CI_AUTOMERGE_JOB=automerge (the job has no name: override, so its key is its name). Values checked against pr-ci-wait --help. Also folds the review-round-5 nits from #129 (glossary.test.ts comment, TASK-6 summary wording).
<!-- SECTION:FINAL_SUMMARY:END -->
