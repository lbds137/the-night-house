---
id: TASK-1
title: 'Confirm the faster automerge path from #124 on the next PR'
status: To Do
assignee: []
created_date: '2026-11-19T21:29:00Z'
labels:
  - workflow
dependencies: []
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
#124 (merged 8295ae1) runs combined-build in parallel with the review, drops the old 30 s sleep before automerge, and adds a guarded head-branch delete. Trigger: the next PR opens (any, Dependabot included). Check: combined-build ran in parallel with claude-review, automerge fired without the sleep, and the guarded delete ran. Commands: gh run list --branch <head>, gh run list --branch main --workflow deploy.yml.
<!-- SECTION:DESCRIPTION:END -->
