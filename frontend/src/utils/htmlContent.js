/** Detect & sanitize rich-text HTML (CMS content, clinical notes) for display. */

export function isHtmlContent(text) {
  if (!text || typeof text !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(text.trim());
}

/* ------------------------------------------------------------------ */
/* Allow-list sanitizer                                               */
/* ------------------------------------------------------------------ */

/** Tags that are kept. Anything else is unwrapped (children kept) or, for the DROP set, removed entirely. */
const ALLOWED_TAGS = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'col', 'colgroup', 'dd', 'del', 'div', 'dl', 'dt',
  'em', 'figcaption', 'figure', 'font', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'mark',
  'ol', 'p', 'pre', 'q', 's', 'samp', 'small', 'span', 'strike', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot',
  'th', 'thead', 'tr', 'u', 'ul', 'audio', 'video', 'source',
]);

/** Removed together with their content. */
const DROP_TAGS = new Set([
  'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'form', 'input', 'button', 'textarea',
  'select', 'option', 'link', 'meta', 'base', 'noscript', 'template', 'svg', 'math', 'title', 'head',
]);

const GLOBAL_ATTRS = new Set(['class', 'title', 'lang', 'dir', 'style', 'align']);
const TAG_ATTRS = {
  a: new Set(['href', 'target', 'rel', 'name']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  ol: new Set(['start', 'type']),
  li: new Set(['value']),
  font: new Set(['color', 'size']),
  audio: new Set(['src', 'controls', 'preload']),
  video: new Set(['src', 'controls', 'preload', 'poster', 'width', 'height']),
  source: new Set(['src', 'type']),
  col: new Set(['span']),
  colgroup: new Set(['span']),
};
const URL_ATTRS = new Set(['href', 'src', 'poster']);

const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);
const SAFE_DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i;

/**
 * Decide whether a URL attribute value is safe to keep.
 * Browsers ignore ASCII whitespace / control characters inside the scheme ("java\tscript:"), so those are removed
 * BEFORE the scheme is inspected. Relative URLs and fragments are allowed; unknown schemes are not.
 */
export function isSafeUrl(value, { allowDataImage = false } = {}) {
  if (typeof value !== 'string') return false;
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u0020\u007f-\u009f\u200b-\u200f\u2028\u2029\ufeff]/g, '');
  if (cleaned === '') return true;
  if (allowDataImage && SAFE_DATA_IMAGE.test(value.trim())) return true;
  // Protocol-relative and relative URLs, fragments and queries carry no scheme.
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(cleaned);
  if (!scheme) return true;
  return SAFE_SCHEMES.has(scheme[1].toLowerCase());
}

/** Inline styles are kept for editor formatting, but anything that can load or execute something is refused. */
export function isSafeStyle(value) {
  if (typeof value !== 'string') return false;
  // eslint-disable-next-line no-control-regex
  const v = value.replace(/\/\*[\s\S]*?\*\//g, '').replace(/[\u0000-\u001f\\]/g, '').toLowerCase();
  return !/(url\s*\(|expression\s*\(|@import|javascript:|behaviou?r\s*:|-moz-binding|position\s*:\s*fixed)/.test(v);
}

function cleanElement(el, doc) {
  const tag = el.tagName.toLowerCase();
  const allowedForTag = TAG_ATTRS[tag];
  [...el.attributes].forEach((attr) => {
    const name = attr.name.toLowerCase();
    const permitted = GLOBAL_ATTRS.has(name) || (allowedForTag && allowedForTag.has(name));
    if (!permitted || name.startsWith('on')) {
      el.removeAttribute(attr.name);
      return;
    }
    if (URL_ATTRS.has(name) && !isSafeUrl(attr.value, { allowDataImage: tag === 'img' && name === 'src' })) {
      el.removeAttribute(attr.name);
      return;
    }
    if (name === 'style' && !isSafeStyle(attr.value)) {
      el.removeAttribute(attr.name);
    }
  });
  if (tag === 'a') {
    // window.opener protection for any link that opens a new tab.
    if ((el.getAttribute('target') || '').toLowerCase() === '_blank') {
      el.setAttribute('rel', 'noopener noreferrer');
    } else if (el.hasAttribute('target')) {
      el.removeAttribute('target');
    }
  }
  void doc;
}

function walk(node, doc) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === 8) {
      child.remove(); // comments (conditional-comment tricks)
      return;
    }
    if (child.nodeType !== 1) return; // text stays as is
    const tag = child.tagName.toLowerCase();
    if (DROP_TAGS.has(tag)) {
      child.remove();
      return;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      // Unknown / unsafe wrapper: keep the (sanitized) children, drop the element itself.
      walk(child, doc);
      child.replaceWith(...child.childNodes);
      return;
    }
    cleanElement(child, doc);
    walk(child, doc);
  });
}

/**
 * Sanitize untrusted HTML. Uses DOMParser, which builds an inert document: scripts do not run and images do not
 * load while parsing (unlike assigning to `innerHTML` of an element in the live document).
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') {
    // No DOM (SSR / tests): fail closed by escaping everything.
    return String(html).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  walk(doc.body, doc);
  return doc.body.innerHTML;
}

/** Text content of untrusted HTML without ever touching the live document (`div.innerHTML = x` would run onerror=). */
export function htmlToText(html) {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return String(html).replace(/<[^>]*>/g, '');
  return new DOMParser().parseFromString(String(html), 'text/html').body.textContent || '';
}

/** Plain text (legacy) → breaks; HTML → sanitized. */
export function cmsContentToHtml(content) {
  if (!content) return '';
  if (isHtmlContent(content)) return sanitizeHtml(content);
  return sanitizeHtml(
    content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
  );
}
