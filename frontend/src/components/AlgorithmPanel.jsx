import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Zap,
  Clock,
  Compass,
  GitBranch,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

export default function AlgorithmPanel({
  graph,
  selectedAlgorithm,
  setSelectedAlgorithm,
  selectedSourceId,
  setSelectedSourceId,
  selectedShelterId,
  setSelectedShelterId,
  onExecuteAlgorithm,
  algorithmResult,
  isLoading,
  currentStepIndex,
  setCurrentStepIndex,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed
}) {
  const algorithmsList = [
    {
      id: 'dijkstra',
      name: "Dijkstra's Algorithm",
      tag: 'Shortest Distance',
      complexity: 'O((V + E) log V)',
      category: 'Greedy'
    },
    {
      id: 'astar',
      name: 'A* Search',
      tag: 'Heuristic Directed',
      complexity: 'O(E) ~ O(b^d)',
      category: 'Informed'
    },
    {
      id: 'bfs',
      name: 'Breadth-First Search',
      tag: 'Min Road Hops',
      complexity: 'O(V + E)',
      category: 'Traversal'
    },
    {
      id: 'max-flow',
      name: 'Edmonds-Karp Max-Flow',
      tag: 'Capacity & Min-Cut',
      complexity: 'O(V · E²)',
      category: 'Network Flow'
    },
    {
      id: 'greedy',
      name: 'Greedy Prioritizer',
      tag: 'Urgency Triage',
      complexity: 'O(Z log Z + Z·S)',
      category: 'Greedy Triage'
    }
  ];

  const zones = (graph?.nodes || []).filter(n => n.type === 'zone');
  const shelters = (graph?.nodes || []).filter(n => n.type === 'shelter');

  const steps = algorithmResult?.steps || [];
  const currentStep = steps[currentStepIndex] || null;

  // Auto-play timer
  useEffect(() => {
    let interval = null;
    if (isPlaying && steps.length > 0) {
      interval = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, steps.length, playbackSpeed, setCurrentStepIndex, setIsPlaying]);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 space-y-3.5">
      {/* Algorithm Selector Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            DAA Algorithm Core
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            {algorithmsList.find(a => a.id === selectedAlgorithm)?.complexity}
          </span>
        </div>

        {/* Algorithm Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
          {algorithmsList.map(algo => {
            const isSelected = selectedAlgorithm === algo.id;
            return (
              <button
                key={algo.id}
                onClick={() => {
                  setSelectedAlgorithm(algo.id);
                  setCurrentStepIndex(0);
                  setIsPlaying(false);
                }}
                className={`p-2 rounded-lg text-left transition border ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-md shadow-cyan-900/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold truncate">{algo.name}</div>
                <div className="text-[9px] text-cyan-400 font-mono">{algo.tag}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Origin Zone & Target Shelter Selection (if applicable) */}
      {(selectedAlgorithm === 'dijkstra' || selectedAlgorithm === 'astar' || selectedAlgorithm === 'bfs') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">
              Evacuation Origin Zone:
            </label>
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-amber-300 font-medium focus:outline-none focus:border-cyan-500"
            >
              {zones.map(z => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.population.toLocaleString()} evacuees)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">
              Target Shelter (Optional):
            </label>
            <select
              value={selectedShelterId || ''}
              onChange={(e) => setSelectedShelterId(e.target.value || null)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-emerald-300 font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="">Auto-Route to Nearest Safe Shelter</option>
              {shelters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (Cap: {s.capacity.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={onExecuteAlgorithm}
        disabled={isLoading}
        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-cyan-600/20 border border-cyan-400/30 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        <Zap className={`w-4 h-4 ${isLoading ? 'animate-bounce' : ''}`} />
        <span>{isLoading ? 'Computing Algorithmic Routes...' : `Execute ${algorithmsList.find(a => a.id === selectedAlgorithm)?.name}`}</span>
      </button>

      {/* Step-by-Step Traversal Visualizer Inspector */}
      {steps.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-cyan-300 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Step-by-Step Traversal Inspector
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              Step {currentStepIndex + 1} / {steps.length}
            </span>
          </div>

          {/* Step Timeline Progress Slider */}
          <input
            type="range"
            min="0"
            max={steps.length - 1}
            value={currentStepIndex}
            onChange={(e) => {
              setCurrentStepIndex(parseInt(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />

          {/* Playback Controls & Speed */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setCurrentStepIndex(0);
                  setIsPlaying(false);
                }}
                title="Restart"
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setCurrentStepIndex(prev => Math.max(0, prev - 1));
                  setIsPlaying(false);
                }}
                disabled={currentStepIndex === 0}
                title="Step Back"
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1 shadow"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={() => {
                  setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1));
                  setIsPlaying(false);
                }}
                disabled={currentStepIndex >= steps.length - 1}
                title="Step Forward"
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speed toggles */}
            <div className="flex items-center gap-1 text-[10px] font-mono bg-slate-900 p-0.5 rounded border border-slate-800">
              {[
                { label: '0.5x', speed: 800 },
                { label: '1x', speed: 400 },
                { label: '2x', speed: 150 }
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => setPlaybackSpeed(item.speed)}
                  className={`px-1.5 py-0.5 rounded ${
                    playbackSpeed === item.speed ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Step Narration */}
          {currentStep && (
            <div className="bg-slate-900 border border-slate-800/80 rounded p-2 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-[11px] text-cyan-400 font-bold uppercase">
                <span>Action: {currentStep.type}</span>
                {currentStep.current_node && <span>Node: {currentStep.current_node}</span>}
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Result Metrics Card */}
      {algorithmResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800 text-center font-mono">
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Runtime</div>
            <div className="text-sm font-bold text-cyan-400">{algorithmResult.execution_time_ms} ms</div>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Explored</div>
            <div className="text-sm font-bold text-amber-400">{algorithmResult.nodes_explored ?? algorithmResult.augmenting_paths_count} nodes</div>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Optimality</div>
            <div className="text-sm font-bold text-emerald-400">
              {algorithmResult.paths?.[0]?.distance_km ? `${algorithmResult.paths[0].distance_km} km` : algorithmResult.max_evacuation_flow_rate ? `${algorithmResult.max_evacuation_flow_rate} p/hr` : 'Optimal'}
            </div>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Complexity</div>
            <div className="text-[11px] font-bold text-indigo-400 truncate">
              {algorithmResult.theoretical_complexity?.time_complexity || 'O(V+E)'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
