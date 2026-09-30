import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './escapeHtml.js';

test('escapes every HTML-significant character', () => {
  assert.equal(escapeHtml(`<a href="x" title='y'>&\``), '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&#96;');
});

test('neutralises script and event-handler payloads', () => {
  const out = escapeHtml('<img src=x onerror=alert(1)><script>steal()</script>');
  assert.ok(!out.includes('<'));
  assert.ok(!out.includes('>'));
  assert.equal(out, '&lt;img src=x onerror=alert(1)&gt;&lt;script&gt;steal()&lt;/script&gt;');
});

test('null / undefined become an empty string, numbers are stringified', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(0), '0');
  assert.equal(escapeHtml(12.5), '12.5');
});

test('does not double-escape when applied once and leaves plain text alone', () => {
  assert.equal(escapeHtml('Dr. Asha Rao - 10:30'), 'Dr. Asha Rao - 10:30');
  assert.equal(escapeHtml('Tom & Jerry'), 'Tom &amp; Jerry');
});
