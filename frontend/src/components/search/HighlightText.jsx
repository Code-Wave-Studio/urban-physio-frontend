/**
 * Safely highlights query keywords inside a text string.
 *
 * XSS-safe by design: it never uses dangerouslySetInnerHTML. The text is split on
 * matched tokens and the matches are rendered as <mark> React nodes, so any user- or
 * DB-supplied content is always escaped by React.
 */

/** Escape a string for safe use inside a RegExp. */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Break a raw query into meaningful, de-duplicated tokens (>= 2 chars). */
function queryTokens(query) {
  return [
    ...new Set(
      String(query || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 2)
    ),
  ];
}

export default function HighlightText({ text, query, className = '' }) {
  const value = text == null ? '' : String(text);
  const tokens = queryTokens(query);

  if (!value || tokens.length === 0) {
    return <span className={className}>{value}</span>;
  }

  // Longest tokens first so "physiotherapy" wins over "physio" when both are present.
  const sorted = [...tokens].sort((a, b) => b.length - a.length);
  const tokenSet = new Set(sorted);
  const pattern = sorted.map(escapeRegExp).join('|');

  let regex;
  try {
    // Capturing group => matched delimiters are kept in the split output.
    regex = new RegExp(`(${pattern})`, 'gi');
  } catch {
    return <span className={className}>{value}</span>;
  }

  const parts = value.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part && tokenSet.has(part.toLowerCase()) ? (
          // eslint-disable-next-line react/no-array-index-key
          <mark key={i} className="bg-orange-100 text-orange-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
