declare module 'onnxruntime-web' {
  export const env: { wasm: { wasmPaths: string | Record<string, string> } };

  export class Tensor {
    data: unknown;
    constructor(type: string, data: Float32Array, dims: number[]);
    dispose(): void;
  }

  export class InferenceSession {
    inputNames: string[];
    outputNames: string[];
    run(feeds: Record<string, Tensor>): Promise<Record<string, Tensor>>;
    static create(modelUrl: string, options?: Record<string, unknown>): Promise<InferenceSession>;
  }
}

