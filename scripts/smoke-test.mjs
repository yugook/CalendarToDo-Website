import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { preview } from 'astro';
import { assertLegalPage, assertPolicyJSON, LEGAL_PAGES } from './lib/legal-contract.mjs';

const root = new URL('../', import.meta.url);
const site = 'https://calendartodo.app';
const routes = [
  ['/', 'ja', '/en/'],
  ['/en/', 'en', '/'],
  ['/support/', 'ja', '/en/support/'],
  ['/en/support/', 'en', '/support/'],
  ['/terms/', 'ja', '/en/terms/'],
  ['/en/terms/', 'en', '/terms/'],
  ['/privacy/', 'ja', '/en/privacy/'],
  ['/en/privacy/', 'en', '/privacy/'],
];

// Astro emits quoted attributes; only asset URLs and language links are needed here.
function attributes(tag) {
  return Object.fromEntries(
    Array.from(tag.matchAll(/\s([\w:-]+)=(?:"([^"]*)"|'([^']*)')/g), (match) => [
      match[1],
      (match[2] ?? match[3]).replaceAll('&amp;', '&'),
    ]),
  );
}

describe('Built website', { timeout: 60_000 }, () => {
  let server;
  let base;
  const pages = new Map();

  before(async () => {
    server = await preview({
      root: fileURLToPath(root),
      server: { host: '127.0.0.1', port: 0, open: false },
      logLevel: 'error',
    });
    base = new URL(`http://127.0.0.1:${server.port}`);
  });

  after(async () => {
    await server?.stop();
  });

  async function request(path, contentType, status = 200) {
    const url = new URL(path, base);
    assert.equal(url.origin, base.origin, `Unexpected external request: ${url}`);
    const response = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    const body = Buffer.from(await response.arrayBuffer());
    assert.equal(response.status, status, `${url.pathname}: HTTP status`);
    assert.match(
      response.headers.get('content-type') ?? '',
      contentType,
      `${url.pathname}: content type`,
    );
    assert.ok(body.length > 0, `${url.pathname}: empty response`);
    return body;
  }

  for (const [path, locale, alternate] of routes) {
    it(`serves ${path} with localized content and language links`, async () => {
      const html = (await request(path, /text\/html/)).toString();
      pages.set(path, html);
      assert.match(html, new RegExp(`<html\\b[^>]*\\blang="${locale}"`));
      assert.match(html, /<title>[^<]*Calendar ToDo[^<]*<\/title>/);
      assert.match(html, /<main\b[^>]*\bid="main-content"/);
      assert.match(html, /<h1\b/);

      const links = Array.from(
        html.matchAll(/<(?:a|link)\b[^>]*>/g),
        ([tag]) => attributes(tag),
      );
      assert.ok(links.some((link) =>
        link.rel === 'canonical' && link.href === `${site}${path}`,
      ));
      for (const language of ['ja', 'en']) {
        const expectedPath = language === locale ? path : alternate;
        assert.ok(links.some((link) =>
          link.rel === 'alternate' &&
          link.hreflang === language &&
          link.href === `${site}${expectedPath}`,
        ));
      }
      const alternateLocale = locale === 'ja' ? 'en' : 'ja';
      assert.ok(links.some((link) =>
        link.hreflang === alternateLocale && link.href === alternate,
      ));

      if (path === '/') assert.ok(html.includes('予定を入れるだけで、終わらせない。'));
      if (path === '/en/') assert.ok(html.includes('Track Progress and Reflect'));
    });
  }

  it('serves the policy contract with matching legal content and dates', async () => {
    const policy = assertPolicyJSON(await request('/legal/policy.json', /^application\/json(?:\s*;|\s*$)/));
    for (const page of LEGAL_PAGES) {
      assertLegalPage(pages.get(page.path), page, policy);
    }
  });

  it('serves the custom 404 page and returns 404 for an unknown path', async () => {
    for (const [path, status] of [['/404.html', 200], ['/__ci_missing_page__/', 404]]) {
      const html = (await request(path, /text\/html/, status)).toString();
      assert.ok(html.includes('ページが見つかりません'));
      assert.match(
        html,
        /<meta\b[^>]*name="robots"[^>]*content="noindex, nofollow"/,
      );
    }
  });

  it('serves all referenced local assets', async (context) => {
    const assets = new Map();
    const types = {
      image: /^image\//,
      style: /text\/css/,
      script: /(?:javascript|ecmascript)/,
    };
    assert.equal(pages.size, routes.length);

    for (const html of pages.values()) {
      for (const [tag, name] of html.matchAll(/<(img|source|script|link)\b[^>]*>/g)) {
        const attrs = attributes(tag);
        if (name === 'img' || name === 'source') {
          if (attrs.src) assets.set(attrs.src, 'image');
          for (const candidate of attrs.srcset?.split(',') ?? []) {
            assets.set(candidate.trim().split(/\s+/)[0], 'image');
          }
        } else if (name === 'script' && attrs.src) {
          assets.set(attrs.src, 'script');
        } else if (name === 'link' && attrs.href) {
          if (attrs.rel === 'stylesheet') assets.set(attrs.href, 'style');
          if (['icon', 'apple-touch-icon'].includes(attrs.rel)) {
            assets.set(attrs.href, 'image');
          }
        }
      }
    }

    for (const type of Object.keys(types)) {
      assert.ok([...assets.values()].includes(type), `No ${type} assets were checked`);
    }
    for (const [path, type] of assets) await request(path, types[type]);
    context.diagnostic(`Checked ${assets.size} local assets`);
  });

  it('copies Cloudflare security headers into the build unchanged', async () => {
    const [source, built] = await Promise.all([
      readFile(new URL('public/_headers', root), 'utf8'),
      readFile(new URL('dist/_headers', root), 'utf8'),
    ]);
    assert.equal(built, source);
  });
});
