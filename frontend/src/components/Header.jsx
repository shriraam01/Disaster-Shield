import React from 'react';
import { Shield, GraduationCap, BarChart2, RotateCcw, ExternalLink } from 'lucide-react';

export default function Header({
  scenarios,
  currentScenarioId,
  onSelectScenario,
  onResetScenario,
  onOpenCompare,
  onOpenDemoSuite,
  isLoading,
  threatLevel = 'ELEVATED'
}) {
  const threatConfig = {
    LOW: { label: 'ADVISORY', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    ELEVATED: { label: 'INCIDENT ACTIVE', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    CRITICAL: { label: 'EMERGENCY: SEVERE', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' }
  };

  const currentThreat = threatConfig[threatLevel] || threatConfig.ELEVATED;

  return (
    <header className="glass-panel border-b border-white/10 px-5 py-2.5 sticky top-0 z-50">
      <div className="max-w-[1900px] mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                DisasterShield<span className="text-sky-400">™</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10 uppercase">
                Operations Center
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-normal">
              Autonomous Municipal Evacuation Intelligence & Dispatch
            </p>
          </div>
        </div>

        {/* Center: Live Sector & Threat Status */}
        <div className="flex items-center gap-3">
          {/* Threat Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${currentThreat.bg}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
            <span>{currentThreat.label}</span>
          </div>

          {/* Sector Selector */}
          <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-1.5 border border-white/10 text-xs">
            <span className="text-zinc-400 font-medium">Municipal Sector:</span>
            <select
              value={currentScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              disabled={isLoading}
              className="bg-transparent text-sky-400 font-semibold focus:outline-none cursor-pointer disabled:opacity-50"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* PROFESSOR DEMO SUITE BUTTON */}
          <button
            onClick={onOpenDemoSuite}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition hover:scale-105 active:scale-95 animate-pulse"
          >
            <GraduationCap className="w-4 h-4 fill-current" />
            <span>Professor Demo Suite</span>
          </button>

          {/* Diagnostics & Benchmark */}
          <button
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold text-xs border border-sky-400/30 transition active:scale-95"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Engine Analytics</span>
          </button>

          {/* Reset Grid */}
          <button
            onClick={onResetScenario}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium border border-white/10 transition"
            title="Reset road blocks and hazard state"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reset Grid</span>
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/shriraam01/Disaster-Shield"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition"
            title="View Source on GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
