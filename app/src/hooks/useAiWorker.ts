/**
 * useAiWorker.ts
 *
 * React hook that manages the aiWorker lifecycle: instantiates the worker
 * eagerly when the hosting component mounts, exposes typed send-methods, and
 * cleans up on unmount to prevent memory leaks.
 *
 * The Worker is loaded via Vite's `new Worker(new URL(…))` pattern,
 * which causes it to be bundled as a separate async chunk and keeps
 * it out of the critical-path JS payload.
 *
 * Usage
 * ──────────────────────────────────────────────────────────────────────────
 *   const { runInference, queryMemory, isReady, backend, memoryStats } =
 *     useAiWorker({ onResult: (out) => console.log(out.scores) });
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type {
  AnalyticsInput,
  AnalyticsOutput,
  MemoryStats,
} from '../workers/aiWorker';

// ---------------------------------------------------------------------------
// Hook options and return types
// ---------------------------------------------------------------------------

interface UseAiWorkerOptions {
  /** Called whenever a RUN_INFERENCE response is received from the worker. */
  onResult?: (output: AnalyticsOutput) => void;
  /** Called on MEMORY_STATS responses. */
  onMemoryStats?: (stats: MemoryStats) => void;
  /** Called when the worker emits an ERROR message. */
  onError?: (message: string) => void;
}

interface UseAiWorkerReturn {
  /**
   * Load an ONNX model into the worker.
   * Once loaded, subsequent `runInference` calls use the model; before loading
   * they use the built-in JS fallback.
   */
  loadModel: (modelUrl: string) => void;
  /** Send a feature vector to the worker for inference. */
  runInference: (input: AnalyticsInput) => void;
  /** Request a JS-heap memory snapshot from the worker. */
  queryMemory: () => void;
  /** True once the worker has confirmed a model is loaded (MODEL_READY). */
  isReady: boolean;
  /** The ONNX execution backend in use ('webgpu', 'wasm', or 'js-fallback'). */
  backend: string;
  /** Most recent memory snapshot, or null if none has been received yet. */
  memoryStats: MemoryStats | null;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function useAiWorker(options: UseAiWorkerOptions = {}): UseAiWorkerReturn {
  const { onResult, onMemoryStats, onError } = options;

  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [backend, setBackend] = useState('none');
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);

  // Stable callback refs so the message handler closure never becomes stale.
  const onResultRef     = useRef(onResult);
  const onMemoryRef     = useRef(onMemoryStats);
  const onErrorRef      = useRef(onError);

  // Keep the refs current after every render without triggering re-renders.
  useLayoutEffect(() => {
    onResultRef.current = onResult;
    onMemoryRef.current = onMemoryStats;
    onErrorRef.current  = onError;
  });

  useEffect(() => {
    // Vite recognises this pattern and bundles aiWorker.ts as a separate chunk.
    const worker = new Worker(
      new URL('../workers/aiWorker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (
      event: MessageEvent<
        | { type: 'MODEL_READY';      payload: { backend: string } }
        | { type: 'INFERENCE_RESULT'; payload: AnalyticsOutput }
        | { type: 'MEMORY_STATS';     payload: MemoryStats }
        | { type: 'ERROR';            message: string }
      >,
    ) => {
      switch (event.data.type) {
        case 'MODEL_READY':
          setBackend(event.data.payload.backend);
          setIsReady(true);
          break;
        case 'INFERENCE_RESULT':
          onResultRef.current?.(event.data.payload);
          break;
        case 'MEMORY_STATS':
          setMemoryStats(event.data.payload);
          onMemoryRef.current?.(event.data.payload);
          break;
        case 'ERROR':
          onErrorRef.current?.(event.data.message);
          break;
      }
    };

    workerRef.current = worker;

    return () => {
      // Terminate the worker on unmount to free the WASM heap.
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const loadModel = useCallback((modelUrl: string) => {
    workerRef.current?.postMessage({ type: 'LOAD_MODEL', payload: { modelUrl } });
  }, []);

  const runInference = useCallback((input: AnalyticsInput) => {
    workerRef.current?.postMessage({ type: 'RUN_INFERENCE', payload: input });
  }, []);

  const queryMemory = useCallback(() => {
    workerRef.current?.postMessage({ type: 'QUERY_MEMORY' });
  }, []);

  return { loadModel, runInference, queryMemory, isReady, backend, memoryStats };
}
