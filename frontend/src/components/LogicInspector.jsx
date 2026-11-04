import React, { useState } from 'react';
import { Terminal, Cpu, Database, ChevronDown, ChevronUp, Code2 } from 'lucide-react';

export default function LogicInspector({ currentStep, algorithmResult, selectedAlgorithm }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!algorithmResult) return null;

  const distances = currentStep?.distances || {};
  const visited = currentStep?.visited_nodes || [];
  const frontier = currentStep?.frontier_nodes || currentStep?.open_set || currentStep?.queue || [];

  return (
    <div className="glass-panel rounded-2xl border border-sky-500/30 overflow-hidden shadow-2xl transition-all">
      {/* Accordion Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between bg-sky-950/40 hover:bg-sky-900/30 text-xs font-semibold text-sky-300 transition"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span>Backend DAA Logic & Heap Data Structure Inspector</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30">
            Live Memory State
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
          <span>{isExpanded ? 'Collapse' : 'Inspect Data Structures'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 bg-black/60 space-y-3 font-mono text-[11px] border-t border-white/10">
          {/* Complexity & Strategy Badge */}
          <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
            <span className="text-zinc-300">
              Algorithm: <strong className="text-white">{algorithmResult.algorithm}</strong>
            </span>
            <span className="text-sky-400 font-bold">
              Time: {algorithmResult.theoretical_complexity?.time_complexity || 'O(V+E)'} | Space: {algorithmResult.theoretical_complexity?.space_complexity || 'O(V)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left: Priority Queue / Frontier */}
            <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-between">
                <span>Priority Queue / Active Frontier</span>
                <span>{frontier.length} pending</span>
              </div>
              <div className="max-h-24 overflow-y-auto text-zinc-300 space-y-1">
                {frontier.length === 0 ? (
                  <span className="text-zinc-500 italic">Queue is empty / search terminated</span>
                ) : (
                  frontier.slice(0, 8).map((nodeId, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 px-2 py-0.5 rounded">
                      <span className="text-sky-300">Vertex [{nodeId}]</span>
                      <span className="text-amber-400 font-bold">
                        {distances[nodeId] ? `${distances[nodeId]} km` : 'Active in Heap'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Visited Set & Relaxation Math */}
            <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
                <span>Closed Set / Relaxed Vertices</span>
                <span>{visited.length} processed</span>
              </div>
              <div className="max-h-24 overflow-y-auto text-zinc-300 space-y-1">
                {visited.length === 0 ? (
                  <span className="text-zinc-500 italic">No vertices processed yet</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {visited.map((v, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px]">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Step Mathematical Explanation */}
          {currentStep && (
            <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-500/20 text-zinc-200">
              <span className="text-sky-400 font-bold">Mathematical Operation: </span>
              {currentStep.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
