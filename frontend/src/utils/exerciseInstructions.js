/**
 * Display-only helpers for exercise instruction presentation.
 * Does not invent clinical content — only formats existing text/steps.
 */

function stepText(step) {
  if (step == null) return '';
  if (typeof step === 'string') return step.trim();
  if (typeof step === 'object') {
    const raw = step.text || step.step || step.instruction || step.title || '';
    return String(raw).trim();
  }
  return String(step).trim();
}

/**
 * Prefer structured `steps` from the API; otherwise split plain text
 * on newlines / numbered lines without rewriting clinical wording.
 *
 * @returns {string[]}
 */
export function normalizeInstructionSteps({
  steps,
  instructions,
  exercise_instructions,
} = {}) {
  if (Array.isArray(steps) && steps.length > 0) {
    return steps.map(stepText).filter(Boolean);
  }

  const raw = String(exercise_instructions || instructions || '').trim();
  if (!raw) return [];

  // Numbered / bulleted lines (preserve each line as a step)
  const lineSplit = raw
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*(?:\d+[\).\]]\s*|[-*•]\s+)/, '').trim())
    .filter(Boolean);

  if (lineSplit.length > 1) return lineSplit;

  // Single block: soft-split on sentence boundaries only when clearly multi-sentence
  const sentences = raw
    .split(/([.!?])\s+(?=[A-Z0-9])/)
    .reduce((acc, part, i, arr) => {
      if (!part) return acc;
      if (/^[.!?]$/.test(part)) {
        if (acc.length) acc[acc.length - 1] += part;
        return acc;
      }
      // Skip empty fragments from the capturing split
      if (i > 0 && /^[.!?]$/.test(arr[i - 1])) {
        acc.push(part.trim());
      } else {
        acc.push(part.trim());
      }
      return acc;
    }, [])
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length > 1 && sentences.length <= 12) return sentences;

  return [raw];
}

/**
 * Short preview for cards — first step or truncated plain text.
 */
export function instructionPreview(source, maxLen = 100) {
  const steps = normalizeInstructionSteps(source);
  if (!steps.length) return '';
  const text = steps[0];
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trim()}…`;
}
