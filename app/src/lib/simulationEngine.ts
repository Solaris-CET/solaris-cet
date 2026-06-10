export type WeatherState = 0 | 1 | 2;

export const WeatherStates = {
  Normal: 0 as WeatherState,
  Drought: 1 as WeatherState,
  Flood: 2 as WeatherState,
} as const;

export interface SimulationVariables {
  soilPH: number;
  rainfallMm: number;
  nitrogenLevel: number;
  agentDensity: number;
  weatherState?: WeatherState;
  currentGrowth?: number; // 0.0 - 1.0
  deltaHours?: number;
}

export interface SimulationResult {
  yieldKg: number;
  confidence: number;
  efficiency: number;
  nextGrowth: number;
  nextWeather: WeatherState;
}

/**
 * YieldSimulator — Core mathematical model for the Solaris Engineering Land-Agent simulation.
 * Optimized for high-complexity Stochastic Weather Volatility and Logistic Growth.
 */
export class YieldSimulator {
  /**
   * Calculates the theoretical yield and growth for a parcel of land using
   * the Markov-state Stochastic Weather Volatility Model.
   *
   * @param vars - Environmental and agent variables.
   * @returns Predicted yield, growth, and state transitions.
   */
  static calculate(vars: SimulationVariables): SimulationResult {
    const {
      soilPH,
      rainfallMm,
      nitrogenLevel,
      agentDensity,
      weatherState = WeatherStates.Normal,
      currentGrowth = 0.1,
      deltaHours = 1.0,
    } = vars;

    // 1. Stochastic Weather Transition (Markov Model)
    let nextWeather = weatherState;
    const r = Math.random();
    if (weatherState === WeatherStates.Normal) {
      if (r < 0.05) nextWeather = WeatherStates.Drought;
      else if (r > 0.95) nextWeather = WeatherStates.Flood;
    } else {
      if (r < 0.15) nextWeather = WeatherStates.Normal;
    }

    // 2. Resource Optimality (Bell curves)
    // Soil pH: Ideal 6.5
    const phFactor = Math.exp(-Math.pow(soilPH - 6.5, 2) / 2.0);
    // Water: Ideal depends on weather, but baseline target is ~700mm
    const waterOptimality = Math.exp(-Math.pow(rainfallMm - 700, 2) / 50000);

    // 3. Logistic Growth Mechanics: dG/dt = r * G * (1 - G/K)
    // Capacity K=1.0. Intrinsic growth rate r influenced by optimality.
    const intrinsicRate = phFactor * 0.4 + waterOptimality * 0.6;
    let growthStep = intrinsicRate * currentGrowth * (1.0 - currentGrowth) * (deltaHours / 24.0);

    // Minimal base growth for sprouts
    if (currentGrowth < 0.05) {
      growthStep = intrinsicRate * 0.05 * (deltaHours / 24.0);
    }

    // Weather impact on growth speed
    if (nextWeather !== WeatherStates.Normal) {
      growthStep *= 0.4; // 60% growth penalty under stress
    }

    const nextGrowth = Math.min(1.0, currentGrowth + growthStep);

    // 4. Agent Density Factor: diminishing returns / congestion model.
    const optimalDensity = 1000;
    const x = agentDensity / optimalDensity;
    const densityFactor = x > 0 ? x * Math.exp(1 - x) : 0;

    // 5. Final Yield Calculation
    const baseYield = 5500; // kg/ha
    const nFactor = Math.min(1.0, nitrogenLevel / 80) * (1.2 - Math.max(0, (nitrogenLevel - 80) / 100));
    const environmentalMultiplier = intrinsicRate * 0.8 + nFactor * 0.2;
    const agentMultiplier = 0.8 + 0.4 * densityFactor;

    const yieldKg = baseYield * environmentalMultiplier * agentMultiplier * nextGrowth;

    return {
      yieldKg: Math.max(0, yieldKg),
      confidence: 0.92 + Math.random() * 0.05,
      efficiency: (environmentalMultiplier + densityFactor) / 2,
      nextGrowth,
      nextWeather,
    };
  }
}
