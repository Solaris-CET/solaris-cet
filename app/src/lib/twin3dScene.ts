/** Layout helpers for Twin3D viewer — panels from kWp. */

export type Twin3DPanel = { x: number; z: number; w: number; d: number };

export function panelCountFromKwp(capacityKwp: number): number {
  const kwp = Math.max(0, capacityKwp);
  return Math.min(24, Math.max(4, Math.round(kwp)));
}

export function buildTwin3DPanels(capacityKwp: number): Twin3DPanel[] {
  const count = panelCountFromKwp(capacityKwp);
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const panelW = 0.35;
  const panelD = 0.55;
  const gap = 0.06;
  const panels: Twin3DPanel[] = [];
  let placed = 0;
  for (let r = 0; r < rows && placed < count; r += 1) {
    for (let c = 0; c < cols && placed < count; c += 1) {
      const x = (c - (cols - 1) / 2) * (panelW + gap);
      const z = (r - (rows - 1) / 2) * (panelD + gap);
      panels.push({ x, z, w: panelW, d: panelD });
      placed += 1;
    }
  }
  return panels;
}

export function roofSizeFromKwp(capacityKwp: number): { w: number; d: number } {
  const panels = buildTwin3DPanels(capacityKwp);
  if (panels.length === 0) return { w: 2.4, d: 1.8 };
  const xs = panels.map((p) => p.x);
  const zs = panels.map((p) => p.z);
  const spanX = Math.max(...xs) - Math.min(...xs) + 0.5;
  const spanZ = Math.max(...zs) - Math.min(...zs) + 0.7;
  return { w: Math.max(2.4, spanX + 0.8), d: Math.max(1.8, spanZ + 0.6) };
}