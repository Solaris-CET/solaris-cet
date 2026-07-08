import { getReActPhaseStatus, phaseOrderIndex } from '@/lib/cetAiReAct';
import type { ReActPhase } from '@/lib/cetAiSearchTypes';

// --- ReAct Panels (shared between widget and modal) ---
export function ReActPanels({ phase }: { phase: ReActPhase }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* OBSERVE */}
      <div className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-500 bg-gray-950/50 backdrop-blur-sm ${getReActPhaseStatus(phase, ['observe_parse', 'observe_context'])}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base uppercase tracking-wider">1. Observe</h3>
          <span className="text-xs font-mono bg-gray-900 px-2 py-1 rounded">INPUT PARSER</span>
        </div>
        <div className="text-sm space-y-2 opacity-80">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'observe_parse' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 1 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>Intent Extraction</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'observe_context' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 2 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>Context Mapping</span>
          </div>
        </div>
      </div>

      {/* THINK */}
      <div className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-500 bg-gray-950/50 backdrop-blur-sm ${getReActPhaseStatus(phase, ['think_route', 'think_validate'])}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base uppercase tracking-wider">2. Think</h3>
          <span className="text-xs font-mono bg-gray-900 px-2 py-1 rounded">GEMINI REASON</span>
        </div>
        <div className="text-sm space-y-2 opacity-80">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'think_route' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 3 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>Logic Routing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'think_validate' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 4 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>Constraint Validation</span>
          </div>
        </div>
      </div>

      {/* ACT */}
      <div className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-500 bg-gray-950/50 backdrop-blur-sm ${getReActPhaseStatus(phase, ['act_execute', 'act_consensus'])}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base uppercase tracking-wider">3. Act</h3>
          <span className="text-xs font-mono bg-gray-900 px-2 py-1 rounded">GROK ACT</span>
        </div>
        <div className="text-sm space-y-2 opacity-80">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'act_execute' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 5 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>Execution Payload</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'act_consensus' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 6 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>TON Consensus</span>
          </div>
        </div>
      </div>

      {/* VERIFY */}
      <div className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-500 bg-gray-950/50 backdrop-blur-sm ${getReActPhaseStatus(phase, ['verify_cross', 'verify_anchor'])}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base uppercase tracking-wider">4. Verify</h3>
          <span className="text-xs font-mono bg-gray-900 px-2 py-1 rounded">ZK PROOF</span>
        </div>
        <div className="text-sm space-y-2 opacity-80">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'verify_cross' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 7 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>Cross-Model Check</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'verify_anchor' ? 'bg-yellow-400 motion-safe:animate-pulse' : phaseOrderIndex(phase) > 8 ? 'bg-green-500' : 'bg-gray-700'}`} />
            <span>IPFS Anchor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
