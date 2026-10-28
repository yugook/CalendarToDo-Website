import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Exercise the actual privileged script without checking out or executing a PR.
const workflow = readFileSync(
  new URL('../.github/workflows/dependabot-auto-merge.yml', import.meta.url),
  'utf8',
);
const blocks = workflow.split('          script: |\n');
assert.equal(blocks.length, 2, 'Expected one inline policy script');
const script = blocks[1].replace(/^ {12}/gm, '');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const applyPolicy = new AsyncFunction('github', 'context', 'core', 'exec', 'process', script);

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
    { info: (message) => state.messages.push(message) },
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

test('all dependencies in a multi-dependency security update must be patch upgrades', async () => {
  const state = fixture();
  state.env.UPDATED_DEPENDENCIES = JSON.stringify([
    dependency,
    { ...dependency, dependencyName: '@astrojs/sitemap', prevVersion: '3.7.3', newVersion: '3.7.4' },
  ]);
  await state.run();
  assert.equal(state.commands.length, 1);
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
