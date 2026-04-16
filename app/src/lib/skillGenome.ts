/**
 * Combinatorial "skill DNA" — ten loci × template isomers × crossover layers.
 * The Cartesian product is in the hundreds of quadrillions; only samples are materialised.
 */

import { solarisDepartments } from '@/data/solarisDepartments';

const LOCUS_A = [
  'Adversarially hardened', 'Cross-sharded', 'Spectrally decomposed', 'RAV-braided',
  'Zero-trust wrapped', 'Latency-gated', 'Entropy-aware', 'Consensus-anchored',
  'Cetățuia-grounded', 'Dual-AI entangled', 'Merkle-sealed', 'Gradient-stabilised',
  'Topology-aware', 'Quorum-weighted', 'Eigenspace-smoothed', 'Policy-saturated',
  'Context-compacted', 'Token-budgeted', 'Graph-diffused', 'Bayesianly tempered',
  'Causal-masked', 'Invariant-locked', 'Shard-homomorphic', 'CetAi-synchronised',
  'Nash-stable', 'Pareto-sliced', 'Kolmogorov-compressed', 'Lyapunov-bounded',
  'Differentially private', 'Homotopy-continuous', 'Manifold-projected', 'Symplectic-respecting',
  'Meta-learned', 'Self-play forged', 'Contrastive-aligned', 'Sparse-activated',
  'Fourier-sparse', 'Wavelet-localised', 'Attention-sparsified', 'Mixture-of-depth-routed',
  'Ultra-coherent', 'HyperMorphic-fused', 'Planck-transmuted (conceptual)', 'CoherenceMax-tuned',
  'QuantumSkillGenesis-grade', 'Hyper-entangled transfer-ready',
  'Topologically protected (conceptual)', 'Grover-accelerated (conceptual)', 'Shor-aware (conceptual)',
  'Wavefunction-forged (metaphor)', 'Coherence-singularity stabilised (conceptual)', 'Qubit-parallel (metaphor)',
  'Fault-tolerant (conceptual)', 'Error-correction hardened (conceptual)', 'Hybrid quantum-classical (conceptual)',
  'QNN-backprop tuned (conceptual)', 'Quantum-kernel shaped (conceptual)',
  'Aether-nova coalesced (metaphor)', 'Lumina-apex forged (metaphor)', 'Psi-tempered (metaphor)',
  'QFT-aware (conceptual)', 'Phase-estimation ready (conceptual)', 'QAOA-tuned (conceptual)', 'VQE-calibrated (conceptual)',
  'Surface-code aligned (conceptual)', 'Magic-state budgeted (conceptual)', 'Randomised compiling hardened (conceptual)',
] as const;

const LOCUS_B = [
  'customer-trust surfaces', 'deal-velocity tensors', 'risk appetite manifolds',
  'supply-chain latencies', 'regulatory hyperplanes', 'on-chain attestations',
  'agronomic telemetry', 'treasury flow graphs', 'model drift manifolds',
  'identity binding fibres', 'content authenticity shells', 'payment intent polytopes',
  'support sentiment strands', 'code smell spectra', 'threat actor manifolds',
  'contract obligation trees', 'experiment interference fields', 'brand voice attractors',
  'GPU memory topologies', 'API error budgets', 'search relevance ridges',
  'fraud score gradients', 'compliance clock surfaces', 'roadmap commitment graphs',
  'incident narrative fibres', 'patent claim lattices', 'crop-yield response curves',
  'liquidity depth profiles', 'embedding geometry wars', 'prompt-injection shells',
  'cross-border tax ridges', 'SOC alert manifolds', 'smart-contract state rays',
  'partner MDF surfaces', 'synthetic data hulls', 'executive metric ridges',
  'mobile cold-start valleys', 'CI flake attractors', 'forecast commit polyhedra',
] as const;

const LOCUS_C = [
  'via Grok×Gemini RAV', 'through TON-native finality', 'using spectral co-training',
  'with BFT timeout awareness', 'under IPFS audit hashes', 'via retrieval quorum voting',
  'through dual-model disagreement maps', 'with zk-style succinct proofs (conceptual)',
  'under DeFi-style composability', 'via agent-mesh gossip rounds', 'through causal ablation gates',
  'with human-in-loop circuit breakers', 'under EU AI Act–style risk bands', 'via open-weight / API hybrids',
  'through continual partial observation', 'with epistemic uncertainty budgets', 'under SOC2-ish control planes',
  'via graph-RAG random walks', 'through multi-hop tool chains', 'with style-adaptive tone locks',
  'under tail-latency SLO burn', 'via shard-aware batching', 'through WASM-sandboxed tools',
  'with consent-graph propagation', 'under margin-guarded offers', 'via cohort-level DP noise',
  'through transformer depth routing', 'with MoE expert load balancing', 'under KV-cache pressure',
  'via semantic compression ladders', 'through ReAct-style closed loops', 'with BRAID-style structure hints',
  'under cross-locale legal deltas', 'via hardware attestation hooks', 'through supply-chain SBOM links',
  'with quantum-inspired annealing (classical sim)', 'under game-theoretic audit games', 'via neural CRF bridges',
  'through self-consistency sampling', 'with constitutional classifier stacks', 'under energy-aware scheduling',
  'via hypermorphic skill fusion loops (conceptual)', 'through superposition-style exploration (metaphor)',
  'with topological protection motifs (conceptual)', 'via Grover-like query amplification (metaphor)',
  'with Shor-style factoring threat models (conceptual)',
  'via morphogenic adiabatic annealing (metaphor)',
  'via phase-estimation oracles (conceptual)', 'through QFT-style transforms (conceptual)',
] as const;

const LOCUS_D = [
  'for silent-failure resistance', 'for sub-second stakeholder truth', 'for audit-grade replay',
  'for cross-department alignment', 'for RWA-linked assurance', 'for multilingual parity',
  'for adversarial robustness', 'for long-horizon memory hygiene', 'for cost-per-outcome minimisation',
  'for explainable escalation', 'for privacy-preserving joins', 'for deterministic re-runs',
  'for graceful degradation', 'for optimistic UI safety', 'for schema-evolution tolerance',
  'for vendor-lock-in escape', 'for cold-chain data integrity', 'for seasonal demand spikes',
  'for regulatory pre-positioning', 'for champion-churn early warning', 'for dark-funnel illumination',
  'for GPU hoarding prevention', 'for flaky-test immunisation', 'for API deprecation kindness',
  'for contract ambiguity collapse', 'for IP contamination avoidance', 'for quantum-readiness hedging',
  'for carbon-intensity trade-offs', 'for sovereign-cloud portability', 'for edge-case fertility',
  'for narrative coherence at scale', 'for synthetic-data fidelity', 'for human dignity defaults',
  'for mesh-wide kill switches', 'for cross-chain message hygiene', 'for CET AI manipulation immunity',
  'for payroll edge-case justice', 'for brand-trust velocity', 'for scientific reproducibility',
] as const;

const LOCUS_E = [
  'locus α', 'locus β', 'locus γ', 'locus δ', 'locus ε', 'locus ζ', 'locus η', 'locus θ',
  'locus ι', 'locus κ', 'locus λ', 'locus μ', 'locus ν', 'locus ξ', 'locus ο', 'locus π',
  'locus ρ', 'locus σ', 'locus τ', 'locus υ', 'locus φ', 'locus χ', 'locus ψ', 'locus ω',
  'haplotype Σ', 'haplotype Ω', 'haplotype Λ', 'haplotype Φ', 'haplotype Ψ', 'haplotype Γ',
  'exon-17 variant', 'exon-23 variant', 'intron splice A', 'intron splice B', 'promoter motif X',
  'enhancer cluster 9', 'CRISPR-style patch', 'transposon echo', 'retrocopy lift', 'allele drift +4',
] as const;

const LOCUS_F = [
  'mesh signature', 'capability hash', 'phenotype trace', 'expression profile',
  'fitness proxy', 'selection pressure', 'recombination breakpoint', 'mutation rate cap',
  'epistasis gate', 'pleiotropy bundle', 'dominance curve', 'heterozygote advantage',
  'founder effect guard', 'genetic load budget', 'linkage disequilibrium map', 'QTL hotspot',
  'cis-regulatory module', 'trans-regulatory hub', 'chromatin accessibility peak', 'nucleosome phasing',
  'copy-number variant', 'structural variant shadow', 'karyotype stability index', 'telomere attrition proxy',
  'mitochondrial hitchhiker', 'endosymbiont echo', 'horizontal gene transfer hint', 'viral co-opted motif',
  'prion-like domain risk', 'phase-separation condensate', 'RNA-editing footprint', 'methylation clock skew',
] as const;

const LOCUS_G = [
  'no singleton-LLM twin', 'non-exportable outside mesh', 'requires dual-model witness',
  'TON-settlement aware', 'Cetățuia-telemetry optional', 'RAV-enforced reasoning trace',
  'IPFS-anchor capable', 'agent-count scaled', 'department-island specific', 'epoch-rotating nonce',
  'cross-shard coherent', 'cet-ai-staked metaphorically', 'ZK-ready narrative', 'MEV-immune intent',
  'SOC2-flavoured control', 'GDPR-flavoured minimisation', 'MiCA-flavoured disclosure', 'HIPAA-flavoured caution',
] as const;

const LOCUS_H = [
  'v9.4 recombinase', 'v12.1 ligase', 'v3.7 helicase', 'v8.0 polymerase', 'v1.9 topoisomerase',
  'v6.3 methylase', 'v4.2 demethylase', 'v7.8 nuclease', 'v2.0 transcriptase', 'v5.5 spliceosome',
  'v11.2 primase', 'v0.8 telomerase', 'v13.6 exonuclease', 'v5.1 endonuclease', 'v4.9 integrase',
  'v7.1 reverse-transcriptase', 'v3.3 adenylase', 'v8.9 deaminase', 'v2.4 kinase', 'v6.0 phosphatase',
] as const;

/** Bilingual / regional nuance layer (RO + EN). */
const LOCUS_I = [
  'încredere utilizator', 'lanț aprovizionare', 'conformitate UE', 'date personale minimizate',
  'vodă irigație · energie', 'trasabilitate RWA', 'vocile pieței locale', 'handshake cultural RO·EU',
  'transparență on-chain', 'risc reputațional', 'lanț rece agricol', 'semnături digitale calificate',
  'clauze abuzive scan', 'limbaj plain-Romanian', 'orizont fiscal multi-țară', 'drepturi consumatori',
  'UX fără dark patterns', 'sincron TON sub secundă', 'mesh 200k coerent', 'agronomie + DeFi',
  'Cetățuia ca ancoră', 'Grok×Gemini ca juri', 'IPFS ca notar', 'audit dual-model',
  'cost tokeni sub control', 'latență percepută', 'încredere fermieri', 'export date portabile',
  'sancțiuni & screening', 'continuitate operațiuni', 'reziliență cibernetică', 'educație utilizatori',
] as const;

/** Temporal / burn-in / release epoch layer. */
const LOCUS_J = [
  'epoch-2026.Q1 mesh', '4h burn-in window', '48h viral attention slot', '90d retention horizon',
  'rolling 7d skill drift', 'monthly allele refresh', 'quarterly compliance realign', 'sunset epoch +3',
  'zero-downtime splice', 'blue-green phenotype cutover', 'canary 0.5% traffic', 'rollback-ready locus',
  'winter demand spike mode', 'harvest-season agritech boost', 'EOFY finance crunch', 'SOC shift handoff slot',
  'weekend low-ops mode', 'incident war-room clock', 'board-meeting eve freeze', 'patch Tuesday echo',
  'new-model Tuesday risk', 'holiday skeleton crew', 'leap-second tolerance', 'DST boundary guard',
] as const;

const LOCI = [
  LOCUS_A,
  LOCUS_B,
  LOCUS_C,
  LOCUS_D,
  LOCUS_E,
  LOCUS_F,
  LOCUS_G,
  LOCUS_H,
  LOCUS_I,
  LOCUS_J,
] as const;

/** Cartesian product of all allele arrays (10 loci). */
export const SKILL_ALLELE_SPACE: bigint = LOCI.reduce(
  (acc, locus) => acc * BigInt(locus.length),
  1n
);

/** Syntactic template isomers (same alleles, different surface form). */
export const TEMPLATE_ISOMER_COUNT = 9;

/** Nominal universe for UI: alleles × template families. */
export const NOMINAL_SKILL_UNIVERSE: bigint = SKILL_ALLELE_SPACE * BigInt(TEMPLATE_ISOMER_COUNT);

export function formatBigSpace(n: bigint): string {
  if (n >= 1_000_000_000_000_000n) {
    const q = Number(n) / 1e15;
    return `~${q.toFixed(2)}×10¹⁵`;
  }
  if (n >= 1_000_000_000_000n) {
    const t = Number(n) / 1e12;
    return `~${t.toFixed(2)}×10¹²`;
  }
  if (n >= 1_000_000_000n) {
    const b = Number(n) / 1e9;
    return `~${b.toFixed(2)}×10⁹`;
  }
  return n.toString();
}

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T extends readonly string[]>(arr: T, rng: () => number): T[number] {
  return arr[Math.floor(rng() * arr.length)]!;
}

function composeAllelicPhrase(seed: number): string {
  const rng = mulberry32(seed);
  const a = pick(LOCUS_A, rng);
  const b = pick(LOCUS_B, rng);
  const c = pick(LOCUS_C, rng);
  const d = pick(LOCUS_D, rng);
  const e = pick(LOCUS_E, rng);
  const f = pick(LOCUS_F, rng);
  const g = pick(LOCUS_G, rng);
  const h = pick(LOCUS_H, rng);
  const i = pick(LOCUS_I, rng);
  const j = pick(LOCUS_J, rng);
  const t = seed % TEMPLATE_ISOMER_COUNT;
  switch (t) {
    case 0:
      return `${a} ${b} ${c} ${d} — ${e} · ${f} · ${g} · ${h} · ⟨${i}⟩ · ${j}`;
    case 1:
      return `${j}: ${b} ← ${a} ${c}; ${d} [${e}] ⟨${f}⟩; ${g}; ${h}; nuance ${i}`;
    case 2:
      return `Chimera ${e}: (${a}) × (${b}) ${c} ${d} · ${f} · ${g} · ${h} · ${i} · ${j}`;
    case 3:
      return `${a} lattice over ${b}; ${c}; target ${d}; tag ${e}+${f}; seal ${g}; polymer ${h}; locale ${i}; ${j}`;
    case 4:
      return `${g} — ${a} ${b} ${c}, ${d}, genome ${e}/${f}, splice ${h}, voice ${i}, clock ${j}`;
    case 5:
      return `[${j}] ${i} ⇄ ${a} ${b} ${c} ${d} · trace ${e} · ${f} · enzyme ${h}`;
    case 6:
      return `Polyploid burst: ${e}/${f}/${g} over ${b}; ${a} ${c}; ${d}; stamp ${j}; strand ${i}`;
    case 7:
      return `${h} @ ${j}: ${a}→${b} ${c}; ${d}; marker ${e}; ${f}; guard ${i}`;
    default:
      return `Express ${i} · ${a} ${b} · ${c} · ${d} · ${e} · ${f} · ${g} · ${h} · tick ${j}`;
  }
}

/** Shorter lines for neural feed / dense HUD. */
function composeDeepPhrase(seed: number): string {
  const rng = mulberry32(seed ^ 0xdeadbeef);
  const a = pick(LOCUS_A, rng);
  const b = pick(LOCUS_B, rng);
  const c = pick(LOCUS_C, rng);
  const i = pick(LOCUS_I, rng);
  const j = pick(LOCUS_J, rng);
  const g = pick(LOCUS_G, rng);
  return `${j} · ${a} ${b} · ${c} · ${i} · ${g}`;
}

/** Ultra-compact allele burst for ticker / badges. */
function composeFlashPhrase(seed: number): string {
  const rng = mulberry32(seed ^ 0xf00dcafe);
  const j = pick(LOCUS_J, rng);
  const i = pick(LOCUS_I, rng);
  const a = pick(LOCUS_A, rng);
  const h = pick(LOCUS_H, rng);
  return `${j} ⌁ ${i} ⌁ ${a} ⌁ ${h}`;
}

function tokensFromSkill(s: string): string[] {
  return s
    .split(/[\s·,;]+/)
    .map((w) => w.replace(/[()[\]—]/g, '').trim())
    .filter((w) => w.length > 2);
}

function crossoverFusion(a: string, b: string, seed: number): string {
  const rng = mulberry32(seed);
  const ta = tokensFromSkill(a);
  const tb = tokensFromSkill(b);
  const wa = ta.length ? ta[Math.floor(rng() * ta.length)]! : 'core';
  const wb = tb.length ? tb[Math.floor(rng() * tb.length)]! : 'mesh';
  const bridge = pick(['⊗', '⨀', '⧉', '⌁', '⎘', '⧇', '⨂'], rng);
  const tail = pick(LOCUS_D, rng);
  const tag = pick(LOCUS_E, rng);
  const j = pick(LOCUS_J, rng);
  return `DNA-2 ${bridge} ${wa}+${wb} → ${tail} [${tag}] · ${j}`;
}

function tripleCrossover(a: string, b: string, c: string, seed: number): string {
  const rng = mulberry32(seed);
  const ta = tokensFromSkill(a);
  const tb = tokensFromSkill(b);
  const tc = tokensFromSkill(c);
  const wa = ta.length ? ta[Math.floor(rng() * ta.length)]! : 'α';
  const wb = tb.length ? tb[Math.floor(rng() * tb.length)]! : 'β';
  const wc = tc.length ? tc[Math.floor(rng() * tc.length)]! : 'γ';
  const h = pick(LOCUS_H, rng);
  const i = pick(LOCUS_I, rng);
  return `DNA-3 ${wa}|${wb}|${wc} · ${h} · ${i} · seal ${pick(LOCUS_G, rng)}`;
}

export type SynthesisTier = 'standard' | 'deep' | 'flash';

/**
 * Stable sample of recombinant skills for one role.
 * `deep` uses shorter, HUD-friendly phrasing for secondary chips.
 */
export function synthesizeMeshSkills(
  deptId: string,
  roleTitle: string,
  canonicalSkills: readonly string[],
  count: number,
  tier: SynthesisTier = 'standard'
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let attempt = 0;
  const maxAttempts = count * 32;
  const tierSalt =
    tier === 'deep' ? '|deep-v1' : tier === 'flash' ? '|flash-v1' : '|std-v4';

  while (out.length < count && attempt < maxAttempts) {
    const base = `${deptId}|${roleTitle}|${attempt}${tierSalt}`;
    const seed = hash32(base);

    let line: string;
    if (tier === 'flash') {
      line = composeFlashPhrase(seed ^ (attempt * 0x9e3779b9));
    } else if (tier === 'deep') {
      line = composeDeepPhrase(seed ^ (attempt * 0x9e3779b9));
    } else if (canonicalSkills.length >= 3 && attempt % 13 === 0) {
      const i0 = seed % canonicalSkills.length;
      const i1 = (seed >>> 7) % canonicalSkills.length;
      const i2 = (seed >>> 14) % canonicalSkills.length;
      line = tripleCrossover(
        canonicalSkills[i0]!,
        canonicalSkills[i1]!,
        canonicalSkills[i2]!,
        seed ^ attempt
      );
    } else if (canonicalSkills.length >= 2 && attempt % 4 === 0) {
      line = crossoverFusion(
        canonicalSkills[seed % canonicalSkills.length]!,
        canonicalSkills[(seed >>> 11) % canonicalSkills.length]!,
        seed ^ attempt
      );
    } else {
      line = composeAllelicPhrase(seed ^ (attempt * 0x9e3779b9));
    }

    if (!seen.has(line)) {
      seen.add(line);
      out.push(line);
    }
    attempt++;
  }

  return out;
}

/** Rotating synthesis tier for feed lines — aligned with meshSkillFeed.expressMeshSkillForFeed. */
const FEED_TIERS: SynthesisTier[] = ['flash', 'deep', 'standard'];

/**
 * One-line skill expression for simulated logs (deterministic per seq).
 * Uses `synthesizeMeshSkills` with `tier = FEED_TIERS[seq % FEED_TIERS.length]` (same pattern as mesh feed).
 */
export function expressSkillForFeed(seq: number): { dept: string; line: string } {
  const d = solarisDepartments[seq % solarisDepartments.length]!;
  const role = d.roles[seq % d.roles.length]!;
  const tier = FEED_TIERS[seq % FEED_TIERS.length]!;
  const inner = synthesizeMeshSkills(d.id, role.title, role.skills, 1, tier)[0] ?? '';
  const t = new Date().toISOString().slice(11, 23);
  const expr = inner.slice(0, 220);
  const ell = inner.length > 220 ? '…' : '';
  return {
    dept: d.id,
    line: `[${t}] [SKILL_EXPR] dept=${d.id} tier=${tier} loci=10 isomers=${TEMPLATE_ISOMER_COUNT} expr="${expr}${ell}"`,
  };
}
