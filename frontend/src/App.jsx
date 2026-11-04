import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Shield, AlertCircle } from 'lucide-react';
import Header from './components/Header';
import MapView from './components/MapView';
import DisasterControls from './components/DisasterControls';
import AlgorithmPanel from './components/AlgorithmPanel';
import ShelterStatusHud from './components/ShelterStatusHud';
import ComparisonModal from './components/ComparisonModal';
import ProfessorDemoSuite from './components/ProfessorDemoSuite';
import LogicInspector from './components/LogicInspector';
import { apiService } from './services/api';

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [currentScenarioId, setCurrentScenarioId] = useState('greater_chennai');
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

  // Interactive Map Tool State
  const [activeTool, setActiveTool] = useState('inspect'); // 'inspect' | 'cut_road' | 'add_zone' | 'add_shelter' | 'drop_hazard'
  const [newDisasterType, setNewDisasterType] = useState('flood');

  // Modals
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isDemoSuiteOpen, setIsDemoSuiteOpen] = useState(false);

  // Load scenarios on mount
  useEffect(() => {
    async function init() {
      try {
        const data = await apiService.getScenarios();
        if (data.scenarios && data.scenarios.length > 0) {
          setScenarios(data.scenarios);
          // Prefer greater_chennai if available
          const hasGreater = data.scenarios.find(s => s.id === 'greater_chennai');
          const defaultId = hasGreater ? 'greater_chennai' : data.scenarios[0].id;
          loadScenario(defaultId);
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
          // Re-execute current algorithm on the fly!
          executeRoutingAlgorithm(currentScenarioId, selectedAlgorithm, selectedSourceId, selectedShelterId);
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

  // Interactive Map Click Handler (Add Zone, Add Shelter, Add Hazard)
  const handleMapClick = async (latlng, tool) => {
    if (tool === 'drop_hazard') {
      const newEpicenter = {
        id: `DIS_${Date.now()}`,
        type: newDisasterType,
        name: `${newDisasterType.toUpperCase()} Ground Zero`,
        lat: latlng.lat,
        lng: latlng.lng,
        radius_km: 1.2,
        severity: 0.85,
        description: `Hazard outbreak triggered at [${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}]`
      };
      const currentDisasters = graph?.disasters || [];
      const updated = [newEpicenter, ...currentDisasters];
      await handleUpdateDisasters(updated);
      setActiveTool('inspect');
    } else if (tool === 'add_zone') {
      const nodeData = {
        id: `Z_CUSTOM_${Date.now().toString().slice(-4)}`,
        name: `Sector Node ${Date.now().toString().slice(-3)}`,
        lat: latlng.lat,
        lng: latlng.lng,
        type: 'zone',
        population: 4500,
        description: 'New residential sector deployed via Interactive Tools'
      };
      const res = await apiService.addNode(currentScenarioId, nodeData);
      if (res.graph) {
        setGraph(res.graph);
        setSelectedSourceId(nodeData.id);
      }
      setActiveTool('inspect');
    } else if (tool === 'add_shelter') {
      const nodeData = {
        id: `S_CUSTOM_${Date.now().toString().slice(-4)}`,
        name: `High-Plateau Refuge ${Date.now().toString().slice(-3)}`,
        lat: latlng.lat,
        lng: latlng.lng,
        type: 'shelter',
        capacity: 8000,
        description: 'Emergency bunker shelter deployed via Interactive Tools'
      };
      const res = await apiService.addNode(currentScenarioId, nodeData);
      if (res.graph) {
        setGraph(res.graph);
      }
      setActiveTool('inspect');
    }
  };

  // Reusable Algorithm Execution
  const executeRoutingAlgorithm = async (scenarioId, algorithm, sourceId, shelterId) => {
    if (!graph) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let res = null;
      if (algorithm === 'dijkstra') {
        res = await apiService.runDijkstra(scenarioId, sourceId, shelterId);
      } else if (algorithm === 'astar') {
        res = await apiService.runAStar(scenarioId, sourceId, shelterId);
      } else if (algorithm === 'bfs') {
        res = await apiService.runBFS(scenarioId, sourceId);
      } else if (algorithm === 'max-flow') {
        res = await apiService.runMaxFlow(scenarioId);
        if (res.updated_graph) {
          setGraph(res.updated_graph);
        }
      } else if (algorithm === 'greedy') {
        res = await apiService.runGreedy(scenarioId);
      }

      if (res) {
        setAlgorithmResult(res);
        setCurrentStepIndex(0);
        setIsPlaying(true);

        if (res.paths && res.paths.length > 0) {
          confetti({
            particleCount: 50,
            spread: 60,
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

  const handleExecuteAlgorithm = () => {
    executeRoutingAlgorithm(currentScenarioId, selectedAlgorithm, selectedSourceId, selectedShelterId);
  };

  // Run a Professor Demo Case
  const handleRunDemoCase = async (demoCase) => {
    setIsLoading(true);
    await loadScenario(demoCase.scenarioId);
    setSelectedAlgorithm(demoCase.algorithm);
    setSelectedSourceId(demoCase.sourceId);
    setTimeout(() => {
      executeRoutingAlgorithm(demoCase.scenarioId, demoCase.algorithm, demoCase.sourceId, null);
    }, 400);
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
        onOpenDemoSuite={() => setIsDemoSuiteOpen(true)}
        isLoading={isLoading}
        threatLevel={severedEdgesCount > 4 ? 'CRITICAL' : (severedEdgesCount > 0 ? 'ELEVATED' : 'LOW')}
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
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            activeStep={currentStep}
          />
        </div>

        {/* Floating Left Panel (Hazard Parameters & Shelter HUD) */}
        <div className="relative z-10 w-[350px] max-w-[90vw] p-4 flex flex-col gap-3.5 pointer-events-none overflow-y-auto max-h-[calc(100vh-65px)]">
          <div className="pointer-events-auto space-y-3.5">
            <DisasterControls
              disasters={graph?.disasters || []}
              onUpdateDisasters={handleUpdateDisasters}
              isPlacingDisaster={activeTool === 'drop_hazard'}
              setIsPlacingDisaster={(val) => setActiveTool(val ? 'drop_hazard' : 'inspect')}
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

        {/* Floating Right Panel (Routing & Dispatch Engine + Logic Inspector) */}
        <div className="relative z-10 w-[440px] max-w-[90vw] p-4 flex flex-col gap-3 pointer-events-none overflow-y-auto max-h-[calc(100vh-65px)]">
          <div className="pointer-events-auto space-y-3">
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

            {/* DAA Memory & Data Structure Inspector */}
            <LogicInspector
              currentStep={currentStep}
              algorithmResult={algorithmResult}
              selectedAlgorithm={selectedAlgorithm}
            />
          </div>
        </div>
      </div>

      {/* Professor Demo Suite Modal */}
      <ProfessorDemoSuite
        isOpen={isDemoSuiteOpen}
        onClose={() => setIsDemoSuiteOpen(false)}
        onRunDemoCase={handleRunDemoCase}
      />

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
