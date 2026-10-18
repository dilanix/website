"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

const STORAGE_PREFIX = "dilanix.dashboard.filters.v1";
const STORAGE_EVENT = "dilanix:dashboard-filter-storage";
const DashboardFilterNamespaceContext = createContext("anonymous");

function fullKey(namespace: string, key: string) {
  return `${STORAGE_PREFIX}:${namespace}:${key}`;
}

function readRaw(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function emit(storageKey: string) {
  window.dispatchEvent(
    new CustomEvent(STORAGE_EVENT, { detail: { key: storageKey } }),
  );
}

function writeDashboardFilter<T>(storageKey: string, value: T) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
    emit(storageKey);
  } catch {}
}

export function DashboardFilterStorageProvider({
  namespace,
  children,
}: {
  namespace: string;
  children: ReactNode;
}) {
  return createElement(
    DashboardFilterNamespaceContext.Provider,
    { value: namespace },
    children,
  );
}

function parseStored<T>(
  raw: string | null,
  validate: (value: unknown) => value is T,
) {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return validate(value) ? value : null;
  } catch {
    return null;
  }
}

export function useDashboardFilterState<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
  options?: { fallbackPriority?: boolean },
): [T, Dispatch<SetStateAction<T>>, { restored: boolean }] {
  const namespace = useContext(DashboardFilterNamespaceContext);
  const storageKey = fullKey(namespace, key);
  const fallbackRef = useRef(fallback);
  useEffect(() => {
    fallbackRef.current = fallback;
  }, [fallback]);
  const subscribe = useCallback(
    (notify: () => void) => {
      function onStorage(event: StorageEvent) {
        if (event.key === storageKey) notify();
      }
      function onDashboardStorage(event: Event) {
        if (event instanceof CustomEvent && event.detail?.key === storageKey) {
          notify();
        }
      }
      window.addEventListener("storage", onStorage);
      window.addEventListener(STORAGE_EVENT, onDashboardStorage);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(STORAGE_EVENT, onDashboardStorage);
      };
    },
    [storageKey],
  );
  const getSnapshot = useCallback(() => readRaw(storageKey), [storageKey]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const stored = useMemo(() => parseStored(raw, validate), [raw, validate]);
  const fallbackPriority = options?.fallbackPriority === true;
  const serializedFallback = useMemo(
    () => JSON.stringify(fallback),
    [fallback],
  );
  const priorityMarker = fallbackPriority
    ? `${storageKey}\u0000${serializedFallback}`
    : null;
  const [appliedPriorityMarker, setAppliedPriorityMarker] = useState<
    string | null
  >(null);
  const prioritizeFallback =
    priorityMarker !== null && appliedPriorityMarker !== priorityMarker;
  useEffect(() => {
    if (priorityMarker === null) {
      if (appliedPriorityMarker === null) return;
      const reset = window.setTimeout(() => setAppliedPriorityMarker(null), 0);
      return () => window.clearTimeout(reset);
    }
    if (!prioritizeFallback) return;
    if (JSON.stringify(stored) !== serializedFallback) {
      writeDashboardFilter(storageKey, fallbackRef.current);
    }
    const complete = window.setTimeout(
      () => setAppliedPriorityMarker(priorityMarker),
      0,
    );
    return () => window.clearTimeout(complete);
  }, [
    appliedPriorityMarker,
    prioritizeFallback,
    priorityMarker,
    serializedFallback,
    storageKey,
    stored,
  ]);
  const value = prioritizeFallback ? fallback : (stored ?? fallback);
  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      const current =
        parseStored(readRaw(storageKey), validate) ?? fallbackRef.current;
      writeDashboardFilter(
        storageKey,
        typeof next === "function"
          ? (next as (current: T) => T)(current)
          : next,
      );
    },
    [storageKey, validate],
  );

  return [
    value,
    setValue,
    { restored: !prioritizeFallback && stored !== null },
  ];
}
