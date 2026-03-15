/**
 * aiWorker.ts
 *
 * Edge-AI Web Worker that offloads on-device ONNX model inference and
 * token-analytics computations to the client's WebAssembly / WebGPU runtime,
 * eliminating cloud compute costs and keeping the main thread unblocked.
 *
 * Supported execution backends (probed in priority order):
 *   1. webgpu  — GPU-accelerated via navigator.gpu (Chromium 113+)
 *   2. wasm    — Universal WebAssembly fallback (all modern browsers)
 *
 * Memory leak prevention
 *   ─ InferenceSession is created once per LOAD_MODEL and reused for all
 *     subsequent RUN_INFERENCE calls.
 *   ─ Input and output Tensor objects are explicitly disposed after every run
 *     so WASM heap memory is reclaimed immediately.
 *   ─ QUERY_MEMORY responds with the current JS-heap snapshot (Chromium) and
 *     timestamp so the host page can track heap growth over time.
 *
 * If the bundle size of the main thread exceeds 500 KB, onnxruntime-web is
 * only dynamically imported inside the worker (never in main-thread code),
 * so it never contributes to the initial JS payload. Brotli compression and
 * lazy-loading in vite.config.ts handle the rest.
 *
 * Message protocol
 * ──────────────────────────────────────────────────────────────────────────
 * Incoming  { type: 'LOAD_MODEL',       payload: { modelUrl: string } }
 *           { type: 'RUN_INFERENCE',    payload: AnalyticsInput }
 *           { type: 'QUERY_MEMORY' }
 *
 * Outgoing  { type: 'MODEL_READY',      payload: { backend: string } }
 *           { type: 'INFERENCE_RESULT', payload: AnalyticsOutput }
 *           { type: 'MEMORY_STATS',     payload: MemoryStats }
 *           { type: 'ERROR',            message: string }
 */

import type { InferenceSession, Tensor } from 'onnxruntime-web';

// Keep in sync with the version pinned in package.json.
const ORT_CDN_BASE =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';

// ---------------------------------------------------------------------------
// Public types (importable by host components)
// ---------------------------------------------------------------------------

/**
 * Float32 feature vector describing a single analytics sample.
 * Typical layout: [price, volume24h, liquidity, priceChange7d, marketCapRatio]
 */
export interface AnalyticsInput {
  features: number[];
  /** Optional caller-defined label echoed back in the result. */
  label?: string;
}

/** Result of one inference run (or the JS fallback computation). */
export interface AnalyticsOutput {
  /** Output scores produced by the model or JS fallback. */
  scores: number[];
  /** Wall-clock milliseconds consumed by the call. */
  latencyMs: number;
  /** Echo of the input label, if provided. */
  label?: string;
  /** Name of the execution backend used for this run. */
  backend: string;
}

/** JS-heap memory snapshot for external leak monitoring. */
export interface MemoryStats {
  /**
   * JS heap used in bytes (Chromium only via `performance.memory`).
   * Null on Firefox, Safari, and other runtimes.
   */
  jsHeapUsedBytes: number | null;
  /** Unix epoch timestamp of the snapshot. */
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Discriminated-union inbound message types
// ---------------------------------------------------------------------------

type InboundMessage =
  | { type: 'LOAD_MODEL';    payload: { modelUrl: string } }
  | { type: 'RUN_INFERENCE'; payload: AnalyticsInput }
  | { type: 'QUERY_MEMORY' };

// ---------------------------------------------------------------------------
// Worker-internal state
// ---------------------------------------------------------------------------

let session: InferenceSession | null = null;
let activeBackend: string = 'none';

// ---------------------------------------------------------------------------
// WebGPU availability probe
// ---------------------------------------------------------------------------

async function resolveBackend(): Promise<'webgpu' | 'wasm'> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return 'wasm';
  try {
    const gpu = (
      navigator as unknown as { gpu: { requestAdapter(): Promise<unknown | null> } }
    ).gpu;
    const adapter = await gpu.requestAdapter();
    return adapter !== null ? 'webgpu' : 'wasm';
  } catch {
    return 'wasm';
  }
}

// ---------------------------------------------------------------------------
// Model loading
// ---------------------------------------------------------------------------

async function loadModel(modelUrl: string): Promise<void> {
  // Dynamic import keeps onnxruntime-web out of the main-thread bundle.
  // WASM binaries are served from the CDN so the Service Worker can cache
  // them for fully-offline execution (see vite.config.ts runtimeCaching).
  const ort = await import('onnxruntime-web');
  const backend = await resolveBackend();

  ort.env.wasm.wasmPaths = ORT_CDN_BASE;

  session = await ort.InferenceSession.create(modelUrl, {
    executionProviders: [backend, 'wasm'],
    graphOptimizationLevel: 'all',
    executionMode: 'sequential',
  });

  activeBackend = backend;
  self.postMessage({ type: 'MODEL_READY', payload: { backend } });
}

// ---------------------------------------------------------------------------
// Inference
// ---------------------------------------------------------------------------

async function runInference(input: AnalyticsInput): Promise<void> {
  const t0 = performance.now();
  let scores: number[] = [];
  let backend: string;

  if (session !== null) {
    const ort = await import('onnxruntime-web');

    const inputName  = session.inputNames[0]  ?? 'input';
    const outputName = session.outputNames[0] ?? 'output';

    const inputTensor = new ort.Tensor(
      'float32',
      new Float32Array(input.features),
      [1, input.features.length],
    );

    let outputTensor: Tensor | undefined;
    try {
      const results  = await session.run({ [inputName]: inputTensor });
      const rawValue = results[outputName];
      if (rawValue != null) {
        outputTensor = rawValue as Tensor;
        scores = Array.from(outputTensor.data as Float32Array);
      }
    } finally {
      // Dispose tensors immediately to release WASM heap memory.
      inputTensor.dispose();
      outputTensor?.dispose();
    }

    backend = activeBackend;
  } else {
    // JS-only fallback: z-score normalise features to the range [−1, 1].
    scores  = zScoreNormalise(input.features);
    backend = 'js-fallback';
  }

  const output: AnalyticsOutput = {
    scores,
    latencyMs: Number((performance.now() - t0).toFixed(2)),
    label:     input.label,
    backend,
  };

  self.postMessage({ type: 'INFERENCE_RESULT', payload: output });
}

/** Z-score normalise an array of numbers, clamped to [−1, 1]. */
function zScoreNormalise(values: number[]): number[] {
  if (values.length === 0) return [];
  const mean     = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std      = Math.sqrt(variance) || 1; // ||1 guards against all-identical inputs (variance=0)
  return values.map(v => Math.max(-1, Math.min(1, (v - mean) / std)));
}

// ---------------------------------------------------------------------------
// Memory monitoring
// ---------------------------------------------------------------------------

function queryMemory(): void {
  // performance.memory is a non-standard Chromium extension.
  type PerfWithMemory = Performance & { memory?: { usedJSHeapSize: number } };
  const jsHeapUsedBytes =
    (performance as PerfWithMemory).memory?.usedJSHeapSize ?? null;

  const stats: MemoryStats = {
    jsHeapUsedBytes,
    timestamp: Date.now(),
  };

  self.postMessage({ type: 'MEMORY_STATS', payload: stats });
}

// ---------------------------------------------------------------------------
// Message dispatcher
// ---------------------------------------------------------------------------

self.onmessage = async (event: MessageEvent<InboundMessage>): Promise<void> => {
  try {
    switch (event.data.type) {
      case 'LOAD_MODEL':
        await loadModel(event.data.payload.modelUrl);
        break;

      case 'RUN_INFERENCE':
        await runInference(event.data.payload);
        break;

      case 'QUERY_MEMORY':
        queryMemory();
        break;

      default: {
        // Exhaustiveness guard — causes a compile error for unhandled message types.
        const _exhaustive: never = event.data;
        void _exhaustive;
      }
    }
  } catch (err) {
    self.postMessage({
      type: 'ERROR',
      message: err instanceof Error ? err.message : 'Unknown error in aiWorker',
    });
  }
};

