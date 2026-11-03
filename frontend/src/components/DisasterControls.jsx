import React, { useState } from 'react';
import { Flame, Waves, Activity, PlusCircle, Maximize2, AlertTriangle } from 'lucide-react';

export default function DisasterControls({
  disasters = [],
  onUpdateDisasters,
  isPlacingDisaster,
  setIsPlacingDisaster,
  newDisasterType,
  setNewDisasterType,
  severedEdgesCount = 0
}) {
  const currentDisaster = disasters[0] || {
    id: 'default',
    type: 'flood',
    name: 'Flood Surge',
    radius_km: 1.0,
    severity: 0.8
  };

  const [radius, setRadius] = useState(currentDisaster.radius_km || 1.0);
  const [severity, setSeverity] = useState(currentDisaster.severity || 0.8);

  const handleRadiusChange = (newVal) => {
    setRadius(newVal);
    const updated = disasters.map((d, i) => i === 0 ? { ...d, radius_km: newVal } : d);
    onUpdateDisasters(updated);
  };

  const handleSeverityChange = (newVal) => {
    setSeverity(newVal);
    const updated = disasters.map((d, i) => i === 0 ? { ...d, severity: newVal } : d);
    onUpdateDisasters(updated);
  };

  const handleExpandHazard = () => {
    const nextRadius = Math.min(3.5, Math.round((radius + 0.25) * 10) / 10);
    handleRadiusChange(nextRadius);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3.5 border border-white/10">
      {/* Title */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-xs tracking-wider text-zinc-300 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          Hazard Parameters
        </span>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 font-medium">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          {severedEdgesCount} Severed Roads
        </span>
      </div>

      {/* Hazard Mode Selector */}
      <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
        {[
          { type: 'flood', label: 'Flood', icon: Waves, activeBg: 'bg-blue-600/30 text-blue-300 border-blue-500/40' },
          { type: 'fire', label: 'Wildfire', icon: Flame, activeBg: 'bg-amber-600/30 text-amber-300 border-amber-500/40' },
          { type: 'earthquake', label: 'Quake', icon: Activity, activeBg: 'bg-rose-600/30 text-rose-300 border-rose-500/40' }
        ].map(item => {
          const Icon = item.icon;
          const isActive = (currentDisaster.type === item.type);
          return (
            <button
              key={item.type}
              onClick={() => {
                const updated = disasters.map((d, i) => i === 0 ? { ...d, type: item.type } : d);
                onUpdateDisasters(updated);
                setNewDisasterType(item.type);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? `${item.activeBg} border shadow-sm`
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sliders */}
      <div className="space-y-3 pt-1">
        {/* Radius */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400 font-medium">Hazard Impact Radius</span>
            <span className="text-sky-400 font-mono font-semibold">{radius} km</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="3.0"
            step="0.1"
            value={radius}
            onChange={(e) => handleRadiusChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>

        {/* Severity */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400 font-medium">Severity Intensity</span>
            <span className="text-rose-400 font-mono font-semibold">{Math.round(severity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={severity}
            onChange={(e) => handleSeverityChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={handleExpandHazard}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-medium border border-white/10 transition"
        >
          <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Surge Spread</span>
        </button>

        <button
          onClick={() => setIsPlacingDisaster(!isPlacingDisaster)}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border transition ${
            isPlacingDisaster
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 animate-pulse'
              : 'bg-white/5 hover:bg-white/10 text-zinc-200 border-white/10'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>{isPlacingDisaster ? 'Click Map...' : 'Add Epicenter'}</span>
        </button>
      </div>
    </div>
  );
}
