export const FLOATING_ACTIONS_EVENT = 'tup-floating-actions';

const hideSources = new Set();

function emit() {
  window.dispatchEvent(
    new CustomEvent(FLOATING_ACTIONS_EVENT, { detail: { hidden: hideSources.size > 0 } })
  );
}

/** Hide floating WhatsApp / scroll-top. Pass a unique source so multiple overlays can stack safely. */
export function setFloatingActionsHidden(hidden, source = 'overlay') {
  if (hidden) hideSources.add(source);
  else hideSources.delete(source);
  emit();
}
