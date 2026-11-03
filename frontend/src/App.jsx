import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Shield, AlertCircle } from 'lucide-react';
import Header from './components/Header';
import MapView from './components/MapView';
import DisasterControls from './components/DisasterControls';
import AlgorithmPanel from './components/AlgorithmPanel';
import ShelterStatusHud from './components/ShelterStatusHud';
import ComparisonModal from './components/ComparisonModal';
import { apiService } from './services/api';

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [currentScenarioId, setCurrentScenarioId] = useState('metro_city');
  const [graph, setGraph] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Operational State
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dijkstra');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [selectedShelterId, setSelectedShelterId] = useState('');
  const [algorithmResult, setAlgorithmResult] = useState(null);

  // Traversal Scrubber State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(400);

  // Disaster Management State
  const [isPlacingDisaster, setIsPlacingDisaster] = useState(false);
  const [newDisasterType, setNewDisasterType] = useState('flood');

  // Diagnostics Modal State
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  // Load scenarios on mount
  useEffect(() => {
    async function init() {
      try {
        const data = await apiService.getScenarios();
        if (data.scenarios && data.scenarios.length > 0) {
          setScenarios(data.scenarios);
          loadScenario(data.scenarios[0].id);
        }
      } catch (err) {
        console.error('Failed to load scenarios:', err);
        setErrorMsg('Failed to connect to DisasterShield Backend Telemetry Service.');
      }
    }
    init();
  }, []);

  // Load specific scenario
  const loadScenario = useCallback(async (scenarioId, reload = false) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiService.getScenario(scenarioId, reload);
      setGraph(data);
      setCurrentScenarioId(scenarioId);
      setAlgorithmResult(null);
      setCurrentStepIndex(0);
      setIsPlaying(false);

      const firstZone = (data.nodes || []).find(n => n.type === 'zone');
      if (firstZone) {
        setSelectedSourceId(firstZone.id);
      }
    } catch (err) {
      console.error('Error fetching scenario:', err);
      setErrorMsg('Error loading sector network data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset scenario
  const handleResetScenario = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.resetScenario(currentScenarioId);
      setGraph(data);
      setAlgorithmResult(null);
      setCurrentStepIndex(0);
      setIsPlaying(false);
    } catch (err) {
      console.error('Error resetting scenario:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle road block
  const handleToggleRoad = async (edgeId) => {
    try {
      const res = await apiService.toggleRoad(currentScenarioId, edgeId);
      if (res.graph) {
        setGraph(res.graph);
        if (algorithmResult) {
          setAlgorithmResult(null);
        }
      }
    } catch (err) {
      console.error('Failed to toggle corridor:', err);
    }
  };

  // Update disaster parameters
  const handleUpdateDisasters = async (updatedDisasters) => {
    try {
      const res = await apiService.simulateDisasters(currentScenarioId, updatedDisasters);
      if (res.graph) {
        setGraph(res.graph);
      }
    } catch (err) {
      console.error('Failed to simulate hazard:', err);
    }
  };

  // Map click for new epicenter
  const handleMapClick = async (latlng) => {
    if (!isPlacingDisaster) return;

    const newEpicenter = {
      id: `DIS_${Date.now()}`,
      type: newDisasterType,
      name: `${newDisasterType.toUpperCase()} Ground Zero`,
      lat: latlng.lat,
      lng: latlng.lng,
      radius_km: 1.0,
      severity: 0.85,
      description: `Hazard epicenter detected at [${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}]`
    };

    const currentDisasters = graph?.disasters || [];
    const updated = [newEpicenter, ...currentDisasters];
    await handleUpdateDisasters(updated);
    setIsPlacingDisaster(false);
  };

  // Execute selected algorithm
  const handleExecuteAlgorithm = async () => {
    if (!graph) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let res = null;
      if (selectedAlgorithm === 'dijkstra') {
        res = await apiService.runDijkstra(currentScenarioId, selectedSourceId, selectedShelterId);
      } else if (selectedAlgorithm === 'astar') {
        res = await apiService.runAStar(currentScenarioId, selectedSourceId, selectedShelterId);
      } else if (selectedAlgorithm === 'bfs') {
        res = await apiService.runBFS(currentScenarioId, selectedSourceId);
      } else if (selectedAlgorithm === 'max-flow') {
        res = await apiService.runMaxFlow(currentScenarioId);
        if (res.updated_graph) {
          setGraph(res.updated_graph);
        }
      } else if (selectedAlgorithm === 'greedy') {
        res = await apiService.runGreedy(currentScenarioId);
      }

      if (res) {
        setAlgorithmResult(res);
        setCurrentStepIndex(0);
        setIsPlaying(true);

        if (res.paths && res.paths.length > 0) {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.85 }
          });
        }
      }
    } catch (err) {
      console.error('Error executing routing engine:', err);
      setErrorMsg('Routing computation error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open diagnostics
  const handleOpenCompare = async () => {
    setIsCompareOpen(true);
    setIsComparing(true);
    try {
      const data = await apiService.compareAll(currentScenarioId, selectedSourceId);
      setComparisonData(data);
    } catch (err) {
      console.error('Failed to run diagnostics:', err);
    } finally {
      setIsComparing(false);
    }
  };

  const currentStep = useMemo(() => {
    const steps = algorithmResult?.steps || [];
    return steps[currentStepIndex] || null;
  }, [algorithmResult, currentStepIndex]);

  const activePaths = useMemo(() => {
    return algorithmResult?.paths || [];
  }, [algorithmResult]);

  const highlightedEdges = useMemo(() => {
    if (currentStep?.edge_id) {
      return [currentStep.edge_id];
    }
    return [];
  }, [currentStep]);

  const visitedNodes = useMemo(() => {
    return currentStep?.visited_nodes || [];
  }, [currentStep]);

  const frontierNodes = useMemo(() => {
    return currentStep?.frontier_nodes || currentStep?.open_set || currentStep?.queue || [];
  }, [currentStep]);

  const severedEdgesCount = useMemo(() => {
    return (graph?.edges || []).filter(e => e.status !== 'open').length;
  }, [graph]);

  return (
    <div className="h-screen w-screen bg-[#08090d] text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Operations Header */}
      <Header
        scenarios={scenarios}
        currentScenarioId={currentScenarioId}
        onSelectScenario={(id) => loadScenario(id)}
        onResetScenario={handleResetScenario}
        onOpenCompare={handleOpenCompare}
        isLoading={isLoading}
        threatLevel={severedEdgesCount > 2 ? 'CRITICAL' : (severedEdgesCount > 0 ? 'ELEVATED' : 'LOW')}
      />

      {/* Error alert banner */}
      {errorMsg && (
        <div className="bg-rose-950/90 border-b border-rose-500/30 px-5 py-2 text-rose-300 text-xs flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Operations Canvas (Full View GIS with Sleek Side Panels) */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Full View GIS Map Centerpiece */}
        <div className="absolute inset-0 z-0">
          <MapView
            graph={graph}
            activePaths={activePaths}
            highlightedEdges={highlightedEdges}
            visitedNodes={visitedNodes}
            frontierNodes={frontierNodes}
            selectedSourceId={selectedSourceId}
            onSelectSource={(id) => setSelectedSourceId(id)}
            onToggleRoad={handleToggleRoad}
            onMapClick={handleMapClick}
            isPlacingDisaster={isPlacingDisaster}
            activeStep={currentStep}
          />
        </div>

        {/* Floating Left Panel (Hazard Parameters & Shelter HUD) */}
        <div className="relative z-10 w-[350px] max-w-[90vw] p-4 flex flex-col gap-3.5 pointer-events-none overflow-y-auto max-h-[calc(100vh-65px)]">
          <div className="pointer-events-auto space-y-3.5">
            <DisasterControls
              disasters={graph?.disasters || []}
              onUpdateDisasters={handleUpdateDisasters}
              isPlacingDisaster={isPlacingDisaster}
              setIsPlacingDisaster={setIsPlacingDisaster}
              newDisasterType={newDisasterType}
              setNewDisasterType={setNewDisasterType}
              severedEdgesCount={severedEdgesCount}
            />

            <ShelterStatusHud
              graph={graph}
              algorithmResult={algorithmResult}
            />
          </div>
        </div>

        {/* Spacer for interactive map */}
        <div className="flex-1 pointer-events-none"></div>

        {/* Floating Right Panel (Routing & Dispatch Engine) */}
        <div className="relative z-10 w-[420px] max-w-[90vw] p-4 flex flex-col pointer-events-none overflow-y-auto max-h-[calc(100vh-65px)]">
          <div className="pointer-events-auto">
            <AlgorithmPanel
              graph={graph}
              selectedAlgorithm={selectedAlgorithm}
              setSelectedAlgorithm={setSelectedAlgorithm}
              selectedSourceId={selectedSourceId}
              setSelectedSourceId={setSelectedSourceId}
              selectedShelterId={selectedShelterId}
              setSelectedShelterId={setSelectedShelterId}
              onExecuteAlgorithm={handleExecuteAlgorithm}
              algorithmResult={algorithmResult}
              isLoading={isLoading}
              currentStepIndex={currentStepIndex}
              setCurrentStepIndex={setCurrentStepIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
            />
          </div>
        </div>
      </div>

      {/* Diagnostics & Benchmark Modal */}
      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        comparisonData={comparisonData}
        isLoading={isComparing}
      />
    </div>
  );
}
