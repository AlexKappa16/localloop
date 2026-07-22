import { createEmptyDemoState } from '../../shared/seedSnapshot';
import type { DemoState } from '../../shared/types';

let state: DemoState = createEmptyDemoState(1);

export function getSnapshot(): DemoState {
  return structuredClone(state);
}

export function resetStore(): DemoState {
  state = createEmptyDemoState(state.revision + 1);
  return getSnapshot();
}

/** LL-102 will replace this with full transition + subscription support. */
export function replaceState(next: DemoState): DemoState {
  state = structuredClone(next);
  return getSnapshot();
}
