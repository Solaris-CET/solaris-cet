declare module '@pact-foundation/pact' {
  export class PactV3 {
    constructor(options: unknown)
    uponReceiving(description: string): PactV3
    withRequest(options: unknown): PactV3
    willRespondWith(options: unknown): PactV3
    executeTest(fn: (mockServer: { url: string }) => Promise<void>): Promise<void>
  }

  export const MatchersV3: {
    regex(example: string, pattern: string): unknown
    like<T>(value: T): T
  }
}
