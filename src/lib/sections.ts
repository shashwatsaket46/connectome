import { useEffect, useState } from "react";

export type ExperimentSection = { key: string; label: string; group?: string };

const store = new Map<string, ExperimentSection[]>();
const listeners = new Set<() => void>();

export function setSections(id: string, sections: ExperimentSection[]) {
  const prev = store.get(id);
  if (prev && prev.length === sections.length && prev.every((p, i) => p.key === sections[i]?.key)) {
    return;
  }
  store.set(id, sections);
  listeners.forEach((l) => l());
}

export function useSections(id?: string) {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return id ? (store.get(id) ?? []) : [];
}
