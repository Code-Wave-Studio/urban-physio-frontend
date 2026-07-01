export const FLOATING_ACTIONS_EVENT = 'tup-floating-actions';

export function setFloatingActionsHidden(hidden) {
  window.dispatchEvent(new CustomEvent(FLOATING_ACTIONS_EVENT, { detail: { hidden } }));
}
