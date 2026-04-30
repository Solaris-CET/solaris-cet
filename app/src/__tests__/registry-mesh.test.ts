import { describe, expect,it } from "vitest";

import { solarisDepartments } from "@/data/solarisDepartments";
import {
  AGENT_BOARD_DEPT_TO_MESH_ID,
  buildSkillLatticeLine,
  buildSkillLatticePayload,
  truncateBoardSkillMessage,
} from "@/lib/agentBoardSkillMix";
import {
  expressSkillForFeed,
  formatBigSpace,
  NOMINAL_SKILL_UNIVERSE,
  SKILL_ALLELE_SPACE,
  synthesizeMeshSkills,
} from "@/lib/skillGenome";

describe("skillGenome", () => {
  it("allele space, nominal universe, formatting, synthesis tiers, uniqueness, feed line", () => {
    expect(SKILL_ALLELE_SPACE).toBeGreaterThan(100_000_000_000_000n);
    expect(NOMINAL_SKILL_UNIVERSE).toBe(SKILL_ALLELE_SPACE * 9n);
    expect(NOMINAL_SKILL_UNIVERSE).toBeGreaterThan(SKILL_ALLELE_SPACE);
    expect(formatBigSpace(NOMINAL_SKILL_UNIVERSE).length).toBeGreaterThan(3);

    const c = ["alpha beta gamma", "delta epsilon zeta"];
    const a = synthesizeMeshSkills("eng", "Backend", c, 24, "standard");
    const b = synthesizeMeshSkills("eng", "Backend", c, 24, "standard");
    expect(a).toEqual(b);
    const d1 = synthesizeMeshSkills("eng", "Backend", c, 12, "deep");
    const d2 = synthesizeMeshSkills("eng", "Backend", c, 12, "deep");
    expect(d1).toEqual(d2);
    expect(d1[0]).not.toBe(a[0]);
    const f1 = synthesizeMeshSkills("eng", "Backend", c, 8, "flash");
    const f2 = synthesizeMeshSkills("eng", "Backend", c, 8, "flash");
    expect(f1).toEqual(f2);
    expect(f1[0]).toContain("⌁");

    const longCanon = Array.from({ length: 20 }, (_, i) => `canonical skill token ${i} for fusion`);
    const sample = synthesizeMeshSkills("sales", "SDR", longCanon, 36, "standard");
    expect(new Set(sample).size).toBe(sample.length);

    const shared = ["shared one", "shared two"];
    const s1 = synthesizeMeshSkills("x", "Role A", shared, 12, "standard");
    const s2 = synthesizeMeshSkills("x", "Role B", shared, 12, "standard");
    expect(s1.join("|")).not.toBe(s2.join("|"));

    const { dept, line } = expressSkillForFeed(42);
    expect(dept.length).toBeGreaterThan(3);
    expect(line).toContain("[SKILL_EXPR]");
    expect(line).toContain(`dept=${dept}`);
    expect(line).toMatch(/tier=(flash|deep|standard)/);
  });
});

describe("solarisDepartments — agent mesh registry", () => {
  it("10 depts, 200k agents, roles/skills invariants, global uniqueness", () => {
    expect(solarisDepartments).toHaveLength(10);
    const total = solarisDepartments.reduce((s, d) => s + d.agentCount, 0);
    expect(total).toBe(200_000);

    solarisDepartments.forEach((d) => {
      expect(d.roles.length).toBeGreaterThan(0);
      d.roles.forEach((r) => {
        expect(r.skills.length).toBeGreaterThanOrEqual(16);
        const set = new Set(r.skills);
        expect(set.size, `${d.id} / ${r.title}`).toBe(r.skills.length);
      });
      const titles = d.roles.map((r) => r.title);
      expect(new Set(titles).size).toBe(titles.length);
    });

    const seen = new Map<string, string>();
    solarisDepartments.forEach((d) => {
      d.roles.forEach((r) => {
        r.skills.forEach((s) => {
          const prev = seen.get(s);
          expect(prev, `Duplicate skill: "${s}" also in ${prev}`).toBeUndefined();
          seen.set(s, `${d.id} / ${r.title}`);
        });
      });
    });
  });
});

describe("agentBoardSkillMix", () => {
  it("mesh map, lattice lines/payload, truncation, unknown dept", () => {
    expect(Object.keys(AGENT_BOARD_DEPT_TO_MESH_ID)).toHaveLength(10);
    const line = buildSkillLatticeLine("Engineering", 7);
    expect(line).toBe(buildSkillLatticeLine("Engineering", 7));
    expect(line).toMatch(/^[^:]+:/);
    const p = buildSkillLatticePayload("Engineering", 4);
    expect(p).not.toBeNull();
    expect(p!.line).toBe(buildSkillLatticeLine("Engineering", 4));
    expect(p!.roleTitle.length).toBeGreaterThan(2);
    expect(p!.meshDeptId).toBe("engineering");
    expect(buildSkillLatticeLine("Sales", 0)).not.toBe(buildSkillLatticeLine("Sales", 1));
    const long = "x".repeat(200);
    expect(truncateBoardSkillMessage(long).length).toBeLessThanOrEqual(158);
    expect(truncateBoardSkillMessage(long).endsWith("…")).toBe(true);
    expect(buildSkillLatticeLine("Unknown Dept", 0)).toBeNull();
  });
});
