import { describe, expect,it } from "vitest";

import {
  buildConsensusBurstLogMessage,
  buildExpressomeBurstLogMessage,
  buildFlashGlintLogMessage,
  buildLoopCompleteBurstLogMessage,
  buildRavBurstLogMessage,
  CET_AI_BURST_SALT,
} from "@/lib/cetAiBurstLines";
import {
  buildAgentPoolMeshLogMessage,
  buildDeepLatticeMeshLogMessage,
  buildDeepLatticeMeshLogMessageRawQuery,
  buildSkillLocusLogMessage,
  buildTeamAgentMeshLogMessage,
  CET_AI_LATTICE_PHASE,
} from "@/lib/cetAiMeshLines";
import {
  buildCetAiObserveParse,
  buildDeepLatticeMeshLogMessage as buildDeepLatticeTelemetry,
  buildDeepLatticeMeshLogMessageRawQuery as buildDeepLatticeRawTelemetry,
  buildSkillLocusLogMessage as buildSkillLocusTelemetry,
  CET_AI_LATTICE_PHASE as CET_AI_LATTICE_PHASE_T,
  CET_AI_TASK_MESH_LINE,
} from "@/lib/cetAiTelemetry";
import {
  agentBoardLiveAgentKey,
  aiTeamRoleAgentKey,
  aiTeamRoleGeneKey,
  aiTeamSynthKey,
  deepLatticeLineForQuery,
  expressMeshSkillForFeed,
  meshStandardBurstForAiTeamRoleAgent,
  meshStandardBurstForBoardCollab,
  meshStandardBurstForBoardLiveAgent,
  meshStandardBurstFromKey,
  meshWhisperForAiTeamRoleAgent,
  meshWhisperForAiTeamRoleGene,
  meshWhisperForAiTeamSynth,
  meshWhisperForBoardCollab,
  meshWhisperForBoardLiveAgent,
  meshWhisperFromKey,
  observeLocusBranchFromTopic,
  observeLocusClip,
  shortSkillWhisper,
  skillCaptionForDept,
  skillFlashForBoardDept,
  skillSaltFromQuery,
  skillSeedFromLabel,
  standardSkillBurst,
} from "@/lib/meshSkillFeed";

function stripFeedTimestamp(line: string): string {
  return line.replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\]/, "[TS]");
}

describe("cetAiMeshLines", () => {
  it("pool/team/deep lattice/skill locus prefixes, stability, phases", () => {
    const pool = buildAgentPoolMeshLogMessage("team", "How do agents collaborate?");
    expect(pool).toBe(buildAgentPoolMeshLogMessage("team", "How do agents collaborate?"));
    expect(pool.startsWith("AGENT_POOL_MESH: ")).toBe(true);
    expect(pool.length).toBeLessThan(160);
    expect(buildAgentPoolMeshLogMessage("default", "aaa")).not.toBe(
      buildAgentPoolMeshLogMessage("default", "bbb"),
    );

    const team = buildTeamAgentMeshLogMessage("team scale", "team");
    expect(team).toBe(buildTeamAgentMeshLogMessage("team scale", "team"));
    expect(team.startsWith("TEAM_AGENT_MESH: ")).toBe(true);
    expect(team).toContain("—");

    const q = "test cet ai lattice";
    const input = buildDeepLatticeMeshLogMessage("INPUT_MESH", q, CET_AI_LATTICE_PHASE.inputStream);
    expect(input.startsWith("INPUT_MESH: ")).toBe(true);
    expect(input).toContain(" · ");
    const parse = buildDeepLatticeMeshLogMessage("PARSE_MESH", q, CET_AI_LATTICE_PHASE.observeParse);
    expect(parse.startsWith("PARSE_MESH: ")).toBe(true);
    expect(input).toBe(buildDeepLatticeMeshLogMessage("INPUT_MESH", q, "inputStream"));

    const rawQ = "raw lattice query";
    const raw = buildDeepLatticeMeshLogMessageRawQuery("DEEP_LATTICE", rawQ);
    expect(raw).toBe(buildDeepLatticeMeshLogMessageRawQuery("DEEP_LATTICE", rawQ));
    expect(raw.startsWith("DEEP_LATTICE: ")).toBe(true);

    const loc = buildSkillLocusLogMessage("What is mining?", "mining");
    expect(loc.startsWith("SKILL_LOCUS: ")).toBe(true);
    expect(loc).toContain("topic=mining");

    expect(Object.keys(CET_AI_LATTICE_PHASE).sort()).toEqual(
      [
        "actExecute",
        "inputStream",
        "meshSeal",
        "observeContext",
        "observeParse",
        "sessionClose",
        "thinkRoute",
        "thinkValidate",
        "verifyCross",
      ].sort(),
    );
  });
});

describe("cetAiTelemetry barrel", () => {
  it("TASK_MESH line, observe_parse snapshot, deep lattice + skill locus", () => {
    expect(CET_AI_TASK_MESH_LINE.startsWith("TASK_MESH:")).toBe(true);
    expect(CET_AI_TASK_MESH_LINE).toContain("200k");
    expect(CET_AI_TASK_MESH_LINE).toContain("CET AI");

    const q = "How do 200k agents route tasks?";
    const detected = "team";
    const tokenCount = q.split(/\s+/).length;
    const seq = buildCetAiObserveParse(q, detected, tokenCount);
    expect(seq[0]).toMatch(/^RAV_BURST: /);
    expect(seq[1]).toBe(CET_AI_TASK_MESH_LINE);
    expect(seq.some((l) => l.startsWith("INPUT_STREAM:"))).toBe(true);
    expect(seq).toMatchSnapshot();

    const q2 = "cet ai snapshot";
    const detected2 = "default";
    expect(buildDeepLatticeRawTelemetry("DEEP_LATTICE", q2)).toBe(
      buildDeepLatticeRawTelemetry("DEEP_LATTICE", q2),
    );
    expect(
      buildDeepLatticeTelemetry("ACT_MESH", q2, CET_AI_LATTICE_PHASE_T.actExecute),
    ).toContain("ACT_MESH:");
    expect(buildSkillLocusTelemetry(q2, detected2)).toContain("topic=default");
  });
});

describe("cetAiBurstLines", () => {
  const q = "What is the RAV Protocol?";

  const BUILDERS = [
    ["RAV_BURST", buildRavBurstLogMessage],
    ["FLASH_GLINT", buildFlashGlintLogMessage],
    ["EXPRESSOME_BURST", buildExpressomeBurstLogMessage],
    ["CONSENSUS_BURST", buildConsensusBurstLogMessage],
    ["LOOP_COMPLETE_BURST", buildLoopCompleteBurstLogMessage],
  ] as const;

  it("stable per query, correct prefix, query sensitivity, flash em dash, salt keys", () => {
    for (const [prefix, fn] of BUILDERS) {
      const a = fn(q);
      const b = fn(q);
      expect(a).toBe(b);
      expect(a.startsWith(`${prefix}: `)).toBe(true);
    }
    expect(buildRavBurstLogMessage("aaa")).not.toBe(buildRavBurstLogMessage("bbb"));
    expect(buildFlashGlintLogMessage(q)).toContain("—");
    expect(Object.keys(CET_AI_BURST_SALT).sort()).toEqual(
      ["cetAiComplete", "consensus", "expressome", "observeCtx", "ravInit"].sort(),
    );
  });
});

describe("meshSkillFeed", () => {
  it("feed lines, locus, salts, board keys, AI team + agentBoard wiring", () => {
    const ex = expressMeshSkillForFeed(11);
    const ex2 = expressMeshSkillForFeed(11);
    expect(ex.dept).toBe(ex2.dept);
    expect(stripFeedTimestamp(ex.line)).toBe(stripFeedTimestamp(ex2.line));
    expect(ex.line).toContain("[SKILL_MESH]");
    expect(ex.line).toContain("dept=");
    expect(ex.line).toMatch(/tier=(flash|deep|standard)/);

    const sw = shortSkillWhisper(3);
    expect(sw.length).toBeLessThanOrEqual(130);
    expect(sw).toContain("—");

    expect(skillCaptionForDept("no-such-dept", 0)).toBe("");

    const dl = deepLatticeLineForQuery("oracle deep test");
    expect(dl).toBe(deepLatticeLineForQuery("oracle deep test"));
    expect(dl).toMatch(/ · /);
    expect(dl.length).toBeLessThanOrEqual(102);

    expect(observeLocusBranchFromTopic("price")).toBe("price");
    expect(observeLocusBranchFromTopic("mining")).toBe("mining");
    expect(observeLocusBranchFromTopic("rav")).toBe("ai");
    expect(observeLocusBranchFromTopic("unknown")).toBe("default");

    const loc = observeLocusClip("test query locus", "price");
    expect(loc).toBe(observeLocusClip("test query locus", "price"));
    expect(loc.length).toBeLessThanOrEqual(84);
    expect(observeLocusClip("test query locus", "mining")).not.toBe(loc);

    expect(skillSaltFromQuery("What are AI agents?")).toBe(skillSaltFromQuery("What are AI agents?"));
    expect(skillSaltFromQuery("aaa")).not.toBe(skillSaltFromQuery("aab"));

    expect(skillSeedFromLabel("Parallel agents")).toBe(skillSeedFromLabel("Parallel agents"));
    expect(skillSeedFromLabel("metric-aaa")).not.toBe(skillSeedFromLabel("metric-bbb"));

    const flash = skillFlashForBoardDept("Engineering", 3);
    expect(flash).toBeTruthy();
    expect(flash!.length).toBeLessThanOrEqual(96);
    expect(flash).toContain(":");
    expect(skillFlashForBoardDept("Mars Colony", 0)).toBeNull();

    const burst = standardSkillBurst(44);
    expect(burst).toBe(standardSkillBurst(44));
    expect(burst).toContain(":");
    expect(burst.length).toBeLessThanOrEqual(118);

    const cap0 = skillCaptionForDept("engineering", 0);
    const cap19 = skillCaptionForDept("engineering", 19);
    expect(cap0.length).toBeGreaterThan(5);
    expect(cap19.length).toBeGreaterThan(5);
    expect(cap0).not.toBe(cap19);

    const k = "statsBento|agents";
    expect(meshWhisperFromKey(k)).toBe(shortSkillWhisper(skillSeedFromLabel(k)));
    const k2 = "miningCalc|device|node";
    expect(meshStandardBurstFromKey(k2)).toBe(standardSkillBurst(skillSeedFromLabel(k2)));

    expect(aiTeamRoleAgentKey("engineering", "SRE")).toBe("aiTeam|roleAgent|engineering|SRE");
    expect(aiTeamRoleGeneKey("legal", "Counsel", 3)).toBe("aiTeam|roleGene|legal|3|Counsel");
    expect(aiTeamSynthKey("sales", "AE", "deep", 2)).toBe("aiTeam|synth|sales|deep|2|AE");

    expect(meshWhisperForAiTeamRoleAgent("engineering", "SRE")).toBe(
      meshWhisperFromKey(aiTeamRoleAgentKey("engineering", "SRE")),
    );
    expect(meshStandardBurstForAiTeamRoleAgent("engineering", "SRE")).toBe(
      meshStandardBurstFromKey(aiTeamRoleAgentKey("engineering", "SRE")),
    );
    expect(meshWhisperForAiTeamRoleGene("legal", "Counsel", 1)).toBe(
      meshWhisperFromKey(aiTeamRoleGeneKey("legal", "Counsel", 1)),
    );
    expect(meshWhisperForAiTeamSynth("marketing", "Growth", "flash", 0)).toBe(
      meshWhisperFromKey(aiTeamSynthKey("marketing", "Growth", "flash", 0)),
    );

    expect(agentBoardLiveAgentKey("CX-00042", "Customer Ops", "skill", "Tier-1 Support")).toBe(
      "agentBoard|liveAgent|CX-00042|Customer Ops|skill|Tier-1 Support",
    );
    expect(agentBoardLiveAgentKey("ENG-00001", "Engineering", "solved")).toBe(
      "agentBoard|liveAgent|ENG-00001|Engineering|solved|—",
    );
    const fp = "resolved: pool liquidity";
    expect(agentBoardLiveAgentKey("ENG-00001", "Engineering", "solved", undefined, fp)).toBe(
      `agentBoard|liveAgent|ENG-00001|Engineering|solved|—|msg${skillSeedFromLabel(fp)}`,
    );
    expect(meshWhisperForBoardLiveAgent("AI-00003", "Data & AI", "learned")).toBe(
      meshWhisperFromKey(agentBoardLiveAgentKey("AI-00003", "Data & AI", "learned")),
    );
    expect(meshStandardBurstForBoardLiveAgent("FIN-00999", "Finance", "alert")).toBe(
      meshStandardBurstFromKey(agentBoardLiveAgentKey("FIN-00999", "Finance", "alert")),
    );
    expect(meshWhisperForBoardCollab("SEC-00001")).toBe(
      meshWhisperFromKey("agentBoard|collab|SEC-00001"),
    );
    expect(meshStandardBurstForBoardCollab("SEC-00001")).toBe(
      meshStandardBurstFromKey("agentBoard|collab|SEC-00001"),
    );
  });
});
