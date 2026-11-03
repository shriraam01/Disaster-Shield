import React, { useState } from 'react';
import { Flame, Waves, Activity, PlusCircle, Maximize2, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

  const getDisasterIcon = (type) => {
    switch (type) {
      case 'fire':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'earthquake':
        return <Activity className="w-4 h-4 text-rose-400" />;
      case 'flood':
      default:
        return <Waves className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getDisasterIcon(currentDisaster.type)}
          <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
            Hazard Dynamics
          </span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          {severedEdgesCount} Roads Severed
        </span>
      </div>

      {/* Disaster Selector / Switcher */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
        {[
          { type: 'flood', label: 'Flood', icon: Waves },
          { type: 'fire', label: 'Wildfire', icon: Flame },
          { type: 'earthquake', label: 'Quake', icon: Activity }
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
              className={`flex items-center justify-center gap-1 py-1.5 rounded text-xs font-semibold transition ${
                isActive
                  ? 'bg-slate-800 text-white shadow border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sliders */}
      <div className="space-y-2.5 pt-1">
        {/* Radius Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400">Hazard Danger Radius</span>
            <span className="text-cyan-400 font-bold">{radius} km</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="3.0"
            step="0.1"
            value={radius}
            onChange={(e) => handleRadiusChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Severity Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400">Impact Intensity</span>
            <span className="text-rose-400 font-bold">{Math.round(severity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={severity}
            onChange={(e) => handleSeverityChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={handleExpandHazard}
          className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Surge / Spread</span>
        </button>

        <button
          onClick={() => setIsPlacingDisaster(!isPlacingDisaster)}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
            isPlacingDisaster
              ? 'bg-rose-600/30 text-rose-300 border-rose-500 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>{isPlacingDisaster ? 'Click on Map...' : 'Spawn Epicenter'}</span>
        </button>
      </div>
    </div>
  );
}
