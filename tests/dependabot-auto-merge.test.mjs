import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Exercise the actual privileged script without checking out or executing a PR.
const workflow = readFileSync(
  new URL('../.github/workflows/dependabot-auto-merge.yml', import.meta.url),
  'utf8',
);
const blocks = workflow.split('          script: |\n');
assert.equal(blocks.length, 3, 'Expected inline policy and summary scripts');
const script = blocks[1].split('\n      - name:')[0].replace(/^ {12}/gm, '');
const summaryScript = blocks[2].replace(/^ {12}/gm, '');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const applyPolicy = new AsyncFunction('github', 'context', 'core', 'exec', 'process', script);
const summarize = new AsyncFunction('core', 'process', summaryScript);

const dependency = {
  dependencyName: '@astrojs/check',
  packageEcosystem: 'npm_and_yarn',
  directory: '/',
  updateType: 'version-update:semver-patch',
  prevVersion: '0.9.9',
  newVersion: '0.9.12',
};
const statusRule = {
  type: 'required_status_checks',
  parameters: {
    strict_required_status_checks_policy: true,
    required_status_checks: [
      { context: 'Validate', integration_id: 15368 },
      { context: 'Cloudflare Pages', integration_id: 85455 },
    ],
  },
};

function fixture() {
  const pr = {
    number: 14,
    node_id: 'PR_test',
    state: 'open',
    draft: false,
    user: { login: 'dependabot[bot]' },
    base: { ref: 'main' },
    head: { sha: 'a'.repeat(40), repo: { full_name: 'yugook/CalendarToDo-Website' } },
    commits: 1,
    changed_files: 2,
    auto_merge: null,
  };
  const state = {
    pr,
    files: ['package.json', 'package-lock.json'].map((filename) => ({ filename, status: 'modified' })),
    rules: [structuredClone(statusRule), { type: 'pull_request' }, { type: 'required_signatures' }],
    env: {
      AUTO_MERGE_ENABLED: 'true',
      METADATA_OUTCOME: 'success',
      UPDATED_DEPENDENCIES: JSON.stringify([dependency]),
    },
    context: {
      repo: { owner: 'yugook', repo: 'CalendarToDo-Website' },
      payload: { pull_request: structuredClone(pr) },
    },
    commands: [],
    mutations: [],
    messages: [],
    outputs: {},
  };
  const listFiles = () => {};
  state.github = {
    rest: { pulls: { get: async () => ({ data: pr }), listFiles } },
    paginate: async (route) => {
      if (route === listFiles) return state.files;
      assert.equal(route, 'GET /repos/{owner}/{repo}/rules/branches/{branch}');
      return state.rules;
    },
    graphql: async (query, variables) => state.mutations.push({ query, variables }),
  };
  state.run = () => applyPolicy(
    state.github,
    state.context,
    {
      info: (message) => state.messages.push(message),
      setOutput: (name, value) => { state.outputs[name] = value; },
    },
    { exec: async (...command) => state.commands.push(command) },
    { env: state.env },
  );
  return state;
}

test('a verified npm patch requests auto-merge for the exact head without bypass flags', async () => {
  const state = fixture();
  await state.run();
  assert.deepEqual(state.commands, [['gh', [
    'pr', 'merge', '14', '--repo', 'yugook/CalendarToDo-Website',
    '--auto', '--merge', '--match-head-commit', 'a'.repeat(40),
  ]]]);
});

async function summaryFor(state, outcome = 'success', overrides = {}) {
  const rendered = { headings: [], tables: [], raw: [], writes: 0 };
  const summary = {
    addHeading: (value) => { rendered.headings.push(value); return summary; },
    addTable: (value) => { rendered.tables.push(value); return summary; },
    addRaw: (value) => { rendered.raw.push(value); return summary; },
    write: async () => { rendered.writes += 1; },
  };
  await summarize({ summary }, { env: {
    POLICY_OUTCOME: outcome,
    POLICY_DECISION: state.outputs.decision,
    POLICY_REASON: state.outputs.reason,
    POLICY_NEXT_STEP: state.outputs['next-step'],
    PR_NUMBER: String(state.pr.number),
    EXPECTED_HEAD: state.context.payload.pull_request.head.sha,
    ...overrides,
  } });
  assert.equal(rendered.writes, 1);
  return JSON.stringify(rendered);
}

test('summary reports an auto-merge request without claiming it is merged', async () => {
  const state = fixture();
  await state.run();
  assert.equal(state.outputs.decision, 'requested');
  const summary = await summaryFor(state);
  assert.match(summary, /自動マージを要求しました/);
  assert.match(summary, /要求の成功だけではマージ完了を意味しません/);
  assert.ok(summary.includes(state.pr.head.sha));
});

test('summary explains the extra-commit block and safe recovery steps', async () => {
  const state = fixture();
  state.pr.commits = 2;
  await state.run();
  assert.equal(state.commands.length, 0);
  const summary = await summaryFor(state);
  assert.match(summary, /手動対応が必要/);
  assert.match(summary, /exactly one commit/);
  assert.match(summary, /@dependabot rebase/);
  assert.match(summary, /保持すべき手動変更/);
  assert.match(summary, /@dependabot recreate/);
});

test('summary distinguishes disabled automation and failed verification', async () => {
  const disabled = fixture();
  disabled.env.AUTO_MERGE_ENABLED = 'false';
  await disabled.run();
  assert.match(await summaryFor(disabled), /自動マージは無効/);

  const unverified = fixture();
  unverified.env.METADATA_OUTCOME = 'failure';
  await unverified.run();
  assert.match(await summaryFor(unverified), /署名またはメタデータの検証に失敗/);
  assert.equal(unverified.commands.length, 0);
});

test('summary shows API and merge-command failures even with stale success outputs', async () => {
  const state = fixture();
  state.outputs = { decision: 'requested', reason: 'stale reason', 'next-step': 'stale guidance' };
  state.github.paginate = async () => { throw new Error('API unavailable'); };
  await assert.rejects(state.run, /API unavailable/);
  const summary = await summaryFor(state, 'failure');
  assert.match(summary, /判定処理でエラー/);
  assert.doesNotMatch(summary, /自動マージを要求しました|stale reason|stale guidance/);
  assert.equal(state.commands.length, 0);

  const failedMerge = fixture();
  failedMerge.run = () => applyPolicy(failedMerge.github, failedMerge.context, {
    info: () => {},
    setOutput: (name, value) => { failedMerge.outputs[name] = value; },
  }, { exec: async () => { throw new Error('merge request failed'); } }, { env: failedMerge.env });
  await assert.rejects(failedMerge.run, /merge request failed/);
  assert.match(await summaryFor(failedMerge, 'failure'), /判定処理でエラー/);
  assert.notEqual(failedMerge.outputs.decision, 'requested');
});

test('summary fails closed for absent or unknown decisions and escapes HTML', async () => {
  const state = fixture();
  assert.match(await summaryFor(state), /判定処理でエラー/);
  assert.match(await summaryFor(state, 'success', { POLICY_DECISION: 'toString' }), /判定処理でエラー/);
  await state.run();
  const summary = await summaryFor(state, 'success', {
    POLICY_REASON: '<script>unsafe & text</script>',
    POLICY_NEXT_STEP: '<img src=x onerror="unsafe">',
  });
  assert.match(summary, /&lt;script&gt;unsafe &amp; text&lt;\/script&gt;/);
  assert.doesNotMatch(summary, /<script>|<img /);
  assert.match(workflow, /- name: Summarize auto-merge decision\n        if: always\(\)/);
});

test('all dependencies in a multi-dependency security update must be patch upgrades', async () => {
  const state = fixture();
  state.env.UPDATED_DEPENDENCIES = JSON.stringify([
    dependency,
    { ...dependency, dependencyName: '@astrojs/sitemap', prevVersion: '3.7.3', newVersion: '3.7.4' },
  ]);
  await state.run();
  assert.equal(state.commands.length, 1);
});

test('rejects an added commit even when the original patch metadata and current head checks pass', async () => {
  const state = fixture();
  // fetch-metadata still describes the original patch after a maintainer adds
  // another manifest change. The synchronize event already contains the new head.
  state.pr.commits = 2;
  state.pr.head.sha = 'b'.repeat(40);
  state.context.payload.pull_request = structuredClone(state.pr);
  await state.run();
  assert.equal(state.commands.length, 0);
  assert.match(state.messages.at(-1), /exactly one commit/);
});

const ineligible = {
  'opt-in is unset': (s) => { delete s.env.AUTO_MERGE_ENABLED; },
  'opt-in is false': (s) => { s.env.AUTO_MERGE_ENABLED = 'false'; },
  'commit verification failed': (s) => { s.env.METADATA_OUTCOME = 'failure'; },
  'metadata was skipped': (s) => { s.env.METADATA_OUTCOME = 'skipped'; },
  'metadata is malformed': (s) => { s.env.UPDATED_DEPENDENCIES = '{'; },
  'metadata is empty': (s) => { s.env.UPDATED_DEPENDENCIES = '[]'; },
  'metadata is not an array': (s) => { s.env.UPDATED_DEPENDENCIES = '{}'; },
  'metadata contains an unknown dependency': (s) => { s.env.UPDATED_DEPENDENCIES = '[null]'; },
  'PR is a draft': (s) => { s.pr.draft = true; },
  'PR is closed': (s) => { s.pr.state = 'closed'; },
  'PR targets another branch': (s) => { s.pr.base.ref = 'release'; },
  'PR author is not Dependabot': (s) => { s.pr.user.login = 'someone'; },
  'PR is from a fork': (s) => { s.pr.head.repo.full_name = 'someone/fork'; },
  'head repository was deleted': (s) => { s.pr.head.repo = null; },
  'head changed since the triggering event': (s) => { s.pr.head.sha = 'b'.repeat(40); },
  'PR has no commits': (s) => { s.pr.commits = 0; },
  'commit count is missing': (s) => { delete s.pr.commits; },
  'commit count is null': (s) => { s.pr.commits = null; },
  'commit count is not a number': (s) => { s.pr.commits = '1'; },
  'source file was changed': (s) => { s.files[1].filename = 'src/pages/index.astro'; },
  'manifest was renamed': (s) => { s.files[1].status = 'renamed'; },
  'manifest was added': (s) => { s.files[1].status = 'added'; },
  'manifest was deleted': (s) => { s.files[1].status = 'removed'; },
  'file list is incomplete': (s) => { s.files.pop(); },
  'file list is empty': (s) => { s.files = []; s.pr.changed_files = 0; },
  'branch has no rules': (s) => { s.rules = []; },
  'up-to-date policy is off': (s) => { s.rules[0].parameters.strict_required_status_checks_policy = false; },
  'Cloudflare check is not required': (s) => { s.rules[0].parameters.required_status_checks.pop(); },
  'CI check is not required': (s) => { s.rules[0].parameters.required_status_checks.shift(); },
  'check is not bound to its app': (s) => { s.rules[0].parameters.required_status_checks[0].integration_id = null; },
  'check has the wrong app': (s) => { s.rules[0].parameters.required_status_checks[1].integration_id = 1; },
  'PR rule is missing': (s) => { s.rules.splice(1, 1); },
  'signature rule is missing': (s) => { s.rules.pop(); },
};
for (const [name, change] of Object.entries(ineligible)) {
  test(`does not merge when ${name}`, async () => {
    const state = fixture();
    change(state);
    await state.run();
    assert.equal(state.commands.length, 0);
    assert.match(state.messages.at(-1), /^Manual review required:/);
  });
}

for (const [name, change] of Object.entries({
  'major update': { updateType: 'version-update:semver-major', newVersion: '1.0.0' },
  '0.x minor update': { updateType: 'version-update:semver-minor', newVersion: '0.10.0' },
  'GitHub Actions update': { packageEcosystem: 'github_actions' },
  'unknown update type': { updateType: '' },
  'another directory': { directory: '/another' },
  'prerelease': { newVersion: '0.9.12-beta.1' },
  'missing previous version': { prevVersion: '' },
  'downgrade': { newVersion: '0.9.8' },
  'unchanged version': { newVersion: '0.9.9' },
  'incorrect patch label': { newVersion: '1.9.12' },
})) {
  test(`rejects a group containing a patch and a ${name}`, async () => {
    const state = fixture();
    state.env.UPDATED_DEPENDENCIES = JSON.stringify([dependency, { ...dependency, ...change }]);
    await state.run();
    assert.equal(state.commands.length, 0);
  });
}

test('re-evaluates our pending auto-merge and revokes it when verification fails', async () => {
  const state = fixture();
  state.pr.auto_merge = { enabled_by: { login: 'github-actions[bot]' } };
  state.env.METADATA_OUTCOME = 'failure';
  await state.run();
  assert.equal(state.commands.length, 0);
  assert.equal(state.mutations.length, 1);
  assert.match(state.mutations[0].query, /disablePullRequestAutoMerge/);
  assert.deepEqual(state.mutations[0].variables, { id: 'PR_test' });
});

test('revokes our pending auto-merge when an extra commit is appended', async () => {
  const state = fixture();
  state.pr.auto_merge = { enabled_by: { login: 'github-actions[bot]' } };
  state.pr.commits = 2;
  await state.run();
  assert.equal(state.commands.length, 0);
  assert.equal(state.mutations.length, 1);
  assert.match(state.mutations[0].query, /disablePullRequestAutoMerge/);
  assert.deepEqual(state.mutations[0].variables, { id: 'PR_test' });
});

test('leaves maintainer-enabled auto-merge alone when our policy does not apply', async () => {
  const state = fixture();
  state.pr.auto_merge = { enabled_by: { login: 'yugook' } };
  state.env.AUTO_MERGE_ENABLED = 'false';
  await state.run();
  assert.equal(state.commands.length, 0);
  assert.equal(state.mutations.length, 0);
});

test('API failures never fall through to the merge command', async () => {
  const state = fixture();
  state.github.paginate = async () => { throw new Error('API unavailable'); };
  await assert.rejects(state.run, /API unavailable/);
  assert.equal(state.commands.length, 0);
});
