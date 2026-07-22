import type { RevisionEventPayload } from '../../shared/contracts';

export type RevisionListener = (revision: number) => void;

/** Subscribe to server revision events. LL-102 will wire reconnect/refetch fully. */
export function subscribeToRevisions(onRevision: RevisionListener): () => void {
  const source = new EventSource('/api/events');

  const handleRevision = (event: MessageEvent<string>) => {
    try {
      const payload = JSON.parse(event.data) as RevisionEventPayload;
      onRevision(payload.revision);
    } catch {
      // ignore malformed payloads during scaffold
    }
  };

  source.addEventListener('revision', handleRevision as EventListener);

  return () => {
    source.removeEventListener('revision', handleRevision as EventListener);
    source.close();
  };
}
