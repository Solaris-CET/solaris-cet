import { YieldSimulator } from '../lib/simulationEngine';
import type { SimulationVariables, SimulationResult } from '../lib/simulationEngine';

/**
 * Simulation Worker — Handles high-density Monte Carlo simulations
 * for the 200,000 agents without blocking the main UI thread.
 */

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'RUN_MONTE_CARLO') {
    const { vars, iterations = 1000 } = payload as { vars: SimulationVariables, iterations: number };

    // Welford's Algorithm for incremental mean and variance calculation.
    // O(1) space complexity, allowing millions of iterations on Hetzner 16GB RAM.
    let count = 0;
    let mean = 0;
    let m2 = 0;
    let lastState = 0;

    // Monte Carlo simulation with stochastic noise on environmental variables
    for (let i = 0; i < iterations; i++) {
      const noisyVars: SimulationVariables = {
        soilPH: vars.soilPH + (Math.random() - 0.5) * 0.2,
        rainfallMm: vars.rainfallMm + (Math.random() - 0.5) * 50,
        nitrogenLevel: vars.nitrogenLevel + (Math.random() - 0.5) * 5,
        agentDensity: vars.agentDensity,
      };

      const res = YieldSimulator.calculate(noisyVars, lastState);
      const val = res.yieldKg;

      // Update state for next Markov step
      lastState = res.volatilityState === 'Stable' ? 0 : res.volatilityState === 'Volatile' ? 1 : 2;

      // Incremental mean/variance update
      count++;
      const delta = val - mean;
      mean += delta / count;
      const delta2 = val - mean;
      m2 += delta * delta2;
    }

    const averageYield = mean;
    const variance = count > 1 ? m2 / (count - 1) : 0;
    const stdDev = Math.sqrt(variance);

    self.postMessage({
      type: 'SIMULATION_COMPLETE',
      payload: {
        averageYield,
        stdDev,
        iterations,
        confidenceInterval: [
          averageYield - 1.96 * (stdDev / Math.sqrt(iterations)),
          averageYield + 1.96 * (stdDev / Math.sqrt(iterations))
        ]
      }
    });
  }
};
