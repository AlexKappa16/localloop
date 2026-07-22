import type { ApiErrorBody, MutationResponse } from '../../shared/contracts';
import type { DemoState } from '../../shared/types';

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiErrorBody;
  if (!response.ok) {
    const err = data as ApiErrorBody;
    throw new Error(err.error?.messageKa ?? 'მოთხოვნა ვერ შესრულდა');
  }
  return data as T;
}

export async function fetchHealth(): Promise<{ ok: true; revision: number }> {
  const res = await fetch('/api/health');
  return parseJson(res);
}

export async function fetchState(): Promise<DemoState> {
  const res = await fetch('/api/state');
  return parseJson(res);
}

export async function resetDemo(): Promise<MutationResponse<{ reset: true }>> {
  const res = await fetch('/api/demo/reset', { method: 'POST' });
  return parseJson(res);
}
