import React from 'react';
import { ShieldCheck, Home, AlertCircle } from 'lucide-react';

export default function ShelterStatusHud({ graph, algorithmResult }) {
  const shelters = (graph?.nodes || []).filter(n => n.type === 'shelter');
  const zones = (graph?.nodes || []).filter(n => n.type === 'zone');

  const totalPop = zones.reduce((acc, z) => acc + (z.population || 0), 0);
  const totalShelterCap = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const currentOccupancy = shelters.reduce((acc, s) => acc + (s.current_occupancy || 0), 0);
  const totalEvacuated = algorithmResult?.max_evacuation_flow_rate ?? algorithmResult?.total_evacuated ?? currentOccupancy;

  const evacPercent = totalPop > 0 ? Math.min(100, Math.round((totalEvacuated / totalPop) * 100)) : 100;

  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3.5 border border-white/10">
      {/* Title */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-xs tracking-wider text-zinc-300 uppercase flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Shelter Facility HUD
        </span>
        <span className="text-xs font-mono text-sky-400 font-bold">
          {evacPercent}% Relocated
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="w-full bg-black/50 rounded-full h-2.5 overflow-hidden border border-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-700 shadow-sm"
            style={{ width: `${evacPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
          <span>{totalEvacuated.toLocaleString()} Relocated</span>
          <span>Total Demand: {totalPop.toLocaleString()}</span>
        </div>
      </div>

      {/* Designated Shelters */}
      <div className="space-y-2 pt-1 border-t border-white/10">
        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
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
                className="bg-black/30 border border-white/5 rounded-xl p-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-zinc-200">
                    <Home className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate max-w-[170px]">{shelter.name}</span>
                  </div>
                  <span className={`font-mono text-[11px] font-semibold ${textColor}`}>
                    {occ.toLocaleString()} / {cap.toLocaleString()}
                  </span>
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>Available Beds: <strong className="text-zinc-300 font-mono">{remaining.toLocaleString()}</strong></span>
                  {pct >= 90 && <span className="text-rose-400 font-bold tracking-wider">NEAR CAPACITY</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
