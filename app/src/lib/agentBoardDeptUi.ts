import type { LucideIcon } from 'lucide-react';
import {
  Brain,
  Code2,
  Coins,
  Crown,
  FileCheck,
  Globe,
  Palette,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';

import { AGENT_BOARD_DEPT_TO_MESH_ID } from '@/lib/agentBoardSkillMix';

type BoardDeptLabel = keyof typeof AGENT_BOARD_DEPT_TO_MESH_ID;

export type AgentBoardDeptLabel = BoardDeptLabel;

export function isAgentBoardDeptLabel(d: string): d is AgentBoardDeptLabel {
  return Object.prototype.hasOwnProperty.call(AGENT_BOARD_DEPT_TO_MESH_ID, d);
}

export interface AgentBoardDeptUiRow {
  name: string;
  short: string;
  color: string;
  bg: string;
  bar: string;
  icon: LucideIcon;
}

/**
 * Live board styling keyed by the same labels as `AGENT_BOARD_DEPT_TO_MESH_ID`.
 * Inner `satisfies` forces a compile-time update when the mesh map gains or loses a department.
 */
const AGENT_BOARD_DEPT_UI_SAT = {
  'Customer Ops': {
    name: 'Customer Ops',
    short: 'CX',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    bar: 'bg-cyan-400',
    icon: Users,
  },
  Engineering: {
    name: 'Engineering',
    short: 'ENG',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    bar: 'bg-blue-400',
    icon: Code2,
  },
  Sales: {
    name: 'Sales',
    short: 'SLS',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    bar: 'bg-emerald-400',
    icon: TrendingUp,
  },
  'Data & AI': {
    name: 'Data & AI',
    short: 'AI',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    bar: 'bg-purple-400',
    icon: Brain,
  },
  Finance: {
    name: 'Finance',
    short: 'FIN',
    color: 'text-solaris-gold',
    bg: 'bg-solaris-gold/10',
    bar: 'bg-solaris-gold',
    icon: Coins,
  },
  Marketing: {
    name: 'Marketing',
    short: 'MKT',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    bar: 'bg-orange-400',
    icon: Globe,
  },
  Product: {
    name: 'Product',
    short: 'PRD',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    bar: 'bg-pink-400',
    icon: Palette,
  },
  Security: {
    name: 'Security',
    short: 'SEC',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    bar: 'bg-red-400',
    icon: Shield,
  },
  Legal: {
    name: 'Legal',
    short: 'LGL',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    bar: 'bg-amber-400',
    icon: FileCheck,
  },
  Research: {
    name: 'Research',
    short: 'R&D',
    color: 'text-solaris-cyan',
    bg: 'bg-solaris-cyan/10',
    bar: 'bg-solaris-cyan',
    icon: Crown,
  },
} satisfies Record<BoardDeptLabel, AgentBoardDeptUiRow>;

export const AGENT_BOARD_DEPT_UI: Record<BoardDeptLabel, AgentBoardDeptUiRow> = AGENT_BOARD_DEPT_UI_SAT;

export function agentBoardDeptUiRow(dept: string): AgentBoardDeptUiRow {
  if (isAgentBoardDeptLabel(dept)) {
    return AGENT_BOARD_DEPT_UI[dept];
  }
  return AGENT_BOARD_DEPT_UI.Engineering;
}
