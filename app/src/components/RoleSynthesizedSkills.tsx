import { useMemo } from 'react';
import { Dna } from 'lucide-react';
import {
  synthesizeMeshSkills,
  NOMINAL_SKILL_UNIVERSE,
  formatBigSpace,
  SKILL_ALLELE_SPACE,
} from '@/lib/skillGenome';

const SYNTH_STANDARD = 16;
const SYNTH_DEEP = 12;

interface RoleSynthesizedSkillsProps {
  deptId: string;
  roleTitle: string;
  canonicalSkills: readonly string[];
}

/**
 * Runtime-recombined “skill DNA” — standard + deep tier; nominal universe in UI caption.
 */
const RoleSynthesizedSkills = ({
  deptId,
  roleTitle,
  canonicalSkills,
}: RoleSynthesizedSkillsProps) => {
  const standard = useMemo(
    () => synthesizeMeshSkills(deptId, roleTitle, canonicalSkills, SYNTH_STANDARD, 'standard'),
    [deptId, roleTitle, canonicalSkills]
  );

  const deep = useMemo(
    () => synthesizeMeshSkills(deptId, roleTitle, canonicalSkills, SYNTH_DEEP, 'deep'),
    [deptId, roleTitle, canonicalSkills]
  );

  return (
    <div className="mt-2 border-t border-purple-500/20 pt-2 space-y-3">
      <div className="flex items-start gap-1.5">
        <Dna className="h-3 w-3 shrink-0 text-purple-400/90 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <div className="text-[9px] font-mono tracking-wide text-purple-300/95">
            RECOMBINANT LOCI · 10 alleles · {formatBigSpace(SKILL_ALLELE_SPACE)} lattice ·{' '}
            {formatBigSpace(NOMINAL_SKILL_UNIVERSE)} nominal isomers
          </div>
          <p className="mt-1 text-[8px] leading-snug text-solaris-muted/70">
            Standard: full templates + DNA-2 / DNA-3 crossover from your curated genes. Deep: compact epoch + locale
            shards for HUD-scale expression. Nothing is pre-stored — only deterministic draws.
          </p>
        </div>
      </div>

      <div>
        <div className="mb-1 text-[8px] font-mono uppercase tracking-wider text-purple-400/70">
          Tier A — expressome
        </div>
        <div className="flex flex-wrap gap-1">
          {standard.map((s, i) => (
            <span
              key={`${deptId}-${roleTitle}-a-${i}`}
              className="max-w-full rounded border border-purple-500/25 bg-purple-500/[0.06] px-1.5 py-0.5 text-[8px] sm:text-[9px] leading-snug text-purple-100/85"
              title={s}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-[8px] font-mono uppercase tracking-wider text-cyan-500/70">
          Tier B — deep / feed-native
        </div>
        <div className="flex flex-wrap gap-1">
          {deep.map((s, i) => (
            <span
              key={`${deptId}-${roleTitle}-b-${i}`}
              className="max-w-full rounded border border-cyan-500/20 bg-cyan-500/[0.05] px-1.5 py-0.5 text-[8px] sm:text-[9px] leading-snug text-cyan-100/80"
              title={s}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSynthesizedSkills;
