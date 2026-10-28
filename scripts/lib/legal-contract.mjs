import assert from 'node:assert/strict';
import { parse } from 'parse5';

// Public contracts, intentionally independent of the site's URL/version config.
// CalendarDoneViewer: LegalPolicyLinks.swift / LegalPolicyResponseValidator.swift.
export const MINIMUM_POLICY_VERSION = '2026-08-12';
export const MAX_POLICY_BYTES = 128 * 1024;
const site = 'https://calendartodo.app';
const contactURL = 'mailto:yugo.work.contact@gmail.com';

const headings = {
  terms: {
    ja: ['適用', '同意', '本アプリの内容', '禁止事項', 'サブスクリプション',
      '提供の変更・停止', '免責事項', '規約の変更', '準拠法・裁判管轄', 'お問い合わせ'],
    en: ['Scope', 'Acceptance', 'Description of Service', 'Prohibited Conduct',
      'Subscriptions', 'Changes and Discontinuation', 'Disclaimers and Limitation of Liability',
      'Changes to Terms', 'Governing Law and Jurisdiction', 'Contact'],
  },
  privacy: {
    ja: ['取得・保存する情報', '利用目的', '第三者提供とデータ送信',
      'ユーザーの選択権', 'セキュリティ', 'お問い合わせ'],
    en: ['Information We Access and Store', 'How We Use Information',
      'Data Sharing and Transmission', 'Your Choices', 'Security', 'Contact'],
  },
};

export const LEGAL_PAGES = [
  { path: '/terms/', section: 'terms', locale: 'ja', title: '利用規約' },
  { path: '/en/terms/', section: 'terms', locale: 'en', title: 'Terms of Service' },
  { path: '/privacy/', section: 'privacy', locale: 'ja', title: 'プライバシーポリシー' },
  { path: '/en/privacy/', section: 'privacy', locale: 'en', title: 'Privacy Policy' },
];

function assertDateVersion(value, label) {
  assert.equal(typeof value, 'string', `${label}: expected a date string`);
  assert.match(value, /^(?!0000)\d{4}-\d{2}-\d{2}$/, `${label}: expected YYYY-MM-DD`);
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  assert.ok(month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1],
    `${label}: invalid calendar date ${value}`);
}

export function assertPolicyJSON(body) {
  const bytes = Buffer.from(body);
  assert.ok(bytes.length <= MAX_POLICY_BYTES, 'policy JSON: exceeds the iOS 128 KiB limit');
  const policy = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  assert.ok(policy && typeof policy === 'object' && !Array.isArray(policy),
    'policy JSON: expected an object');

  for (const section of ['terms', 'privacy', 'support']) {
    const entry = policy[section];
    assert.ok(entry && typeof entry === 'object' && !Array.isArray(entry),
      `${section}: expected an object`);
    assertDateVersion(entry.version, `${section}.version`);
    if (section !== 'support') {
      assert.ok(entry.version >= MINIMUM_POLICY_VERSION,
        `${section}.version: older than the iOS minimum ${MINIMUM_POLICY_VERSION}`);
    }
    for (const locale of ['ja', 'en']) {
      const path = locale === 'ja' ? `/${section}/` : `/en/${section}/`;
      assert.equal(entry[`url_${locale}`], `${site}${path}`, `${section}.url_${locale}`);
    }
  }
  return policy;
}

const attribute = (node, name) => node.attrs?.find((attr) => attr.name === name)?.value;
const hasClass = (node, name) => attribute(node, 'class')?.split(/\s+/).includes(name);
const ignored = (node) => ['script', 'style', 'template'].includes(node.tagName)
  || attribute(node, 'hidden') !== undefined || attribute(node, 'aria-hidden') === 'true';
const normalize = (value) => value.replace(/\s+/g, ' ').trim();

function findAll(node, predicate) {
  if (ignored(node)) return [];
  return [
    ...(predicate(node) ? [node] : []),
    ...(node.childNodes ?? []).flatMap((child) => findAll(child, predicate)),
  ];
}

function text(node) {
  if (ignored(node)) return '';
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes ?? []).map(text).join('');
}

function only(node, predicate, label) {
  const matches = findAll(node, predicate);
  assert.equal(matches.length, 1, `${label}: expected exactly one element`);
  return matches[0];
}

function sectionsIn(content) {
  const sections = [];
  function visit(node) {
    if (ignored(node)) return;
    if (node.tagName === 'h2') {
      sections.push({ heading: normalize(text(node)), body: '' });
      return;
    }
    // Other heading levels cannot stand in for a section's prose/list content.
    if (/^h[1-6]$/.test(node.tagName)) return;
    if (node.nodeName === '#text' && sections.length > 0) {
      sections.at(-1).body += node.value;
    }
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(content);
  return sections;
}

export function assertLegalPage(html, page, policy) {
  const label = page.path;
  const document = parse(html);
  const htmlElement = only(document, (node) => node.tagName === 'html', `${label}: html`);
  assert.equal(attribute(htmlElement, 'lang'), page.locale, `${label}: language`);
  const main = only(document, (node) => node.tagName === 'main'
    && attribute(node, 'id') === 'main-content', `${label}: main content`);
  const article = only(main, (node) => node.tagName === 'article'
    && hasClass(node, 'legal-article'), `${label}: legal article`);
  const hero = only(article, (node) => node.tagName === 'header'
    && hasClass(node, 'legal-hero'), `${label}: legal header`);
  const title = only(hero, (node) => node.tagName === 'h1', `${label}: document title`);
  assert.equal(normalize(text(title)), page.title, `${label}: document title`);
  const time = only(hero, (node) => node.tagName === 'time', `${label}: update date`);
  const updatedAt = attribute(time, 'datetime');
  assertDateVersion(updatedAt, `${label}: datetime`);
  assert.equal(updatedAt, policy[page.section].version, `${label}: date differs from policy JSON`);
  assert.equal(normalize(text(time)), updatedAt, `${label}: displayed date differs from datetime`);

  const content = only(article, (node) => hasClass(node, 'legal-content'), `${label}: legal body`);
  const sections = sectionsIn(content);
  for (const heading of headings[page.section][page.locale]) {
    const matches = sections.filter((section) => section.heading === heading);
    assert.equal(matches.length, 1, `${label}: missing or duplicate section "${heading}"`);
    assert.match(matches[0].body, /[\p{L}\p{N}]/u, `${label}: empty section "${heading}"`);
  }
  assert.ok(findAll(content, (node) => node.tagName === 'a'
    && attribute(node, 'href') === contactURL && normalize(text(node)).length > 0).length > 0,
  `${label}: contact link missing from legal body`);
}
