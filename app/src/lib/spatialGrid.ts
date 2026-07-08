/**
 * Uniform spatial grid for fast neighbour lookups in 2D particle/node systems.
 * Replaces O(n²) all-pairs loops with O(n) insertion + bounded-cell queries.
 */

export type PointLike = { x: number; y: number };

export type SpatialGridOptions = {
  /** Canvas / world width. */
  width: number;
  /** Canvas / world height. */
  height: number;
  /** Maximum neighbour distance that callers care about. */
  cellSize: number;
};

export class SpatialGrid<T extends PointLike> {
  private cells = new Map<number, T[]>();
  private width: number;
  private height: number;
  private cellSize: number;
  private cols: number;
  private rows: number;

  constructor(opts: SpatialGridOptions) {
    this.width = opts.width;
    this.height = opts.height;
    this.cellSize = Math.max(1, opts.cellSize);
    this.cols = Math.max(1, Math.ceil(this.width / this.cellSize));
    this.rows = Math.max(1, Math.ceil(this.height / this.cellSize));
  }

  private key(cx: number, cy: number): number {
    return cy * this.cols + cx;
  }

  private coords(p: PointLike): { cx: number; cy: number } {
    const cx = Math.min(this.cols - 1, Math.max(0, Math.floor(p.x / this.cellSize)));
    const cy = Math.min(this.rows - 1, Math.max(0, Math.floor(p.y / this.cellSize)));
    return { cx, cy };
  }

  /**
   * Resize the grid boundaries. Call this when the canvas/world size changes.
   * Existing cell contents are cleared because bucket keys become invalid.
   */
  resize(opts: { width: number; height: number; cellSize?: number }): void {
    this.width = opts.width;
    this.height = opts.height;
    if (opts.cellSize !== undefined) {
      this.cellSize = Math.max(1, opts.cellSize);
    }
    this.cols = Math.max(1, Math.ceil(this.width / this.cellSize));
    this.rows = Math.max(1, Math.ceil(this.height / this.cellSize));
    this.cells.clear();
  }

  clear(): void {
    this.cells.clear();
  }

  insert(item: T): void {
    const { cx, cy } = this.coords(item);
    const k = this.key(cx, cy);
    const bucket = this.cells.get(k);
    if (bucket) {
      bucket.push(item);
    } else {
      this.cells.set(k, [item]);
    }
  }

  insertAll(items: Iterable<T>): void {
    this.clear();
    for (const item of items) {
      this.insert(item);
    }
  }

  /**
   * Iterate every neighbour pair (i, j) where distance < maxDist.
   * Each unordered pair is yielded exactly once.
   */
  *neighbourPairs(maxDist: number): Generator<{ a: T; b: T; dist: number }> {
    const radiusCells = Math.ceil(maxDist / this.cellSize);
    const maxDistSq = maxDist * maxDist;

    for (const [k, bucket] of this.cells) {
      const cx = k % this.cols;
      const cy = Math.floor(k / this.cols);

      // Local pairs inside the same cell.
      for (let i = 0; i < bucket.length; i++) {
        const a = bucket[i]!;
        for (let j = i + 1; j < bucket.length; j++) {
          const b = bucket[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq <= maxDistSq) {
            yield { a, b, dist: Math.sqrt(distSq) };
          }
        }
      }

      // Pairs with adjacent cells (only forward directions to avoid duplicates).
      for (let dy = 0; dy <= radiusCells; dy++) {
        for (let dx = -radiusCells; dx <= radiusCells; dx++) {
          if (dy === 0 && dx <= 0) continue; // same cell or backward already handled
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows) continue;
          const nb = this.cells.get(this.key(nx, ny));
          if (!nb) continue;
          for (const a of bucket) {
            for (const b of nb) {
              const ddx = a.x - b.x;
              const ddy = a.y - b.y;
              const distSq = ddx * ddx + ddy * ddy;
              if (distSq <= maxDistSq) {
                yield { a, b, dist: Math.sqrt(distSq) };
              }
            }
          }
        }
      }
    }
  }

  /**
   * Iterate neighbours of a single point within maxDist.
   */
  *neighboursOf(origin: PointLike, maxDist: number): Generator<{ item: T; dist: number }> {
    const { cx, cy } = this.coords(origin);
    const radiusCells = Math.ceil(maxDist / this.cellSize);
    const maxDistSq = maxDist * maxDist;

    for (let dy = -radiusCells; dy <= radiusCells; dy++) {
      for (let dx = -radiusCells; dx <= radiusCells; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows) continue;
        const bucket = this.cells.get(this.key(nx, ny));
        if (!bucket) continue;
        for (const item of bucket) {
          const dx_ = origin.x - item.x;
          const dy_ = origin.y - item.y;
          const distSq = dx_ * dx_ + dy_ * dy_;
          if (distSq <= maxDistSq && distSq > 0) {
            yield { item, dist: Math.sqrt(distSq) };
          }
        }
      }
    }
  }
}
