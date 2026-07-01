import { useEffect, useState } from 'react';

export const SEARCH_TYPE_PHRASES = [
  'back pain near me',
  'physio in Noida',
  'knee pain specialist',
  'home visit physiotherapy',
  'sports injury rehab',
  'female physio near me',
  'ACL rehab',
  'neck pain doctor',
];

/**
 * Animated placeholder for empty search fields.
 * @param {string[]} phrases
 * @param {boolean} enabled
 * @param {string} activeQuery — pause animation when user has typed
 * @param {'try' | 'search'} prefix
 */
export function useTypingSearchPlaceholder(
  phrases = SEARCH_TYPE_PHRASES,
  enabled = true,
  activeQuery = '',
  prefix = 'try'
) {
  const [typed, setTyped] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!enabled || activeQuery.trim()) {
      setTyped('');
      return undefined;
    }

    const phrase = phrases[phraseIdx % phrases.length];
    const delay = deleting ? 35 : charIdx === phrase.length ? 1800 : 65;
    const t = setTimeout(() => {
      if (!deleting) {
        if (charIdx < phrase.length) {
          setTyped(phrase.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        } else {
          setDeleting(true);
        }
      } else if (charIdx > 0) {
        setTyped(phrase.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      } else {
        setDeleting(false);
        setPhraseIdx((i) => (i + 1) % phrases.length);
      }
    }, delay);

    return () => clearTimeout(t);
  }, [enabled, activeQuery, phraseIdx, charIdx, deleting, phrases]);

  if (activeQuery.trim()) {
    return prefix === 'search' ? 'Search physiotherapy…' : 'Try: back pain near me…';
  }
  if (!typed) {
    return prefix === 'search' ? 'Search physiotherapy…' : 'Try: back pain near me…';
  }
  return prefix === 'search' ? `Search ${typed}` : `Try: ${typed}`;
}
