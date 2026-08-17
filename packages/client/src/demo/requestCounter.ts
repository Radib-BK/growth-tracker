import { useSyncExternalStore } from "react";

// Counts requests per query, so a panel can show only its own traffic.
// Called from inside a queryFn, which runs exactly when a fetch happens.
const counts = new Map<string, number>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function countRequest(label: string) {
  counts.set(label, (counts.get(label) ?? 0) + 1);
  emit();
}

export function resetRequestCount(label: string) {
  counts.set(label, 0);
  emit();
}

export function useRequestCount(label: string) {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => counts.get(label) ?? 0,
  );
}
