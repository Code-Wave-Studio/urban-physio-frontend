export const FLOATING_ACTIONS_EVENT = 'tup-floating-actions';

const hideSources = new Set();
const bookbarSources = new Set();

function emit() {
  window.dispatchEvent(
    new CustomEvent(FLOATING_ACTIONS_EVENT, { detail: { hidden: hideSources.size > 0 } })
  );
}

function syncMobileBookbar() {
  if (typeof document === 'undefined') return;
  if (bookbarSources.size > 0) document.body.dataset.mobileBookbar = '1';
  else delete document.body.dataset.mobileBookbar;
}

/** Hide floating WhatsApp / scroll-top. Pass a unique source so multiple overlays can stack safely. */
export function setFloatingActionsHidden(hidden, source = 'overlay') {
  if (hidden) hideSources.add(source);
  else hideSources.delete(source);
  emit();
}

/** Reserve space above the mobile service booking bar so call / WhatsApp / scroll-top sit clear of it. */
export function setMobileBookbarVisible(visible, source = 'bookbar') {
  if (visible) bookbarSources.add(source);
  else bookbarSources.delete(source);
  syncMobileBookbar();
}
