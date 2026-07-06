import type { LangCode } from '@/hooks/useLanguage';
import { CET_FIXED_SUPPLY_CAP } from '@/lib/domainPillars';

export type TokenomicsAllocationId =
  | 'public_circulation'
  | 'locked_staking'
  | 'team_development'
  | 'liquidity_reserve'
  | 'airdrop_marketing';

export type TokenomicsAllocation = {
  id: TokenomicsAllocationId;
  pct: number;
  color: string;
  label: { en: string; ro: string };
  unlock: { en: string; ro: string };
};

export const TOKENOMICS_TOTAL_SUPPLY_CET = CET_FIXED_SUPPLY_CAP;

export const TOKENOMICS_BURNED_PCT = 0;

export const TOKENOMICS_HOLDERS = 0;

export const TOKENOMICS_ALLOCATION: readonly TokenomicsAllocation[] = [
  {
    id: 'public_circulation',
    pct: 45,
    color: '#2EE7FF',
    label: { en: 'Public Circulation', ro: 'Circulație Publică' },
    unlock: { en: '100% unlocked at launch', ro: '100% deblocat la lansare' },
  },
  {
    id: 'locked_staking',
    pct: 25,
    color: '#F2C94C',
    label: { en: 'Locked / Staking', ro: 'Blocat / Staking' },
    unlock: { en: 'Linear unlock over 36 months', ro: 'Deblocare liniară pe 36 luni' },
  },
  {
    id: 'team_development',
    pct: 15,
    color: '#34D399',
    label: { en: 'Team & Development', ro: 'Echipă & Dezvoltare' },
    unlock: { en: '6-month cliff, then linear 24 months', ro: 'Cliff 6 luni, apoi liniar 24 luni' },
  },
  {
    id: 'liquidity_reserve',
    pct: 10,
    color: '#A78BFA',
    label: { en: 'Liquidity Reserve', ro: 'Rezervă Lichiditate' },
    unlock: { en: 'Locked 12 months, then as needed', ro: 'Blocat 12 luni, apoi după necesar' },
  },
  {
    id: 'airdrop_marketing',
    pct: 5,
    color: '#FB7185',
    label: { en: 'Airdrop / Marketing', ro: 'Airdrop / Promovare' },
    unlock: { en: '30% at launch, remainder over 6 months', ro: '30% la lansare, restul pe 6 luni' },
  },
];

export function tokenomicsTextByLang(lang: LangCode, text: { en: string; ro: string }): string {
  return (text as Partial<Record<LangCode, string>>)[lang] ?? text.en;
}

export function tokenomicsAmountForPct(totalSupply: number, pct: number): number {
  return Math.round((totalSupply * pct) / 100);
}
