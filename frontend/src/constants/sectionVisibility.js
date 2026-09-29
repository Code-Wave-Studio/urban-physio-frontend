import { isFlagOn } from './communityPreview.js';

/** Missing flags stay visible so existing pages do not disappear. */
export function isSectionOn(sections, key) {
  return isFlagOn(sections?.[key] ?? '1');
}
