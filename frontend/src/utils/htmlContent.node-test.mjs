import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeUrl, isSafeStyle, sanitizeHtml, htmlToText, cmsContentToHtml } from './htmlContent.js';

test('isSafeUrl accepts normal links and relative URLs', () => {
  for (const u of ['https://theurbanphysio.com/a?b=1', 'http://x.io', 'mailto:a@b.co', 'tel:+911234567890', '/book', './x', '../y', '#top', '?q=1', 'page.html', '']) {
    assert.equal(isSafeUrl(u), true, u);
  }
});

test('isSafeUrl rejects script-capable schemes, including obfuscated ones', () => {
  const bad = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    '  javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'java\r\nscr\u0000ipt:alert(1)',
    '\u200bjavascript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'data:image/svg+xml;base64,PHN2Zz4=',
    'file:///etc/passwd',
    'blob:https://x/abc',
  ];
  for (const u of bad) assert.equal(isSafeUrl(u), false, JSON.stringify(u));
});

test('isSafeUrl only allows raster data: URIs when explicitly enabled (images)', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  assert.equal(isSafeUrl(png), false);
  assert.equal(isSafeUrl(png, { allowDataImage: true }), true);
  assert.equal(isSafeUrl('data:image/svg+xml;base64,PHN2Zz4=', { allowDataImage: true }), false);
  assert.equal(isSafeUrl('data:text/html;base64,AAAA', { allowDataImage: true }), false);
});

test('isSafeStyle allows formatting and refuses loaders / executors', () => {
  assert.equal(isSafeStyle('color: red; text-align:center; font-weight:700'), true);
  for (const s of ['background:url(http://evil/x.png)', 'width: expression(alert(1))', '@import "x.css"', 'b\\65 havior:url(x)', 'background: u/**/rl(x)', 'position:fixed;top:0']) {
    assert.equal(isSafeStyle(s), false, s);
  }
});

test('without a DOM, sanitizeHtml fails closed (escapes) and htmlToText strips tags', () => {
  assert.equal(typeof DOMParser, 'undefined');
  const out = sanitizeHtml('<img src=x onerror=alert(1)>');
  assert.ok(!out.includes('<'));
  assert.equal(htmlToText('<b>Hi</b> <img src=x onerror=alert(1)>there'), 'Hi there');
  assert.ok(!cmsContentToHtml('<script>steal()</script>').includes('<script'));
  assert.equal(sanitizeHtml(''), '');
  assert.equal(sanitizeHtml(null), '');
});
