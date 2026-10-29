import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { parse, parseFragment, serialize } from 'parse5';
import {
  assertLegalPage, assertPolicyJSON, LEGAL_PAGES, MAX_POLICY_BYTES,
} from '../scripts/lib/legal-contract.mjs';

// Mutate real build output in memory; never modify dist or call the public site.
const dist = new URL('../dist/', import.meta.url);
const rawPolicy = await readFile(new URL('legal/policy.json', dist));
const policyFixture = JSON.parse(rawPolicy.toString('utf8'));
const policy = () => structuredClone(policyFixture);
const encode = (value) => JSON.stringify(value);

function findAll(node, predicate) {
  return [
    ...(predicate(node) ? [node] : []),
    ...(node.childNodes ?? []).flatMap((child) => findAll(child, predicate)),
  ];
}

const byTag = (node, tag) => findAll(node, (child) => child.tagName === tag);
const bodyOf = (document) => findAll(document, (node) => node.attrs?.some(
  (attr) => attr.name === 'class' && attr.value.split(/\s+/).includes('legal-content'),
))[0];
const replaceText = (node, value) => {
  node.childNodes = [{ nodeName: '#text', value, parentNode: node }];
};
const setDate = (document, value) => {
  const time = byTag(document, 'time')[0];
  time.attrs.find((attr) => attr.name === 'datetime').value = value;
  replaceText(time, value);
};

for (const page of LEGAL_PAGES) {
  const html = await readFile(new URL(`${page.path.slice(1)}index.html`, dist), 'utf8');
  const checkMutation = (change, error, expectedPolicy = policy()) => {
    const document = parse(html);
    change(document);
    assert.throws(() => assertLegalPage(serialize(document), page, expectedPolicy), error);
  };

  test(`${page.path}: accepts the generated legal document`, () => {
    assertLegalPage(html, page, policy());
  });

  test(`${page.path}: rejects missing body even with the original content elsewhere`, () => {
    checkMutation((document) => {
      const content = bodyOf(document);
      const footer = byTag(document, 'footer')[0];
      footer.childNodes.push(...content.childNodes);
      content.childNodes = [];
    }, /missing or duplicate section/);
  });

  test(`${page.path}: rejects each missing heading and each empty section`, () => {
    const count = byTag(bodyOf(parse(html)), 'h2').length;
    assert.ok(count > 0);
    for (let index = 0; index < count; index += 1) {
      checkMutation((document) => {
        const heading = byTag(bodyOf(document), 'h2')[index];
        heading.tagName = heading.nodeName = 'h3';
      }, /missing or duplicate section/);
      checkMutation((document) => {
        const content = bodyOf(document);
        const heading = byTag(content, 'h2')[index];
        const start = content.childNodes.indexOf(heading) + 1;
        let end = start;
        while (end < content.childNodes.length && content.childNodes[end].tagName !== 'h2') end += 1;
        content.childNodes.splice(start, end - start);
      }, /empty section/);
    }
  });

  test(`${page.path}: rejects headings without prose or list content`, () => {
    checkMutation((document) => {
      const content = bodyOf(document);
      content.childNodes = byTag(content, 'h2');
    }, /empty section/);
  });

  test(`${page.path}: requires a contact link inside the body`, () => {
    checkMutation((document) => {
      for (const link of byTag(bodyOf(document), 'a')) {
        link.attrs = link.attrs.filter((attr) => attr.name !== 'href');
      }
    }, /contact link missing from legal body/);
  });

  test(`${page.path}: rejects an HTML date different from JSON`, () => {
    checkMutation((document) => setDate(document, '2026-08-13'), /date differs from policy JSON/);
  });

  test(`${page.path}: rejects a displayed date different from datetime`, () => {
    checkMutation((document) => replaceText(byTag(document, 'time')[0], '2026-08-13'),
      /displayed date differs from datetime/);
  });

  test(`${page.path}: rejects an impossible date even when it matches JSON`, () => {
    const invalidPolicy = policy();
    invalidPolicy[page.section].version = '2026-02-30';
    checkMutation((document) => setDate(document, '2026-02-30'), /invalid calendar date/, invalidPolicy);
  });

  test(`${page.path}: ignores comments, scripts, templates, and hidden body content`, () => {
    for (const wrap of [
      (body) => `<!--${body}-->`,
      (body) => `<script type="text/plain">${body}</script>`,
      (body) => `<template>${body}</template>`,
      (body) => `<div hidden>${body}</div>`,
      (body) => `<div aria-hidden="true">${body}</div>`,
    ]) {
      checkMutation((document) => {
        const content = bodyOf(document);
        const original = serialize(content);
        content.childNodes = parseFragment(wrap(original)).childNodes;
      }, /missing or duplicate section/);
    }
  });

  test(`${page.path}: accepts nested markup and HTML entities in body content`, () => {
    const document = parse(html);
    const content = bodyOf(document);
    const wrapper = parseFragment('<div><p>Additional explanation &amp; details.</p></div>').childNodes[0];
    wrapper.childNodes.push(...content.childNodes);
    content.childNodes = [wrapper];
    assertLegalPage(serialize(document), page, policy());
  });
}

test('policy: accepts the generated JSON and additive fields', () => {
  assertPolicyJSON(rawPolicy);
  const value = policy();
  value.future_metadata = { enabled: true };
  value.terms.future_field = 'compatible addition';
  assertPolicyJSON(encode(value));
});

test('policy: rejects HTML and an error object returned as a successful JSON body', () => {
  assert.throws(() => assertPolicyJSON(''), SyntaxError);
  assert.throws(() => assertPolicyJSON('{"terms":'), SyntaxError);
  assert.throws(() => assertPolicyJSON('<html><body>Sign in</body></html>'), SyntaxError);
  assert.throws(() => assertPolicyJSON('{"error":"Access denied"}'), /terms: expected an object/);
});

test('policy: rejects non-object roots and entries', () => {
  for (const value of [null, [], 1, 'policy']) {
    assert.throws(() => assertPolicyJSON(encode(value)), /policy JSON: expected an object/);
    for (const section of ['terms', 'privacy', 'support']) {
      const invalid = policy();
      invalid[section] = value;
      assert.throws(() => assertPolicyJSON(encode(invalid)), /expected an object/);
    }
  }
});

test('policy: rejects missing entries, missing fields, and wrong field types', () => {
  for (const section of ['terms', 'privacy', 'support']) {
    const missing = policy();
    delete missing[section];
    assert.throws(() => assertPolicyJSON(encode(missing)), /expected an object/);
    for (const field of ['version', 'url_ja', 'url_en']) {
      for (const value of [undefined, null, 20260812, [], {}]) {
        const invalid = policy();
        invalid[section][field] = value;
        assert.throws(() => assertPolicyJSON(encode(invalid)),
          { message: new RegExp(`${section}\\.${field}`) });
      }
    }
  }
});

test('policy: rejects impossible or noncanonical dates in every entry', () => {
  for (const section of ['terms', 'privacy', 'support']) {
    for (const version of ['2026-02-30', '2025-02-29', '1900-02-29', '2026-04-31',
      '2026-13-01', '2026-00-10', '2026-01-00', '0000-01-01', '2026-8-12', ' 2026-08-12']) {
      const invalid = policy();
      invalid[section].version = version;
      assert.throws(() => assertPolicyJSON(encode(invalid)),
        { message: new RegExp(`${section}\\.version`) });
    }
  }
});

test('policy: rejects legal versions older than the bundled iOS minimum', () => {
  for (const section of ['terms', 'privacy']) {
    const invalid = policy();
    invalid[section].version = '2026-08-11';
    assert.throws(() => assertPolicyJSON(encode(invalid)), /older than the iOS minimum/);
  }
});

test('policy: preserves each published localized URL exactly', () => {
  for (const section of ['terms', 'privacy', 'support']) {
    for (const locale of ['ja', 'en']) {
      const field = `url_${locale}`;
      const expected = policyFixture[section][field];
      for (const url of [
        expected.replace('https:', 'http:'), expected.replace('calendartodo.app', 'example.com'),
        `${expected}?language=${locale}`, `${expected}#content`, expected.slice(0, -1),
        expected.replace('calendartodo.app', 'calendartodo.app:443'),
        expected.replace('https://', 'https://user@'),
        expected.replace(`/${section}/`, '/other/'),
        policyFixture[section][locale === 'ja' ? 'url_en' : 'url_ja'],
      ]) {
        const invalid = policy();
        invalid[section][field] = url;
        assert.throws(() => assertPolicyJSON(encode(invalid)),
          { message: new RegExp(`${section}\\.${field}`) });
      }
    }
  }
});

test('policy: permits independent document versions and a valid leap day', async () => {
  const value = policy();
  value.terms.version = '2028-02-29';
  const validated = assertPolicyJSON(encode(value));
  for (const page of LEGAL_PAGES) {
    const document = parse(await readFile(new URL(`${page.path.slice(1)}index.html`, dist), 'utf8'));
    if (page.section === 'terms') setDate(document, value.terms.version);
    assertLegalPage(serialize(document), page, validated);
  }
});

test('policy: enforces the 128 KiB limit in bytes, including multibyte text', () => {
  const padded = Buffer.concat([rawPolicy, Buffer.alloc(MAX_POLICY_BYTES - rawPolicy.length, 0x20)]);
  assertPolicyJSON(padded);
  assert.throws(() => assertPolicyJSON(Buffer.concat([padded, Buffer.from(' ')])), /128 KiB limit/);
  const multibyte = encode({ ...policy(), extra: 'あ'.repeat(50_000) });
  assert.ok(multibyte.length < MAX_POLICY_BYTES);
  assert.throws(() => assertPolicyJSON(multibyte), /128 KiB limit/);
});

test('policy: rejects malformed UTF-8 instead of silently replacing bytes', () => {
  const invalid = Buffer.concat([Buffer.from('{"extra":"'), Buffer.from([0xff]), Buffer.from('"}')]);
  assert.throws(() => assertPolicyJSON(invalid), TypeError);
});
