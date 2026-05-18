export interface SimulationVariables {
  soilPH: number;
  rainfallMm: number;
  nitrogenLevel: number;
  agentDensity: number;
}

export interface SimulationResult {
  yieldKg: number;
  confidence: number;
  efficiency: number;
  volatilityState: 'Stable' | 'Volatile' | 'Extreme';
}

/**
 * YieldSimulator — Core mathematical model for the Solaris CET Land-Agent simulation.
 * Implements advanced stochastic modeling including Markov chains for weather volatility
 * and non-linear nutrient depletion cycles for high-efficiency RWA simulation.
 */
export class YieldSimulator {
  /**
   * Calculates the theoretical yield for a parcel of land using the RAV Simulation Protocol.
   *
   * @param vars - Environmental and agent variables.
   * @param prevState - Optional previous Markov state for temporal continuity.
   * @returns Predicted yield and efficiency metrics.
   */
  static calculate(vars: SimulationVariables, prevState: number = 0): SimulationResult {
    const { soilPH, rainfallMm, nitrogenLevel, agentDensity } = vars;

    // 1. Markov Chain Weather Volatility State
    // States: 0 (Stable), 1 (Volatile), 2 (Extreme)
    // Transition Matrix P:
    // [0.85, 0.10, 0.05]
    // [0.20, 0.60, 0.20]
    // [0.10, 0.30, 0.60]
    const r = Math.random();
    let currentState = 0;
    if (prevState === 0) {
      if (r < 0.85) currentState = 0;
      else if (r < 0.95) currentState = 1;
      else currentState = 2;
    } else if (prevState === 1) {
      if (r < 0.20) currentState = 0;
      else if (r < 0.80) currentState = 1;
      else currentState = 2;
    } else {
      if (r < 0.10) currentState = 0;
      else if (r < 0.40) currentState = 1;
      else currentState = 2;
    }

    const volatilityMultiplier = currentState === 0 ? 1.0 : currentState === 1 ? 0.85 : 0.6;
    const states: ('Stable' | 'Volatile' | 'Extreme')[] = ['Stable', 'Volatile', 'Extreme'];

    // 2. Soil pH Factor: Ideal range for most crops is 6.0 - 7.0.
    const phFactor = Math.exp(-Math.pow(soilPH - 6.5, 2) / 2.0);

    // 3. Rainfall Factor: Romanian agricultural average ideal is ~700mm/year.
    const rainFactor = Math.exp(-Math.pow(rainfallMm - 700, 2) / 50000);

    // 4. Non-linear Nutrient Depletion (Nitrogen Cycle)
    // Modeled as a Sigmoid-derivative to represent rapid depletion at high growth phases.
    const nRatio = nitrogenLevel / 100;
    const nFactor = (1 / (1 + Math.exp(-10 * (nRatio - 0.5)))) * (1.1 - 0.2 * nRatio);

    // 5. Agent Density Factor: Diminishing returns / congestion model.
    const optimalDensity = 1000;
    const x = agentDensity / optimalDensity;
    const densityFactor = x > 0 ? x * Math.exp(1 - x) : 0;

    // Base Yield: 5500 kg/ha (standard regional baseline)
    const baseYield = 5500;

    // Combine factors with weighted influence
    const environmentalMultiplier = (phFactor * 0.35) + (rainFactor * 0.35) + (nFactor * 0.3);
    const agentMultiplier = 0.85 + (0.5 * densityFactor); // Agents boost yield by up to 50%

    const yieldKg = baseYield * environmentalMultiplier * agentMultiplier * volatilityMultiplier;

    return {
      yieldKg: Math.max(0, yieldKg),
      confidence: 0.92 + (Math.random() * 0.05) - (currentState * 0.1),
      efficiency: (environmentalMultiplier + densityFactor) / 2,
      volatilityState: states[currentState],
    };
  }
}
