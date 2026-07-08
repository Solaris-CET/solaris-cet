import { YieldSimulator } from '../lib/simulationEngine';
import type { SimulationVariables, SimulationResult } from '../lib/simulationEngine';

/**
 * Simulation Worker — Handles high-density Monte Carlo simulations
 * for the 200,000 agents without blocking the main UI thread.
 */

const MAX_ITERATIONS = 1_000_000;

let active = false;

function postError(message: string) {
  self.postMessage({ type: 'SIMULATION_ERROR', payload: { message } });
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'CANCEL') {
    active = false;
    return;
  }

  if (type !== 'RUN_MONTE_CARLO') {
    postError(`Unknown message type: ${String(type)}`);
    return;
  }

  const vars = payload?.vars as SimulationVariables | undefined;
  if (!vars || typeof vars !== 'object') {
    postError('Missing or invalid simulation variables.');
    return;
  }

  let iterations = Math.max(1, Math.min(MAX_ITERATIONS, Number(payload.iterations) || 1000));
  if (!Number.isFinite(iterations)) iterations = 1000;

  active = true;

  try {
    let totalYield = 0;
    const results: SimulationResult[] = [];

    // Monte Carlo simulation with stochastic noise on environmental variables
    for (let i = 0; i < iterations; i++) {
      if (!active) {
        postError('Simulation cancelled by host.');
        return;
      }

      const noisyVars: SimulationVariables = {
        soilPH: vars.soilPH + (Math.random() - 0.5) * 0.2,
        rainfallMm: vars.rainfallMm + (Math.random() - 0.5) * 50,
        nitrogenLevel: vars.nitrogenLevel + (Math.random() - 0.5) * 5,
        agentDensity: vars.agentDensity,
      };

      const res = YieldSimulator.calculate(noisyVars);
      totalYield += res.yieldKg;
      results.push(res);
    }

    const averageYield = totalYield / iterations;
    const variance = results.reduce((acc, r) => acc + Math.pow(r.yieldKg - averageYield, 2), 0) / iterations;
    const stdDev = Math.sqrt(variance);

    self.postMessage({
      type: 'SIMULATION_COMPLETE',
      payload: {
        averageYield,
        stdDev,
        iterations,
        confidenceInterval: [
          averageYield - 1.96 * (stdDev / Math.sqrt(iterations)),
          averageYield + 1.96 * (stdDev / Math.sqrt(iterations)),
        ],
      },
    });
  } catch (err) {
    postError(err instanceof Error ? err.message : 'Simulation failed.');
  } finally {
    active = false;
  }
};
