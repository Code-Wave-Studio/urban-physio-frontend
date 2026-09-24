/**
 * Highlight query tokens in text.
 * XSS-safe: never uses dangerouslySetInnerHTML — matches render as <mark> nodes so React escapes content.
 */

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

  // Longest first so "physiotherapy" wins over "physio"
  const sorted = [...tokens].sort((a, b) => b.length - a.length);
  const tokenSet = new Set(sorted);
  const pattern = sorted.map(escapeRegExp).join('|');

  let regex;
  try {
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
