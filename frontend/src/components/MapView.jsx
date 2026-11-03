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
import { Shield, Users, AlertOctagon, Flame, Waves, Activity } from 'lucide-react';

// Controller to auto-pan and zoom map when scenario center changes
function MapViewController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.flyTo([center.lat, center.lng], zoom || 13, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Map Click Listener for placing custom disaster or inspecting coordinates
function MapClickHandler({ onMapClick, isPlacingDisaster }) {
  useMapEvents({
    click(e) {
      if (isPlacingDisaster && onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

// Custom DivIcons for Shelters, Zones, and Junctions
const createShelterIcon = (node, isTarget) => {
  const availPct = node.capacity > 0 ? Math.round(((node.capacity - node.current_occupancy) / node.capacity) * 100) : 0;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex flex-col items-center group cursor-pointer">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
          isTarget ? 'bg-emerald-400 ring-4 ring-emerald-400/40 text-slate-950 animate-bounce' : 'bg-emerald-600 text-white border-2 border-emerald-300'
        }">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div class="mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 border border-emerald-500/50 text-[10px] font-mono text-emerald-300 whitespace-nowrap shadow">
          ${node.current_occupancy}/${node.capacity} (${availPct}%)
        </div>
      </div>
    `,
    iconSize: [36, 50],
    iconAnchor: [18, 45],
  });
};

const createZoneIcon = (node, isSelected) => {
  const isEndangered = node.in_hazard_zone;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex flex-col items-center group cursor-pointer">
        ${isEndangered ? '<div class="absolute -inset-1 rounded-xl bg-rose-500/40 animate-ping"></div>' : ''}
        <div class="relative w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
          isSelected
            ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/40'
            : isEndangered
            ? 'bg-rose-600 text-white border-2 border-rose-300'
            : 'bg-amber-600 text-white border-2 border-amber-300'
        }">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div class="mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 border ${isEndangered ? 'border-rose-500 text-rose-300' : 'border-amber-500 text-amber-300'} text-[10px] font-mono whitespace-nowrap shadow">
          ${node.population.toLocaleString()} evacuees
        </div>
      </div>
    `,
    iconSize: [32, 46],
    iconAnchor: [16, 42],
  });
};

const createJunctionIcon = (node, isVisited, isFrontier) => {
  let bg = 'bg-slate-700 border-slate-500';
  if (isFrontier) bg = 'bg-cyan-400 border-white ring-4 ring-cyan-400/50 animate-pulse';
  else if (isVisited) bg = 'bg-emerald-400 border-white';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="w-4 h-4 rounded-full ${bg} border-2 shadow flex items-center justify-center cursor-pointer transition-transform hover:scale-125">
        <div class="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
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
  isPlacingDisaster,
  activeStep
}) {
  const center = graph?.center || { lat: 13.0827, lng: 80.2707, zoom: 13 };

  // Set of edge IDs that are in the active evacuation path(s)
  const activePathEdgesSet = useMemo(() => {
    const s = new Set();
    activePaths.forEach(p => {
      (p.path_edges || []).forEach(eId => s.add(eId));
    });
    return s;
  }, [activePaths]);

  // Set of bottleneck edge IDs
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
      <div className="h-full flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-sm">
        Initializing Tactical Map Layer...
      </div>
    );
  }

  const nodesMap = {};
  graph.nodes.forEach(n => { nodesMap[n.id] = n; });

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={center.zoom || 13}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapViewController center={center} zoom={center.zoom} />
        <MapClickHandler onMapClick={onMapClick} isPlacingDisaster={isPlacingDisaster} />

        {/* High-Contrast Tactical Dark Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> | OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Disaster Epicenter Circles */}
        {(graph.disasters || []).map((disaster, idx) => {
          const radiusMeters = (disaster.radius_km || 1.0) * 1000;
          let color = '#3b82f6';
          let fill = '#1d4ed8';

          if (disaster.type === 'fire') {
            color = '#f97316';
            fill = '#ea580c';
          } else if (disaster.type === 'earthquake') {
            color = '#ef4444';
            fill = '#b91c1c';
          }

          return (
            <React.Fragment key={disaster.id || idx}>
              {/* Outer pulsing ring */}
              <Circle
                center={[disaster.lat, disaster.lng]}
                radius={radiusMeters}
                pathOptions={{
                  color: color,
                  fillColor: fill,
                  fillOpacity: 0.25,
                  weight: 2,
                  dashArray: '4, 8'
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      {disaster.type} HAZARD ZONE
                    </div>
                    <div className="text-slate-200 font-semibold">{disaster.name || 'Disaster Epicenter'}</div>
                    <div className="text-slate-400">{disaster.description}</div>
                    <div className="font-mono text-[11px] text-cyan-300">
                      Impact Radius: {disaster.radius_km} km | Severity: {Math.round((disaster.severity || 0.8) * 100)}%
                    </div>
                  </div>
                </Popup>
              </Circle>
              {/* Core epicenter inner circle */}
              <Circle
                center={[disaster.lat, disaster.lng]}
                radius={radiusMeters * 0.3}
                pathOptions={{
                  color: color,
                  fillColor: fill,
                  fillOpacity: 0.6,
                  weight: 3
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

          // Dynamic styling based on algorithmic role & status
          let polyColor = '#334155'; // default muted road
          let weight = 3;
          let opacity = 0.7;
          let dashArray = undefined;

          if (isBlocked) {
            polyColor = '#ef4444'; // Red blocked/flooded/damaged
            weight = 4;
            opacity = 0.9;
            dashArray = '6, 8';
          } else if (isBottleneck) {
            polyColor = '#eab308'; // Saturated yellow Min-Cut bottleneck
            weight = 6;
            opacity = 1.0;
          } else if (isStepHighlighted) {
            polyColor = '#ec4899'; // Relaxing step pink
            weight = 5;
            opacity = 1.0;
          } else if (isActivePath) {
            polyColor = '#06b6d4'; // Active path neon cyan
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
                <div className="text-xs font-mono space-y-0.5">
                  <div className="font-bold text-slate-100 flex items-center justify-between gap-3">
                    <span>Road: {edge.id}</span>
                    <span className={`px-1 rounded text-[10px] uppercase font-sans ${isBlocked ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                      {edge.status}
                    </span>
                  </div>
                  <div className="text-slate-300">
                    {src.name} &harr; {dst.name}
                  </div>
                  <div className="text-cyan-300">
                    Distance: {edge.distance_km} km | Cap: {edge.capacity_flow} p/hr
                  </div>
                  {edge.current_flow > 0 && (
                    <div className="text-amber-300 font-semibold">
                      Current Flow: {edge.current_flow} p/hr ({Math.round((edge.current_flow / edge.capacity_flow) * 100)}%)
                    </div>
                  )}
                  {isBottleneck && (
                    <div className="text-rose-400 font-bold">
                      &bull; CRITICAL MIN-CUT BOTTLENECK
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 italic pt-0.5">
                    Click road to toggle block/open
                  </div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Nodes (Shelters, Population Zones, Junctions) */}
        {(graph.nodes || []).map((node) => {
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
                <div className="text-xs space-y-1.5 p-1 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
                    <span className="font-bold text-slate-100">{node.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                      {node.type}
                    </span>
                  </div>

                  <p className="text-slate-300 text-[11px]">{node.description || 'Grid node'}</p>

                  {node.type === 'zone' && (
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="text-amber-400 flex items-center justify-between">
                        <span>Evacuee Population:</span>
                        <span className="font-bold">{node.population.toLocaleString()}</span>
                      </div>
                      {node.in_hazard_zone && (
                        <div className="text-rose-400 font-semibold flex items-center justify-between">
                          <span>Hazard Proximity:</span>
                          <span>SEVERITY {Math.round(node.hazard_severity * 100)}%</span>
                        </div>
                      )}
                      <button
                        onClick={() => onSelectSource && onSelectSource(node.id)}
                        className="mt-2 w-full py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-xs font-semibold transition"
                      >
                        Set as Evacuation Origin
                      </button>
                    </div>
                  )}

                  {node.type === 'shelter' && (
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>Total Capacity:</span>
                        <span>{node.capacity.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Current Occupancy:</span>
                        <span>{node.current_occupancy.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-cyan-300">
                        <span>Available Space:</span>
                        <span>{Math.max(0, node.capacity - node.current_occupancy).toLocaleString()}</span>
                      </div>
                      {/* Capacity progress bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
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

      {/* Map Legend Overlay in bottom-left */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-[11px] space-y-1.5 shadow-xl max-w-xs pointer-events-auto hidden sm:block">
        <div className="font-bold text-slate-200 uppercase tracking-wider text-[10px] flex items-center justify-between">
          <span>Map HUD Legend</span>
          <span className="text-cyan-400 font-mono">LIVE GIS</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            <span>Shelter Bunker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
            <span>Evacuation Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400"></span>
            <span>Optimal Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 border-b border-dashed border-rose-300"></span>
            <span>Severed Road</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-yellow-400"></span>
            <span>Min-Cut Bottleneck</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></span>
            <span>Hazard Perimeter</span>
          </div>
        </div>
      </div>
    </div>
  );
}
