import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { accessHeaders, checkPreview, contextXML, evaluateScan, resolvePreview, routes, validateSHA } from '../scripts/zap-baseline.mjs';

const sha = 'a'.repeat(40);
const url = 'https://1234abcd.calendartodo-website.pages.dev/';
const successfulCheck = () => ({
  id: 42, app: { id: 85455 }, name: 'Cloudflare Pages', head_sha: sha,
  status: 'completed', conclusion: 'success', html_url: 'https://github.com/yugook/CalendarToDo-Website/runs/42',
  output: { summary: `<a href='${url}'>${url}</a>` },
});
const completedCoverage = () => ({ complete: true, pages: routes.map((route) => ({
  ...route, finalURL: new URL(route.path, url).href,
})) });
const report = { site: [{ alerts: [{ riskcode: '2' }, { riskcode: '0' }] }] };

describe('ZAP deployment selection', () => {
  it('resolves a unique immutable preview and records commit/check identity', () => {
    assert.deepEqual(resolvePreview(sha, [successfulCheck()]), {
      url, sha, checkID: 42, checkURL: successfulCheck().html_url,
    });
  });
  for (const [name, change] of [
    ['another app', { app: { id: 1 } }],
    ['another check name', { name: 'Other check' }],
    ['another commit', { head_sha: 'b'.repeat(40) }],
    ['unfinished deployment', { status: 'in_progress' }],
    ['failed deployment', { conclusion: 'failure' }],
  ]) {
    it(`rejects ${name}`, () => assert.throws(() => resolvePreview(sha, [{ ...successfulCheck(), ...change }])));
  }
  for (const candidate of [
    'https://calendartodo.app/',
    'https://main.calendartodo-website.pages.dev/',
    'https://1234abcd.other-project.pages.dev/',
    'https://1234abcd.calendartodo-website.pages.dev.evil.example/',
    'https://1234abcd.calendartodo-website.pages.dev:8443/',
    'https://user@1234abcd.calendartodo-website.pages.dev/',
    'https://1234abcd.calendartodo-website.pages.dev/?redirect=elsewhere',
    'http://1234abcd.calendartodo-website.pages.dev/',
  ]) {
    it(`rejects an unapproved target: ${candidate}`, () => {
      assert.throws(() => resolvePreview(sha, [{ ...successfulCheck(), output: { summary: candidate } }]));
    });
  }
  it('rejects ambiguous successful previews', () => {
    const other = { ...successfulCheck(), output: { summary: url.replace('1234abcd', 'abcd1234') } };
    assert.throws(() => resolvePreview(sha, [successfulCheck(), other]));
  });
  it('rejects short SHAs and shell/expression input', () => {
    for (const value of ['abc1234', '${{ github.token }}', '$(touch /tmp/invalid)', '', undefined]) {
      assert.throws(() => validateSHA(value));
    }
  });
  it('limits the context to the exact preview origin', () => {
    const scope = new RegExp(contextXML(url).match(/<incregexes>(.*?)<\/incregexes>/)[1]);
    assert.ok(scope.test(url + 'support/'));
    assert.equal(scope.test(url.replace('.pages.dev/', '.pages.dev.evil.example/')), false);
    assert.equal(scope.test('https://calendartodo.app/'), false);
  });
});

describe('ZAP preview access', () => {
  it('requires a complete service-token pair', () => {
    assert.deepEqual(accessHeaders('', ''), {});
    assert.deepEqual(accessHeaders('test-id', 'test-secret'), {
      'CF-Access-Client-Id': 'test-id', 'CF-Access-Client-Secret': 'test-secret',
    });
    assert.throws(() => accessHeaders('test-id', ''));
    assert.throws(() => accessHeaders('', 'test-secret'));
  });
  it('checks website content without following authentication redirects', async () => {
    await checkPreview(url, {}, async (target, options) => {
      assert.equal(target, url);
      assert.equal(options.redirect, 'manual');
      return new Response('<main id="main-content">Calendar ToDo</main>', { headers: { 'content-type': 'text/html' } });
    });
  });
  for (const [name, status, body, type] of [
    ['Access redirect', 302, '', 'text/html'],
    ['blocked preview', 403, 'Forbidden', 'text/plain'],
    ['login page returning 200', 200, '<title>Sign in · Cloudflare Access</title>', 'text/html'],
    ['wrong content type', 200, '{}', 'application/json'],
  ]) {
    it(`does not accept ${name}`, async () => {
      await assert.rejects(checkPreview(url, {}, async () => new Response(body, {
        status, headers: { 'content-type': type },
      })));
    });
  }
});

describe('ZAP completion policy', () => {
  for (const exitCode of [0, 2]) {
    it(`allows completed passive scans with exit ${exitCode}`, () => {
      assert.deepEqual(evaluateScan(exitCode, { url }, completedCoverage(), report, [url]), [1, 0, 1, 0]);
    });
  }
  it('accepts the bare-origin URL recorded by ZAP without a trailing slash', () => {
    assert.deepEqual(evaluateScan(2, { url }, completedCoverage(), report, [url.slice(0, -1)]), [1, 0, 1, 0]);
    assert.throws(() => evaluateScan(2, { url }, completedCoverage(), report, [url.slice(0, -1) + '.evil.example/']));
  });
  for (const exitCode of [1, 3, 125, 137, NaN]) {
    it(`fails scan/container error ${exitCode}`, () => {
      assert.throws(() => evaluateScan(exitCode, { url }, completedCoverage(), report, [url]));
    });
  }
  it('fails missing policy JSON coverage even if the spider found all HTML pages', () => {
    const coverage = completedCoverage();
    coverage.pages = coverage.pages.filter((route) => !route.path.endsWith('.json'));
    assert.throws(() => evaluateScan(2, { url }, coverage, report, [url]));
  });
  it('fails duplicate coverage, incomplete work, unexpected status, and external URLs', () => {
    const missing = completedCoverage();
    missing.pages[0] = missing.pages[1];
    const incomplete = { ...completedCoverage(), complete: false };
    const wrongStatus = completedCoverage();
    wrongStatus.pages[0].status = 403;
    const redirect = completedCoverage();
    redirect.pages[0].finalURL = 'https://calendartodo.app/';
    for (const coverage of [missing, incomplete, wrongStatus, redirect]) {
      assert.throws(() => evaluateScan(2, { url }, coverage, report, [url]));
    }
    assert.throws(() => evaluateScan(2, { url }, completedCoverage(), report, ['https://apps.apple.com/']));
    assert.throws(() => evaluateScan(2, { url }, completedCoverage(), report, []));
    assert.throws(() => evaluateScan(2, { url }, completedCoverage(), {}, [url]));
  });
});
