import assert from 'node:assert/strict';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { LEGAL_PATHS, LOCALE_PATHS, SUPPORT_PATHS } from '../src/config/site.ts';

const project = 'calendartodo-website';
const cloudflareAppID = 85455;
const reportDirectory = new URL('../zap-report/', import.meta.url);

export const routes = [
  ...Object.values(LOCALE_PATHS),
  ...Object.values(SUPPORT_PATHS),
  ...Object.values(LEGAL_PATHS.terms),
  ...Object.values(LEGAL_PATHS.privacy),
  LEGAL_PATHS.policy,
  '/404.html',
  '/__zap_missing_page__/',
].map((path) => ({ path, status: path === '/__zap_missing_page__/' ? 404 : 200 }));

export function validateSHA(value) {
  assert.match(value ?? '', /^[a-f0-9]{40}$/, 'commit_sha must be a full, lowercase 40-character SHA');
  return value;
}

export function resolvePreview(sha, checks) {
  validateSHA(sha);
  const urls = new Map();
  for (const check of checks) {
    if (check.app?.id !== cloudflareAppID || check.name !== 'Cloudflare Pages'
      || check.head_sha !== sha || check.status !== 'completed' || check.conclusion !== 'success') continue;
    const candidates = (check.output?.summary ?? '').matchAll(
      /https:\/\/[^\s<>"']+/g,
    );
    for (const [candidate] of candidates) {
      const url = new URL(candidate);
      // An immutable deployment in this project, never a branch alias or production.
      if (url.protocol === 'https:' && !url.username && !url.password && !url.port
        && new RegExp(`^[a-f0-9]{8}\\.${project}\\.pages\\.dev$`).test(url.hostname)
        && url.pathname === '/' && !url.search && !url.hash) {
        urls.set(url.href, { url: url.href, sha, checkID: check.id, checkURL: check.html_url });
      }
    }
  }
  assert.equal(urls.size, 1, 'Expected one immutable preview URL in a successful Cloudflare Pages check for commit_sha');
  return [...urls.values()][0];
}

export function accessHeaders(id, secret) {
  assert.equal(Boolean(id), Boolean(secret), 'Set both CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET, or neither');
  return id ? { 'CF-Access-Client-Id': id, 'CF-Access-Client-Secret': secret } : {};
}

export async function checkPreview(url, headers, request = fetch) {
  const response = await request(url, {
    headers: { 'User-Agent': 'CalendarToDo-ZAP-Baseline', ...headers },
    redirect: 'manual',
    signal: AbortSignal.timeout(20_000),
  });
  assert.equal(response.status, 200,
    `Preview returned HTTP ${response.status}; check Cloudflare Access service-token configuration (redirects are not followed)`);
  assert.match(response.headers.get('content-type') ?? '', /text\/html/i, 'Preview did not return HTML');
  const body = await response.text();
  assert.match(body, /id=["']main-content["']/, 'Preview returned a login/challenge/error page instead of the website');
  assert.ok(body.includes('Calendar ToDo'), 'Preview did not return the Calendar ToDo website');
}

export function contextXML(url) {
  const scope = '^' + url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*';
  return `<?xml version="1.0" encoding="UTF-8"?>
<configuration><context><name>CalendarToDo preview</name><desc>Manual baseline</desc>
<inscope>true</inscope><incregexes>${scope}</incregexes></context></configuration>\n`;
}

export function evaluateScan(exitCode, target, coverage, report, visited) {
  assert.ok([0, 2].includes(exitCode), `ZAP execution failed (exit ${exitCode}); alerts-only exit 2 is allowed`);
  assert.equal(coverage.complete, true, 'ZAP did not finish fetching every required route');
  assert.equal(coverage.pages.length, routes.length, 'Incomplete or duplicate route coverage');
  for (const route of routes) {
    const matches = coverage.pages.filter((page) => page.path === route.path);
    assert.equal(matches.length, 1, `Missing or duplicate coverage: ${route.path}`);
    assert.equal(matches[0].status, route.status, `Unexpected HTTP status: ${route.path}`);
    assert.equal(new URL(matches[0].finalURL).origin, new URL(target.url).origin, 'External redirect in coverage');
  }
  assert.ok(Array.isArray(report.site), 'Missing or invalid ZAP JSON report');
  assert.ok(Array.isArray(visited) && visited.length > 0, 'ZAP did not record visited URLs');
  for (const url of visited) {
    assert.equal(new URL(url).origin, new URL(target.url).origin, `Out-of-scope URL visited: ${url}`);
  }
  const risks = [0, 0, 0, 0];
  for (const site of report.site) {
    for (const alert of site.alerts ?? []) {
      const risk = Number(alert.riskcode);
      assert.ok(Number.isInteger(risk) && risk >= 0 && risk <= 3, 'Invalid alert risk in ZAP report');
      risks[risk]++;
    }
  }
  return risks;
}

async function prepare() {
  const sha = validateSHA(process.env.ZAP_TARGET_SHA);
  const repository = process.env.GITHUB_REPOSITORY;
  assert.match(repository ?? '', /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, 'Invalid GITHUB_REPOSITORY');
  assert.ok(process.env.GH_TOKEN, 'GH_TOKEN is required to read Cloudflare check runs');
  const response = await fetch(`https://api.github.com/repos/${repository}/commits/${sha}/check-runs?per_page=100&filter=latest`, {
    headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    redirect: 'error',
    signal: AbortSignal.timeout(20_000),
  });
  assert.equal(response.status, 200, `Could not read check runs (HTTP ${response.status})`);
  const target = { ...resolvePreview(sha, (await response.json()).check_runs), routes,
    image: process.env.ZAP_IMAGE, preparedAt: new Date().toISOString() };
  await mkdir(reportDirectory, { recursive: true });
  await writeFile(new URL('target.json', reportDirectory), JSON.stringify(target, null, 2) + '\n');
  await writeFile(new URL('target.context', reportDirectory), contextXML(target.url));
  await checkPreview(target.url, accessHeaders(process.env.CF_ACCESS_CLIENT_ID, process.env.CF_ACCESS_CLIENT_SECRET));
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `url=${target.url}\n`);
  console.log(`Verified preview: ${target.url} (commit ${sha}, Cloudflare check ${target.checkID})`);
}

async function summarize() {
  const json = async (name) => JSON.parse(await readFile(new URL(name, reportDirectory), 'utf8'));
  const target = await json('target.json');
  let summary = `## ZAP Baseline Scan\n\n- Commit: \`${target.sha}\`\n- Preview: ${target.url}\n- Scanner: \`${target.image}\`\n`;
  try {
    const exitText = (await readFile(new URL('exit-code.txt', reportDirectory), 'utf8')).trim();
    assert.match(exitText, /^\d+$/, 'Missing or invalid ZAP exit code');
    const exitCode = Number(exitText);
    const html = await readFile(new URL('report.html', reportDirectory), 'utf8');
    assert.ok(html.trim(), 'Missing ZAP HTML report');
    const risks = evaluateScan(exitCode, target, await json('coverage.json'), await json('report.json'), await json('urls.json'));
    summary += `- Required routes: ${routes.length}/${routes.length}\n- Passive-scan alerts: High ${risks[3]}, Medium ${risks[2]}, Low ${risks[1]}, Informational ${risks[0]}\n\n`;
    summary += 'Completed in report-only mode. Alerts do not block merging and require review. This is not a security clearance.\n';
    console.log(summary);
  } catch (error) {
    summary += '\n**Execution or coverage verification failed. This is not a clean scan.**\n';
    throw error;
  } finally {
    await writeFile(new URL('summary.md', reportDirectory), summary);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const commands = { prepare, summarize };
  assert.ok(Object.hasOwn(commands, process.argv[2]), 'Usage: node scripts/zap-baseline.mjs prepare|summarize');
  await commands[process.argv[2]]();
}
