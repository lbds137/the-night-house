---
id: TASK-2
title: Workflow-change check may misfire after a pin bump
status: Deferred
assignee: []
created_date: '2026-11-19T21:29:00Z'
labels:
  - workflow
  - deferred
dependencies: []
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The review workflow's 'changes the workflow' check diffs the merge ref against current main; after an Actions pin bump lands on main it may misfire on an open PR. Only seen from reading the code; never reproduced. Trigger: the first misfire.
<!-- SECTION:DESCRIPTION:END -->
