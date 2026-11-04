import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Circle,
  Marker,
  Popup,
  Tooltip,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import { Shield, Users, AlertTriangle, Crosshair, Plus, Scissors, Home, Flame, Info } from 'lucide-react';

// Controller to auto-fit bounds dynamically so ALL nodes in any scenario are centered and framed!
function MapBoundsController({ nodes }) {
  const map = useMap();
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      const bounds = L.latLngBounds(nodes.map(n => [n.lat, n.lng]));
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 14,
        animate: true,
        duration: 0.8
      });
    }
  }, [nodes, map]);
  return null;
}

// Map Click Listener for interactive placement tools
function MapClickHandler({ onMapClick, activeTool }) {
  useMapEvents({
    click(e) {
      if (activeTool && activeTool !== 'inspect' && onMapClick) {
        onMapClick(e.latlng, activeTool);
      }
    },
  });
  return null;
}

// Shelter Icon
const createShelterIcon = (node, isTarget) => {
  return L.divIcon({
    className: 'custom-shelter-marker',
    html: `
      <div class="relative flex flex-col items-center group cursor-pointer -translate-y-2">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
          isTarget
            ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-400/40 shadow-lg shadow-emerald-500/50 scale-110'
            : 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 shadow-md shadow-emerald-950/40 hover:scale-110 hover:border-emerald-300'
        }">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div class="mt-1 px-1.5 py-0.5 rounded-full bg-slate-950/90 border border-emerald-500/40 text-[9px] font-mono text-emerald-300 whitespace-nowrap shadow backdrop-blur-sm">
          ${node.current_occupancy.toLocaleString()} / ${node.capacity.toLocaleString()}
        </div>
      </div>
    `,
    iconSize: [32, 46],
    iconAnchor: [16, 40],
  });
};

// Population Zone Icon
const createZoneIcon = (node, isSelected) => {
  const isEndangered = node.in_hazard_zone;
  return L.divIcon({
    className: 'custom-zone-marker',
    html: `
      <div class="relative flex flex-col items-center group cursor-pointer -translate-y-2">
        <div class="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
          isSelected
            ? 'bg-sky-500 text-slate-950 ring-4 ring-sky-400/40 shadow-lg shadow-sky-500/50 scale-110'
            : isEndangered
            ? 'bg-rose-950/90 text-rose-400 border border-rose-500/60 shadow-md shadow-rose-950/40 hover:scale-110'
            : 'bg-amber-950/90 text-amber-400 border border-amber-500/50 shadow-md shadow-amber-950/40 hover:scale-110'
        }">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div class="mt-1 px-1.5 py-0.5 rounded-full bg-slate-950/90 border ${
          isEndangered ? 'border-rose-500/50 text-rose-300' : 'border-amber-500/40 text-amber-300'
        } text-[9px] font-mono whitespace-nowrap shadow backdrop-blur-sm">
          ${node.population.toLocaleString()}
        </div>
      </div>
    `,
    iconSize: [32, 46],
    iconAnchor: [16, 40],
  });
};

// Junction Icon
const createJunctionIcon = (node, isVisited, isFrontier) => {
  let innerClass = 'bg-slate-700 border-slate-500';
  if (isFrontier) innerClass = 'bg-sky-400 border-white ring-4 ring-sky-400/40 animate-pulse';
  else if (isVisited) innerClass = 'bg-emerald-400 border-white';

  return L.divIcon({
    className: 'custom-junction-marker',
    html: `
      <div class="w-3.5 h-3.5 rounded-full ${innerClass} border shadow cursor-pointer transition-transform hover:scale-150"></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

export default function MapView({
  graph,
  activePaths = [],
  highlightedEdges = [],
  visitedNodes = [],
  frontierNodes = [],
  selectedSourceId,
  onSelectSource,
  onToggleRoad,
  onMapClick,
  activeTool = 'inspect',
  setActiveTool,
  activeStep
}) {
  const nodes = graph?.nodes || [];

  const activePathEdgesSet = useMemo(() => {
    const s = new Set();
    activePaths.forEach(p => {
      (p.path_edges || []).forEach(eId => s.add(eId));
    });
    return s;
  }, [activePaths]);

  const bottleneckEdgesSet = useMemo(() => {
    const s = new Set();
    (graph?.edges || []).forEach(e => {
      if (e.is_bottleneck) s.add(e.id);
    });
    return s;
  }, [graph]);

  const visitedSet = useMemo(() => new Set(visitedNodes), [visitedNodes]);
  const frontierSet = useMemo(() => new Set(frontierNodes), [frontierNodes]);

  if (!graph || !graph.nodes) {
    return (
      <div className="h-full flex items-center justify-center bg-[#090a0f] text-zinc-500 font-mono text-xs">
        Loading GIS Telemetry...
      </div>
    );
  }

  const nodesMap = {};
  nodes.forEach(n => { nodesMap[n.id] = n; });

  const toolLabels = {
    inspect: 'Inspect Mode (Click roads to toggle block/open)',
    cut_road: 'Road Cutter Tool (Click any road to sever/open)',
    add_zone: 'Add Evacuation Zone (Click on map to place people)',
    add_shelter: 'Add Safe Bunker (Click on map to place shelter)',
    drop_hazard: 'Deploy Hazard (Click on map to drop disaster)'
  };

  return (
    <div className="relative w-full h-full dark-map-tiles select-none">
      {/* Interactive Tool Banner in Top-Center of Map */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-1.5 glass-panel rounded-full p-1.5 shadow-2xl border border-white/10">
        {[
          { id: 'inspect', label: 'Inspect', icon: Crosshair },
          { id: 'cut_road', label: 'Cut Road', icon: Scissors, color: 'text-rose-400' },
          { id: 'add_zone', label: '+ Zone', icon: Users, color: 'text-amber-400' },
          { id: 'add_shelter', label: '+ Shelter', icon: Home, color: 'text-emerald-400' },
          { id: 'drop_hazard', label: '+ Hazard', icon: Flame, color: 'text-blue-400' }
        ].map(tool => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                isActive
                  ? 'bg-sky-500 text-slate-950 shadow-md font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tool Action Hint Banner */}
      {activeTool !== 'inspect' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400] bg-sky-500/90 text-slate-950 font-bold text-xs px-4 py-1 rounded-full shadow-lg border border-white/20 animate-bounce">
          🎯 {toolLabels[activeTool]}
        </div>
      )}

      <MapContainer
        center={[13.0450, 80.2200]}
        zoom={12}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapBoundsController nodes={nodes} />
        <MapClickHandler onMapClick={onMapClick} activeTool={activeTool} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Hazard Danger Circles */}
        {(graph.disasters || []).map((disaster, idx) => {
          const radiusMeters = (disaster.radius_km || 1.0) * 1000;
          let strokeColor = '#3b82f6';
          let fillColor = '#1d4ed8';

          if (disaster.type === 'fire') {
            strokeColor = '#f97316';
            fillColor = '#ea580c';
          } else if (disaster.type === 'earthquake') {
            strokeColor = '#ef4444';
            fillColor = '#b91c1c';
          }

          return (
            <React.Fragment key={disaster.id || idx}>
              <Circle
                center={[disaster.lat, disaster.lng]}
                radius={radiusMeters}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: 0.16,
                  weight: 1.5,
                  dashArray: '5, 8'
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1 p-0.5">
                    <div className="font-semibold uppercase tracking-wider text-rose-400 text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {disaster.type.toUpperCase()} IMPACT ZONE
                    </div>
                    <div className="font-medium text-slate-100">{disaster.name || 'Hazard Epicenter'}</div>
                    <div className="text-slate-400 text-[11px]">{disaster.description}</div>
                    <div className="text-[10px] text-sky-400 font-mono pt-1">
                      Radius: {disaster.radius_km} km | Severity: {Math.round((disaster.severity || 0.8) * 100)}%
                    </div>
                  </div>
                </Popup>
              </Circle>

              <Circle
                center={[disaster.lat, disaster.lng]}
                radius={radiusMeters * 0.25}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: 0.45,
                  weight: 2
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Road Network Polylines */}
        {(graph.edges || []).map((edge) => {
          const src = nodesMap[edge.source];
          const dst = nodesMap[edge.target];
          if (!src || !dst) return null;

          const positions = [
            [src.lat, src.lng],
            [dst.lat, dst.lng]
          ];

          const isBlocked = edge.status !== 'open';
          const isActivePath = activePathEdgesSet.has(edge.id);
          const isBottleneck = bottleneckEdgesSet.has(edge.id);
          const isStepHighlighted = highlightedEdges.includes(edge.id);

          let polyColor = '#334155';
          let weight = 2.5;
          let opacity = 0.65;
          let dashArray = undefined;

          if (isBlocked) {
            polyColor = '#f43f5e';
            weight = 4;
            opacity = 0.95;
            dashArray = '5, 7';
          } else if (isBottleneck) {
            polyColor = '#f59e0b';
            weight = 5;
            opacity = 1.0;
          } else if (isStepHighlighted) {
            polyColor = '#ec4899';
            weight = 4.5;
            opacity = 1.0;
          } else if (isActivePath) {
            polyColor = '#38bdf8';
            weight = 5;
            opacity = 1.0;
          }

          return (
            <Polyline
              key={edge.id}
              positions={positions}
              pathOptions={{
                color: polyColor,
                weight: weight,
                opacity: opacity,
                dashArray: dashArray,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              eventHandlers={{
                click: () => onToggleRoad && onToggleRoad(edge.id),
              }}
            >
              <Tooltip sticky>
                <div className="text-xs space-y-1 p-0.5">
                  <div className="font-semibold text-slate-100 flex items-center justify-between gap-3">
                    <span>Corridor: {edge.id}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold ${isBlocked ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                      {edge.status}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    {src.name} &rarr; {dst.name}
                  </div>
                  <div className="text-sky-300 text-[11px] font-mono">
                    {edge.distance_km} km | Flow Capacity: {edge.capacity_flow} p/hr
                  </div>
                  {isBottleneck && (
                    <div className="text-amber-400 font-medium text-[11px] pt-0.5">
                      &bull; Saturated Capacity Bottleneck
                    </div>
                  )}
                  <div className="text-[10px] text-sky-400 italic pt-0.5 font-bold">
                    [Click to {isBlocked ? 'OPEN' : 'SEVER'} this road]
                  </div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Nodes (Shelters, Zones, Junctions) */}
        {nodes.map((node) => {
          const isSelected = selectedSourceId === node.id;
          const isVisited = visitedSet.has(node.id);
          const isFrontier = frontierSet.has(node.id);

          let icon;
          if (node.type === 'shelter') {
            icon = createShelterIcon(node, isSelected);
          } else if (node.type === 'zone') {
            icon = createZoneIcon(node, isSelected);
          } else {
            icon = createJunctionIcon(node, isVisited, isFrontier);
          }

          return (
            <Marker
              key={node.id}
              position={[node.lat, node.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (node.type === 'zone' && onSelectSource) {
                    onSelectSource(node.id);
                  }
                },
              }}
            >
              <Popup>
                <div className="text-xs space-y-2 p-1 min-w-[210px]">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                    <span className="font-semibold text-slate-100">{node.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300 uppercase">
                      {node.type}
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px]">{node.description || 'Sector node'}</p>

                  {node.type === 'zone' && (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="text-amber-300 flex items-center justify-between">
                        <span>Evacuee Population:</span>
                        <span className="font-semibold font-mono">{node.population.toLocaleString()}</span>
                      </div>
                      {node.in_hazard_zone && (
                        <div className="text-rose-400 font-medium flex items-center justify-between">
                          <span>Hazard Risk:</span>
                          <span>SEVERITY {Math.round(node.hazard_severity * 100)}%</span>
                        </div>
                      )}
                      <button
                        onClick={() => onSelectSource && onSelectSource(node.id)}
                        className="mt-1 w-full py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition"
                      >
                        Set as Evacuation Origin
                      </button>
                    </div>
                  )}

                  {node.type === 'shelter' && (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>Max Capacity:</span>
                        <span className="font-mono">{node.capacity.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Current Occupancy:</span>
                        <span className="font-mono">{node.current_occupancy.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold text-sky-300">
                        <span>Available Beds:</span>
                        <span className="font-mono">{Math.max(0, node.capacity - node.current_occupancy).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (node.current_occupancy / (node.capacity || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Cartographic Legend */}
      <div className="absolute bottom-4 left-4 z-[400] glass-panel rounded-xl px-3.5 py-2.5 text-[11px] shadow-2xl pointer-events-auto border border-white/10 hidden md:block">
        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
          Cartographic Legend
        </div>
        <div className="flex items-center gap-4 text-zinc-300 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            <span>Safe Shelter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
            <span>Evacuation Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-sky-400"></span>
            <span>Active Corridor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-rose-500 border-b border-dashed border-rose-300"></span>
            <span>Severed Road</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-amber-400"></span>
            <span>Bottleneck</span>
          </div>
        </div>
      </div>
    </div>
  );
}
