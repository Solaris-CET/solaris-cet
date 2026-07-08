import type { ReActPhase } from './cetAiSearchTypes';

export function getReActPhaseStatus(phase: ReActPhase, targetPhases: ReActPhase[]): string {
  if (phase === 'idle') return 'text-gray-600 border-gray-800';
  if (phase === 'complete')
    return 'text-green-500 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
  if (targetPhases.includes(phase))
    return 'text-yellow-400 border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)] motion-safe:animate-pulse';

  const phaseOrder: ReActPhase[] = [
    'idle', 'observe_parse', 'observe_context',
    'think_route', 'think_validate',
    'act_execute', 'act_consensus', 'verify_cross', 'verify_anchor', 'complete',
  ];
  const currentIndex = phaseOrder.indexOf(phase);
  const targetIndex = Math.max(...targetPhases.map(p => phaseOrder.indexOf(p)));
  return currentIndex > targetIndex
    ? 'text-green-400 border-green-400/30'
    : 'text-gray-600 border-gray-800';
}

/** Linear index through ReAct phases — drives dot states in `ReActPanels`. */
export function phaseOrderIndex(currentPhase: string): number {
  const phases: ReActPhase[] = [
    'idle', 'observe_parse', 'observe_context',
    'think_route', 'think_validate',
    'act_execute', 'act_consensus', 'verify_cross', 'verify_anchor', 'complete',
  ];
  return phases.indexOf(currentPhase as ReActPhase);
}
