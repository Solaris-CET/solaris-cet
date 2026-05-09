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
}

/**
 * YieldSimulator — Core mathematical model for the Solaris CET Land-Agent simulation.
 * Calculates agricultural output based on RWA environmental variables and agent optimization.
 */
export class YieldSimulator {
  /**
   * Calculates the theoretical yield for a parcel of land.
   *
   * @param vars - Environmental and agent variables.
   * @returns Predicted yield and efficiency metrics.
   */
  static calculate(vars: SimulationVariables): SimulationResult {
    const { soilPH, rainfallMm, nitrogenLevel, agentDensity } = vars;

    // 1. Soil pH Factor: Ideal range for most crops is 6.0 - 7.0.
    // Bell curve centered at 6.5.
    const phFactor = Math.exp(-Math.pow(soilPH - 6.5, 2) / 2.0);

    // 2. Rainfall Factor: Romanian agricultural average ideal is ~700mm/year.
    const rainFactor = Math.exp(-Math.pow(rainfallMm - 700, 2) / 50000);

    // 3. Nitrogen Factor: Normalized 0-100 scale.
    const nFactor = Math.min(1.0, nitrogenLevel / 80) * (1.2 - Math.max(0, (nitrogenLevel - 80) / 100));

    // 4. Agent Density Factor: diminishing returns / congestion model.
    // Optimal density is roughly 1000 agents per unit area in our simulation mesh.
    const optimalDensity = 1000;
    const x = agentDensity / optimalDensity;
    const densityFactor = x > 0 ? x * Math.exp(1 - x) : 0;

    // Base Yield: 5500 kg/ha (average for wheat/maize in the region)
    const baseYield = 5500;

    // Combine factors with weights
    // Environmental factors (80%) + Agent Optimization (20%)
    const environmentalMultiplier = (phFactor * 0.4) + (rainFactor * 0.4) + (nFactor * 0.2);
    const agentMultiplier = 0.8 + (0.4 * densityFactor); // Agents can boost yield by up to 40%

    const yieldKg = baseYield * environmentalMultiplier * agentMultiplier;

    return {
      yieldKg: Math.max(0, yieldKg),
      confidence: 0.88 + (Math.random() * 0.07),
      efficiency: (environmentalMultiplier + densityFactor) / 2,
    };
  }
}
