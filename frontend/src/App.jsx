import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Shield, AlertCircle, Info, Activity } from 'lucide-react';
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

  // Algorithmic State
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dijkstra');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [selectedShelterId, setSelectedShelterId] = useState('');
  const [algorithmResult, setAlgorithmResult] = useState(null);

  // Step-by-Step Traversal Visualizer State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(400);

  // Disaster Management State
  const [isPlacingDisaster, setIsPlacingDisaster] = useState(false);
  const [newDisasterType, setNewDisasterType] = useState('flood');

  // Comparison Benchmark Modal State
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
        setErrorMsg('Failed to connect to DisasterShield Backend API.');
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

      // Default source to first population zone
      const firstZone = (data.nodes || []).find(n => n.type === 'zone');
      if (firstZone) {
        setSelectedSourceId(firstZone.id);
      }
    } catch (err) {
      console.error('Error fetching scenario:', err);
      setErrorMsg('Error loading scenario network data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset scenario to default state
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

  // Toggle road block / passable
  const handleToggleRoad = async (edgeId) => {
    try {
      const res = await apiService.toggleRoad(currentScenarioId, edgeId);
      if (res.graph) {
        setGraph(res.graph);
        // Clear active path if road toggled to prevent outdated routes
        if (algorithmResult) {
          setAlgorithmResult(null);
        }
      }
    } catch (err) {
      console.error('Failed to toggle road:', err);
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
      console.error('Failed to simulate disasters:', err);
    }
  };

  // Handle map click to place new epicenter
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
      description: `Emergency outbreak triggered at coordinates [${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}]`
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

        // Confetti celebration for successful evacuation route
        if (res.paths && res.paths.length > 0) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.85 }
          });
        }
      }
    } catch (err) {
      console.error('Error executing algorithm:', err);
      setErrorMsg('Algorithm execution error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open & run comparative benchmark
  const handleOpenCompare = async () => {
    setIsCompareOpen(true);
    setIsComparing(true);
    try {
      const data = await apiService.compareAll(currentScenarioId, selectedSourceId);
      setComparisonData(data);
    } catch (err) {
      console.error('Failed to run comparison:', err);
    } finally {
      setIsComparing(false);
    }
  };

  // Traversal Step inspection data
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Tactical Command Header */}
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
        <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Command Center Workspace */}
      <main className="flex-1 p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 max-w-[1700px] w-full mx-auto">
        {/* Left Side: Hazard Dynamics + Shelter HUD (3 Cols on Desktop) */}
        <div className="lg:col-span-3 space-y-3 flex flex-col">
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

        {/* Center: Dynamic Map View (5 Cols on Desktop) */}
        <div className="lg:col-span-5 h-[480px] lg:h-auto min-h-[460px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
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

        {/* Right Side: Algorithm Controls & Traversal Inspector (4 Cols on Desktop) */}
        <div className="lg:col-span-4 flex flex-col">
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
      </main>

      {/* Comparative Benchmark Modal */}
      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        comparisonData={comparisonData}
        isLoading={isComparing}
      />
    </div>
  );
}
