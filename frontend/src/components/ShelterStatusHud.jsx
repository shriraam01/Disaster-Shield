import React from 'react';
import { ShieldCheck, AlertCircle, Home, Users2, Activity } from 'lucide-react';

export default function ShelterStatusHud({ graph, algorithmResult }) {
  const shelters = (graph?.nodes || []).filter(n => n.type === 'shelter');
  const zones = (graph?.nodes || []).filter(n => n.type === 'zone');

  const totalPop = zones.reduce((acc, z) => acc + (z.population || 0), 0);
  const totalShelterCap = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const currentOccupancy = shelters.reduce((acc, s) => acc + (s.current_occupancy || 0), 0);
  const totalEvacuated = algorithmResult?.max_evacuation_flow_rate ?? algorithmResult?.total_evacuated ?? currentOccupancy;

  const evacPercent = totalPop > 0 ? Math.min(100, Math.round((totalEvacuated / totalPop) * 100)) : 100;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 space-y-3.5">
      {/* HUD Header */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Shelter & Evacuation HUD
        </span>
        <span className="text-[11px] font-mono text-cyan-400 font-bold">
          {evacPercent}% Evacuated
        </span>
      </div>

      {/* Primary City Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 p-0.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 transition-all duration-700 shadow-sm shadow-emerald-500/50"
            style={{ width: `${evacPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>{totalEvacuated.toLocaleString()} Relocated</span>
          <span>Target Demand: {totalPop.toLocaleString()}</span>
        </div>
      </div>

      {/* Individual Shelters Grid */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Designated Bunker Shelters
        </div>

        <div className="space-y-2">
          {shelters.map(shelter => {
            const occ = shelter.current_occupancy || 0;
            const cap = shelter.capacity || 1;
            const pct = Math.round((occ / cap) * 100);
            const remaining = Math.max(0, cap - occ);

            let barColor = 'bg-emerald-500';
            let textColor = 'text-emerald-400';
            if (pct >= 90) {
              barColor = 'bg-rose-500';
              textColor = 'text-rose-400';
            } else if (pct >= 70) {
              barColor = 'bg-amber-500';
              textColor = 'text-amber-400';
            }

            return (
              <div
                key={shelter.id}
                className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <Home className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate max-w-[180px]">{shelter.name}</span>
                  </div>
                  <span className={`font-mono text-[11px] font-semibold ${textColor}`}>
                    {occ.toLocaleString()} / {cap.toLocaleString()} ({pct}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Available Beds: {remaining.toLocaleString()}</span>
                  {pct >= 90 && <span className="text-rose-400 font-bold">NEAR CAPACITY</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
