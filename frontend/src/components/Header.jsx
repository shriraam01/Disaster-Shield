import React from 'react';
import { Shield, AlertTriangle, BarChart3, RefreshCw, Radio, ExternalLink } from 'lucide-react';

export default function Header({
  scenarios,
  currentScenarioId,
  onSelectScenario,
  onResetScenario,
  onOpenCompare,
  isLoading,
  threatLevel = 'ELEVATED'
}) {
  const threatColors = {
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    ELEVATED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    CRITICAL: 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-wide">
                Disaster<span className="text-cyan-400">Shield</span>
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                DAA Core v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Intelligent Disaster Evacuation & Algorithmic Command Center
            </p>
          </div>
        </div>

        {/* Center: Scenario Selection & Threat Status */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Threat Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${threatColors[threatLevel] || threatColors.ELEVATED}`}>
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>HAZARD ALERT: {threatLevel}</span>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 rounded-lg p-1 border border-slate-700">
            <span className="text-xs text-slate-400 px-2 font-medium">Scenario:</span>
            <select
              value={currentScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              disabled={isLoading}
              className="bg-slate-900 text-xs text-cyan-300 font-medium py-1 px-2 rounded border border-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Reset Scenario */}
          <button
            onClick={onResetScenario}
            disabled={isLoading}
            title="Reset road blocks and disaster state to scenario default"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Reset Grid</span>
          </button>

          {/* Compare Algorithms */}
          <button
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 border border-cyan-400/30 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Compare Algorithms</span>
          </button>

          {/* Repo Link */}
          <a
            href="https://github.com/shriraam01/Disaster-Shield"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title="View GitHub Repository"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
