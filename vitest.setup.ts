import "@testing-library/jest-dom/vitest";

// jsdom has no layout engine and never implements `ResizeObserver` — components
// that measure their own container (e.g. a responsive canvas chart) need at
// least a no-op stub to construct without throwing in tests.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
