/**
 * aiWorker.ts
 *
 * Client-side AI Web Worker using ONNX Runtime Web (WebAssembly/WebGPU backend).
 * Offloads all inference to the user's device — zero server compute required.
 *
 * Supported task families:
 *  - SOIL_ANALYSIS  – Soil & climate condition prediction
 *  - TOKEN_SIGNAL   – Simple token price-movement signal (heuristic model)
 *
 * Message protocol
 * ──────────────────────────────────────────────────────────────────────────
 * Incoming  { type: AiRequestType; id: string; payload: AiRequestPayload }
 * Outgoing  { type: AiResponseType; id: string; payload: AiResponsePayload }
 *           { type: 'ERROR';        id: string; message: string }
 */

import * as ort from 'onnxruntime-web';

// ── Configure ONNX Runtime ────────────────────────────────────────────────────
// Prefer WebGPU for GPU-accelerated inference; fall back to Wasm automatically.
ort.env.wasm.wasmPaths = './ort-wasm/';

// ── Request / Response types ──────────────────────────────────────────────────

export type AiRequestType = 'SOIL_ANALYSIS' | 'TOKEN_SIGNAL';
export type AiResponseType = 'SOIL_ANALYSIS_RESULT' | 'TOKEN_SIGNAL_RESULT';

export interface SoilAnalysisInput {
  /** Soil pH (0–14) */
  ph: number;
  /** Moisture content percentage (0–100) */
  moisture: number;
  /** Temperature °C */
  temperature: number;
  /** Nitrogen content ppm */
  nitrogen: number;
  /** Phosphorus content ppm */
  phosphorus: number;
  /** Potassium content ppm */
  potassium: number;
}

export interface SoilAnalysisResult {
  /** Predicted crop yield score (0–100) */
  yieldScore: number;
  /** Irrigation recommendation */
  irrigationNeeded: boolean;
  /** Fertilizer recommendation index (0 = none, 1 = low, 2 = medium, 3 = high) */
  fertilizerLevel: number;
  /** Confidence score (0–1) */
  confidence: number;
}

export interface TokenSignalInput {
  /** Spot price in TON per CET */
  priceTon: number;
  /** Relative volume (0–1, normalised against 30-day average) */
  relativeVolume: number;
  /** Pool TVL in TON */
  tvlTon: number;
}

export interface TokenSignalResult {
  /** Signal direction: 1 = bullish, 0 = neutral, -1 = bearish */
  signal: 1 | 0 | -1;
  /** Confidence (0–1) */
  confidence: number;
}

type AiRequestPayload = SoilAnalysisInput | TokenSignalInput;
type AiResponsePayload = SoilAnalysisResult | TokenSignalResult;

interface AiRequest {
  type: AiRequestType;
  id: string;
  payload: AiRequestPayload;
}

interface AiResponse {
  type: AiResponseType | 'ERROR';
  id: string;
  payload?: AiResponsePayload;
  message?: string;
}

// ── ONNX session cache ────────────────────────────────────────────────────────

const sessionCache = new Map<string, ort.InferenceSession>();

async function getSession(modelPath: string): Promise<ort.InferenceSession> {
  const cached = sessionCache.get(modelPath);
  if (cached) return cached;

  const session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ['webgpu', 'wasm'],
    graphOptimizationLevel: 'all',
  });

  sessionCache.set(modelPath, session);
  return session;
}

// ── Heuristic fallback (used when no ONNX model file is present) ──────────────
// Provides deterministic, interpretable results without requiring model files,
// enabling zero-dependency operation during development / cold start.

function soilHeuristic(input: SoilAnalysisInput): SoilAnalysisResult {
  const { ph, moisture, temperature, nitrogen, phosphorus, potassium } = input;

  const phScore = 1 - Math.abs(ph - 6.5) / 6.5;
  const moistureScore = moisture > 20 && moisture < 70 ? 1 : 0.4;
  const tempScore = temperature > 10 && temperature < 35 ? 1 : 0.3;
  const nutrientScore = Math.min(1, (nitrogen + phosphorus + potassium) / 300);

  const yieldScore = Math.round(
    ((phScore * 0.3 + moistureScore * 0.25 + tempScore * 0.2 + nutrientScore * 0.25) * 100)
  );

  return {
    yieldScore: Math.min(100, Math.max(0, yieldScore)),
    irrigationNeeded: moisture < 30,
    fertilizerLevel: nutrientScore < 0.25 ? 3 : nutrientScore < 0.5 ? 2 : nutrientScore < 0.75 ? 1 : 0,
    confidence: 0.72,
  };
}

function tokenHeuristic(input: TokenSignalInput): TokenSignalResult {
  const { priceTon, relativeVolume, tvlTon } = input;

  const volumeSignal = relativeVolume > 1.5 ? 1 : relativeVolume < 0.5 ? -1 : 0;
  const tvlSignal = tvlTon > 10 ? 1 : tvlTon < 2 ? -1 : 0;
  const priceSignal = priceTon > 0 ? 0 : -1; // negative price is invalid

  const rawSignal = volumeSignal + tvlSignal + priceSignal;
  const signal: 1 | 0 | -1 = rawSignal > 0 ? 1 : rawSignal < 0 ? -1 : 0;

  return {
    signal,
    confidence: Math.min(1, 0.45 + relativeVolume * 0.1),
  };
}

// ── ONNX inference (with heuristic fallback) ──────────────────────────────────

async function runSoilAnalysis(input: SoilAnalysisInput): Promise<SoilAnalysisResult> {
  try {
    const session = await getSession('./models/soil_analysis.onnx');
    const tensor = new ort.Tensor('float32', Float32Array.from([
      input.ph, input.moisture, input.temperature,
      input.nitrogen, input.phosphorus, input.potassium,
    ]), [1, 6]);

    const results = await session.run({ input: tensor });
    const outputData = results['output']?.data as Float32Array;

    return {
      yieldScore: Math.round(outputData[0] * 100),
      irrigationNeeded: outputData[1] > 0.5,
      fertilizerLevel: Math.round(outputData[2] * 3) as 0 | 1 | 2 | 3,
      confidence: outputData[3],
    };
  } catch {
    return soilHeuristic(input);
  }
}

async function runTokenSignal(input: TokenSignalInput): Promise<TokenSignalResult> {
  try {
    const session = await getSession('./models/token_signal.onnx');
    const tensor = new ort.Tensor('float32', Float32Array.from([
      input.priceTon, input.relativeVolume, input.tvlTon,
    ]), [1, 3]);

    const results = await session.run({ input: tensor });
    const outputData = results['output']?.data as Float32Array;
    const rawSignal = outputData[0];
    const signal: 1 | 0 | -1 = rawSignal > 0.33 ? 1 : rawSignal < -0.33 ? -1 : 0;

    return { signal, confidence: Math.abs(rawSignal) };
  } catch {
    return tokenHeuristic(input);
  }
}

// ── Worker message handler ────────────────────────────────────────────────────

self.onmessage = async (event: MessageEvent<AiRequest>) => {
  const { type, id, payload } = event.data;

  const respond = (response: AiResponse) => self.postMessage(response);

  try {
    switch (type) {
      case 'SOIL_ANALYSIS': {
        const result = await runSoilAnalysis(payload as SoilAnalysisInput);
        respond({ type: 'SOIL_ANALYSIS_RESULT', id, payload: result });
        break;
      }
      case 'TOKEN_SIGNAL': {
        const result = await runTokenSignal(payload as TokenSignalInput);
        respond({ type: 'TOKEN_SIGNAL_RESULT', id, payload: result });
        break;
      }
      default:
        respond({ type: 'ERROR', id, message: `Unknown request type: ${String(type)}` });
    }
  } catch (err) {
    respond({
      type: 'ERROR',
      id,
      message: err instanceof Error ? err.message : 'Unknown error in AI worker',
    });
  }
};
