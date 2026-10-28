import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const pages = [
  ['index.html', 'ja'],
  ['support/index.html', 'ja'],
  ['terms/index.html', 'ja'],
  ['privacy/index.html', 'ja'],
  ['en/index.html', 'en'],
  ['en/support/index.html', 'en'],
  ['en/terms/index.html', 'en'],
  ['en/privacy/index.html', 'en'],
  ['404.html', 'ja'],
];

for (const [path, locale] of pages) {
  const html = await read(`dist/${path}`);
  assert.match(html, new RegExp(`<html\\b[^>]*\\blang="${locale}"`), path);
  assert.match(html, /<main\b/, `${path}: main content is missing`);
}

const policy = JSON.parse(await read('dist/legal/policy.json'));
for (const section of ['terms', 'privacy', 'support']) {
  assert.ok(policy[section]?.version, `${section}: policy version is missing`);
  for (const locale of ['ja', 'en']) {
    const url = new URL(policy[section][`url_${locale}`]);
    assert.equal(url.origin, 'https://calendartodo.app');
  }
}

const index = await read('dist/sitemap-index.xml');
assert.match(index, /<sitemapindex\b/);
assert.ok(index.includes('<loc>https://calendartodo.app/sitemap-0.xml</loc>'));
const sitemap = await read('dist/sitemap-0.xml');
assert.match(sitemap, /<urlset\b/);
for (const [path] of pages.filter(([path]) => path !== '404.html')) {
  const url = new URL(path.replace(/index\.html$/, ''), 'https://calendartodo.app/');
  assert.ok(sitemap.includes(`<loc>${url.href}</loc>`), `${url.href}: missing from sitemap`);
}

assert.equal(await read('dist/_headers'), await read('public/_headers'));
console.log('Validated 9 HTML pages, policy JSON, sitemap, and Cloudflare headers.');
