import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Navigation,
  Compass,
  ArrowRight,
  Sliders,
  CheckCircle2
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
  // Operational routing engine modes (industry product naming)
  const routingEngines = [
    {
      id: 'dijkstra',
      name: 'Shortest Route',
      tag: 'Direct Minimal Distance',
      desc: 'Computes guaranteed shortest accessible roads to safety.'
    },
    {
      id: 'astar',
      name: 'Precision Express',
      tag: 'Goal-Directed Heuristic',
      desc: 'Targeted pathfinding directly oriented toward safe shelters.'
    },
    {
      id: 'bfs',
      name: 'Perimeter Hops',
      tag: 'Minimal Intersections',
      desc: 'Minimizes junction checkpoints and reveals isolated zones.'
    },
    {
      id: 'max-flow',
      name: 'Multi-Corridor Flow',
      tag: 'Network Capacity Optimized',
      desc: 'Balances evacuee volume across roads to prevent traffic gridlock.'
    },
    {
      id: 'greedy',
      name: 'Urgency Triage',
      tag: 'High-Risk Priority',
      desc: 'Immediate field triage matching endangered zones first.'
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
    <div className="glass-panel rounded-2xl p-4 space-y-3.5 border border-white/10">
      {/* Title */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-xs tracking-wider text-zinc-300 uppercase flex items-center gap-2">
          <Navigation className="w-4 h-4 text-sky-400" />
          Evacuation Routing Engine
        </span>
        <span className="text-[11px] font-medium text-zinc-400">
          Autonomous Dispatch
        </span>
      </div>

      {/* Routing Mode Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {routingEngines.map(engine => {
          const isSelected = selectedAlgorithm === engine.id;
          return (
            <button
              key={engine.id}
              onClick={() => {
                setSelectedAlgorithm(engine.id);
                setCurrentStepIndex(0);
                setIsPlaying(false);
              }}
              className={`p-2.5 rounded-xl text-left transition-all duration-200 border ${
                isSelected
                  ? 'bg-sky-500/15 border-sky-500/70 text-white shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30'
                  : 'bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <div className="text-xs font-semibold truncate text-zinc-200">{engine.name}</div>
              <div className="text-[10px] text-sky-400 truncate mt-0.5">{engine.tag}</div>
            </button>
          );
        })}
      </div>

      {/* Origin Zone & Target Shelter Selection */}
      {(selectedAlgorithm === 'dijkstra' || selectedAlgorithm === 'astar' || selectedAlgorithm === 'bfs') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-white/10">
          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Evacuation Zone Origin:
            </label>
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-amber-300 font-medium focus:outline-none focus:border-sky-500"
            >
              {zones.map(z => (
                <option key={z.id} value={z.id} className="bg-slate-900 text-white">
                  {z.name} ({z.population.toLocaleString()} evacuees)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Destination Shelter:
            </label>
            <select
              value={selectedShelterId || ''}
              onChange={(e) => setSelectedShelterId(e.target.value || null)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-emerald-300 font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="" className="bg-slate-900 text-white">Auto-Route to Optimal Shelter</option>
              {shelters.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} (Cap: {s.capacity.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Dispatch Evacuation Button */}
      <button
        onClick={onExecuteAlgorithm}
        disabled={isLoading}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        <Navigation className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span>
          {isLoading
            ? 'Calculating Optimal Route Plan...'
            : `Dispatch Route (${routingEngines.find(e => e.id === selectedAlgorithm)?.name})`}
        </span>
      </button>

      {/* Traversal Step Scrubber */}
      {steps.length > 0 && (
        <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-sky-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Route Traversal Scrubber
            </span>
            <span className="font-mono text-zinc-400 text-[11px]">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max={steps.length - 1}
            value={currentStepIndex}
            onChange={(e) => {
              setCurrentStepIndex(parseInt(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />

          {/* Controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setCurrentStepIndex(0);
                  setIsPlaying(false);
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setCurrentStepIndex(prev => Math.max(0, prev - 1));
                  setIsPlaying(false);
                }}
                disabled={currentStepIndex === 0}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow"
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
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Playback speed */}
            <div className="flex items-center gap-1 text-[10px] font-mono bg-black/40 p-0.5 rounded-lg border border-white/10">
              {[
                { label: '0.5x', speed: 800 },
                { label: '1x', speed: 400 },
                { label: '2x', speed: 150 }
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => setPlaybackSpeed(item.speed)}
                  className={`px-2 py-0.5 rounded-md ${
                    playbackSpeed === item.speed ? 'bg-sky-500 text-slate-950 font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Narration */}
          {currentStep && (
            <div className="bg-white/5 border border-white/5 rounded-lg p-2.5 text-xs font-mono space-y-1">
              <div className="text-[10px] text-sky-400 font-semibold uppercase">
                Status: {currentStep.type}
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Operational Route Telemetry */}
      {algorithmResult && (
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-center">
          <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
            <div className="text-[10px] text-zinc-400 font-medium uppercase">Response Time</div>
            <div className="text-sm font-bold text-sky-400 font-mono mt-0.5">{algorithmResult.execution_time_ms} ms</div>
          </div>
          <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
            <div className="text-[10px] text-zinc-400 font-medium uppercase">Transit Distance</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
              {algorithmResult.paths?.[0]?.distance_km ? `${algorithmResult.paths[0].distance_km} km` : algorithmResult.max_evacuation_flow_rate ? `${algorithmResult.max_evacuation_flow_rate} p/hr` : 'Optimal'}
            </div>
          </div>
          <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
            <div className="text-[10px] text-zinc-400 font-medium uppercase">Est. Travel Time</div>
            <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
              {algorithmResult.paths?.[0]?.estimated_time_min ? `${algorithmResult.paths[0].estimated_time_min} min` : 'Continuous'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
