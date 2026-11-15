// Runs the review workflow's real gate steps the way Actions does (bash -e, no pipefail) against
// a stub gh. A workflow edit gets no Claude review and no live run before it lands, so this is
// the only thing that exercises these steps ahead of the merge they guard.
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const workflow = parse(
  readFileSync(new URL('../../.github/workflows/claude-code-review.yml', import.meta.url), 'utf8'),
);

const stepScript = (job: string, name: string): string => {
  const steps: { name?: string; run?: string }[] = workflow.jobs[job].steps;
  const run = steps.find((step) => step.name === name)?.run;
  if (!run) throw new Error(`no run script for ${job} / ${name}`);
  return run;
};

const dir = mkdtempSync(join(tmpdir(), 'review-workflow-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const STUB_GH = `#!/bin/bash
case "$1 $2" in
  "pr view")
    [[ "$*" == *"--json isDraft --jq .isDraft"* ]] || { echo "stub gh: bad flags $*" >&2; exit 9; }
    [ "$DRAFT" = fail ] && { echo "gh: HTTP 502" >&2; exit 1; }
    echo "$DRAFT" ;;
  "pr merge") echo "$*" >>"$GH_LOG" ;;
  "pr list")
    # Open PRs using the branch: OPEN_BASE / OPEN_HEAD per side ("fail" = an API error).
    [[ "$*" == *"--state open --json number --jq length"* ]] ||
      { echo "stub gh: bad flags $*" >&2; exit 9; }
    case "$*" in
      *--base*) n=\${OPEN_BASE:-0} ;;
      *--head*) n=\${OPEN_HEAD:-0} ;;
      *) echo "stub gh: no side in $*" >&2; exit 9 ;;
    esac
    [ "$n" = fail ] && { echo "gh: HTTP 502" >&2; exit 1; }
    echo "$n" ;;
  "api -X") echo "$*" >>"$GH_LOG"; exit "\${DELETE_RC:-0}" ;;
  "api "*git/ref/heads/main) echo "$MAIN_NOW" ;;
  "api "*)
    # The canned JSON is the slurped shape, so the call has to ask for that shape.
    [[ "$*" == *"--paginate --slurp"* ]] || { echo "stub gh: bad flags $*" >&2; exit 9; }
    [ "$COMMENTS_JSON" = fail ] && { echo "gh: HTTP 502" >&2; exit 1; }
    printf '%s' "$COMMENTS_JSON" ;;
  *) echo "stub gh: unexpected $*" >&2; exit 9 ;;
esac
`;
const STUB_GIT = `#!/bin/bash
[ "$1" = diff ] && exit "\${WORKFLOW_DIFF_RC:-0}"
exit 0
`;
writeFileSync(join(dir, 'gh'), STUB_GH);
writeFileSync(join(dir, 'git'), STUB_GIT);
chmodSync(join(dir, 'gh'), 0o755);
chmodSync(join(dir, 'git'), 0o755);

const logPath = join(dir, 'gh.log');

const runStep = (script: string, env: Record<string, string>) => {
  const scriptPath = join(dir, 'step.sh');
  writeFileSync(scriptPath, script);
  writeFileSync(logPath, '');
  const result = spawnSync('bash', ['-e', scriptPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${dir}${delimiter}${process.env.PATH}`,
      GH_LOG: logPath,
      ...env,
    },
  });
  return {
    passed: result.status === 0,
    output: `${result.stdout}${result.stderr}`,
    calls: readFileSync(logPath, 'utf8'),
  };
};

describe('Verify the review passed', () => {
  const head = 'a'.repeat(40);
  const other = 'b'.repeat(40);
  const since = '2026-11-02T09:00:00Z';

  const comment = (body: string, overrides = {}) => ({
    user: { login: 'claude[bot]' },
    created_at: '2026-11-02T10:00:00Z',
    body,
    ...overrides,
  });

  const verify = (comments: object[], env: Record<string, string> = {}) =>
    runStep(stepScript('claude-review', 'Verify the review passed'), {
      BASE: 'main',
      SINCE: since,
      SHA: head,
      COMMENTS: 'comments',
      COMMENTS_JSON: JSON.stringify([comments]),
      ...env,
    });

  it('keeps a BLOCK from an earlier run of the same commit standing', () => {
    const { passed, output } = verify([
      comment(`VERDICT: BLOCK ${head}`, { created_at: '2026-11-02T08:00:00Z' }),
      comment(`VERDICT: PASS ${head}`),
    ]);
    expect(output).toContain('critical, high or medium');
    expect(passed).toBe(false);
  });

  it('lets a new commit pass after a BLOCK of the old one', () => {
    const { passed } = verify([
      comment(`VERDICT: BLOCK ${other}`, { created_at: '2026-11-02T08:00:00Z' }),
      comment(`VERDICT: PASS ${head}`),
    ]);
    expect(passed).toBe(true);
  });

  it('does not take a PASS from an earlier run', () => {
    const { passed, output } = verify([
      comment(`VERDICT: PASS ${head}`, { created_at: '2026-11-02T08:00:00Z' }),
      comment('A reply with no verdict.'),
    ]);
    expect(output).toContain('No VERDICT line');
    expect(passed).toBe(false);
  });

  it('holds when the comments cannot be read', () => {
    const { passed, output } = verify([], { COMMENTS_JSON: 'fail' });
    expect(output).toContain('without posting a comment');
    expect(output).not.toContain('bad flags');
    expect(passed).toBe(false);
  });

  it('ends the job when jq fails partway, rather than judging the comments before it', () => {
    const { passed, output } = verify([
      comment(`VERDICT: PASS ${head}`),
      { user: { login: 'claude[bot]' }, created_at: '2026-11-02T10:01:00Z', body: null },
      comment(`VERDICT: BLOCK ${head}`, { created_at: '2026-11-02T10:02:00Z' }),
    ]);
    expect(output).not.toContain('passed.');
    expect(passed).toBe(false);
  });

  it('holds a PR that changes this workflow, and names the hand merge', () => {
    const { passed, output } = verify([comment(`VERDICT: PASS ${head}`)], {
      WORKFLOW_DIFF_RC: '1',
    });
    expect(output).toContain('repo-ruleset merge');
    expect(passed).toBe(false);
  });

  it('passes on a PASS naming the head', () => {
    const { passed, output } = verify([comment(`Looks fine.\n\nVERDICT: PASS ${head}\n`)]);
    expect(output).toContain(`Review of ${head} passed.`);
    expect(passed).toBe(true);
  });

  it('holds on a BLOCK naming the head', () => {
    const { passed, output } = verify([comment(`VERDICT: BLOCK ${head}`)]);
    expect(output).toContain('critical, high or medium');
    expect(passed).toBe(false);
  });

  it('keeps a BLOCK standing when a later comment says PASS', () => {
    const { passed, output } = verify([
      comment(`VERDICT: BLOCK ${head}`),
      comment(`VERDICT: PASS ${head}`, { created_at: '2026-11-02T10:05:00Z' }),
    ]);
    expect(output).toContain('critical, high or medium');
    expect(passed).toBe(false);
  });

  it('ignores a BLOCK for another commit', () => {
    const { passed } = verify([
      comment(`VERDICT: BLOCK ${other}`),
      comment(`VERDICT: PASS ${head}`),
    ]);
    expect(passed).toBe(true);
  });

  it('does not take a PASS for another commit', () => {
    const { passed, output } = verify([comment(`VERDICT: PASS ${other}`)]);
    expect(output).toContain('No VERDICT line');
    expect(passed).toBe(false);
  });

  it('does not count a verdict quoted mid-comment', () => {
    const { passed, output } = verify([comment(`VERDICT: PASS ${head}\nmore text`)]);
    expect(output).toContain('No VERDICT line');
    expect(passed).toBe(false);
  });

  it('reads through bold wrapping and CRLF line ends', () => {
    const { passed } = verify([comment(`Fine.\r\n**VERDICT: PASS ${head}**\r\n`)]);
    expect(passed).toBe(true);
  });

  it('ignores comments from before the review and from other authors', () => {
    const { passed, output } = verify([
      comment(`VERDICT: PASS ${head}`, { created_at: '2026-11-02T08:00:00Z' }),
      comment(`VERDICT: PASS ${head}`, { user: { login: 'someone' } }),
    ]);
    expect(output).toContain('without posting a comment');
    expect(passed).toBe(false);
  });
});

describe('Merge', () => {
  const merge = (draft: string, mainNow = 'main-sha') =>
    runStep(stepScript('automerge', 'Merge'), {
      DRAFT: draft,
      MAIN_NOW: mainNow,
      MAIN_SHA: 'main-sha',
      HEAD_REF: 'some-branch',
      PR: '7',
      REPO: 'o/r',
      SHA: 'head-sha',
    });

  it('merges a ready PR, pinned to the reviewed head', () => {
    const { passed, calls } = merge('false');
    expect(calls).toContain('pr merge 7 --repo o/r --rebase --match-head-commit head-sha');
    expect(passed).toBe(true);
  });

  it.each(['true', 'fail'])('holds when the draft re-read gives %s', (draft) => {
    const { passed, calls } = merge(draft);
    expect(calls).not.toContain('pr merge');
    expect(passed).toBe(false);
  });

  it('holds when main moved after the combined build', () => {
    const { passed, calls, output } = merge('false', 'newer-sha');
    expect(output).toContain('main moved');
    expect(calls).not.toContain('pr merge');
    expect(passed).toBe(false);
  });
});

describe('Delete the merged branch', () => {
  const del = (env: Record<string, string> = {}) =>
    runStep(stepScript('automerge', 'Delete the merged branch'), {
      HEAD_REF: 'some-branch',
      DEFAULT_BRANCH: 'main',
      REPO: 'o/r',
      ...env,
    });

  it('deletes a branch no open PR uses', () => {
    const { passed, calls } = del();
    expect(calls).toContain('api -X DELETE repos/o/r/git/refs/heads/some-branch --silent');
    expect(passed).toBe(true);
  });

  it.each([
    ['the default branch', { HEAD_REF: 'main' }, 'Head is the default branch'],
    ['a name with # in it', { HEAD_REF: 'fix#1' }, 'has # or % in its name'],
    ['a name with % in it', { HEAD_REF: 'a%2Fb' }, 'has # or % in its name'],
    ['a branch another open PR is based on', { OPEN_BASE: '1' }, 'as their base; kept'],
    ['a branch another open PR comes from', { OPEN_HEAD: '1' }, 'as their head; kept'],
    ['a branch whose open PRs cannot be listed', { OPEN_BASE: 'fail' }, 'Could not list'],
  ])('keeps %s, without failing the job', (_, env, reason) => {
    const { passed, calls, output } = del(env);
    expect(calls).not.toContain('DELETE');
    expect(output).toContain(reason);
    expect(passed).toBe(true);
  });

  it('only warns when the delete is refused, since the merge already happened', () => {
    const { passed, calls, output } = del({ DELETE_RC: '1' });
    expect(calls).toContain('DELETE');
    expect(output).toContain('Could not delete some-branch');
    expect(passed).toBe(true);
  });
});
