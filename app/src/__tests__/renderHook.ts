/**
 * Minimal renderHook / act utilities built on top of React 19's built-in
 * `act` and `react-dom/client#createRoot`.  No third-party packages needed.
 *
 * Use these only in `// @vitest-environment jsdom` test files.
 */
import { act as reactAct, createElement, type MutableRefObject, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

interface RenderHookResult<T> {
  /** Latest value returned by the hook. */
  resultRef: MutableRefObject<T>;
  /** Re-renders the hook wrapper, flushing all pending React updates. */
  rerender: () => Promise<void>;
  /** Unmounts and removes the container from the DOM. */
  unmount: () => Promise<void>;
}

/**
 * Renders `useHook` inside a minimal functional React component and returns a
 * mutable ref whose `.current` is updated on every render.
 *
 * If the hook returns a value that must be attached to a real DOM element
 * (e.g. it contains a `ref` that the hook observes), pass a `createWrapper`
 * factory that receives the hook result and returns the JSX to render.
 */
export async function renderHook<T>(
  useHook: () => T,
  createWrapper?: (hookResult: T) => ReactElement | null
): Promise<RenderHookResult<T>> {
  // Named "resultRef" so the react-hooks/immutability ESLint rule treats
  // mutations inside the Wrapper component as a ref assignment (allowed).
  const resultRef = { current: undefined as unknown as T };
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root: Root;

  function Wrapper() {
    const hookResult = useHook();
    resultRef.current = hookResult;
    return createWrapper ? createWrapper(hookResult) : null;
  }

  await reactAct(async () => {
    root = createRoot(container);
    root.render(createElement(Wrapper));
  });

  return {
    resultRef: resultRef as MutableRefObject<T>,
    rerender: async () => {
      await reactAct(async () => {
        root.render(createElement(Wrapper));
      });
    },
    unmount: async () => {
      await reactAct(async () => {
        root.unmount();
        container.remove();
      });
    },
  };
}

/**
 * Wraps a synchronous callback in React's `act` so that any state updates
 * triggered by the callback are flushed before the promise resolves.
 */
export async function act(callback: () => void): Promise<void> {
  await reactAct(async () => {
    callback();
  });
}
