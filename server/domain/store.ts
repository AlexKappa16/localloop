import { createEmptyDemoState } from '../../shared/seedSnapshot';
import type { DemoState } from '../../shared/types';

export type StoreListener = (revision: number) => void;

let state: DemoState = createEmptyDemoState(1);
const listeners = new Set<StoreListener>();

export function getSnapshot(): DemoState {
  return structuredClone(state);
}

export function getRevision(): number {
  return state.revision;
}

export function subscribe(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const listener of listeners) {
    listener(state.revision);
  }
}

export function mutateState(
  mutator: (draft: DemoState) => void,
): DemoState {
  const draft = structuredClone(state);
  mutator(draft);
  draft.revision = state.revision + 1;
  state = draft;
  notify();
  return getSnapshot();
}

export function resetStore(): DemoState {
  state = createEmptyDemoState(state.revision + 1);
  notify();
  return getSnapshot();
}

/** Replace full state while preserving monotonic revision bump. */
export function replaceState(next: DemoState): DemoState {
  state = {
    ...structuredClone(next),
    revision: state.revision + 1,
  };
  notify();
  return getSnapshot();
}
