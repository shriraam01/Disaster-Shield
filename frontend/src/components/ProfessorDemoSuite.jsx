import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Compass
} from 'lucide-react';

export default function ProfessorDemoSuite({
  isOpen,
  onClose,
  onRunDemoCase
}) {
  if (!isOpen) return null;

  const [activeDemo, setActiveDemo] = useState(1);

  const demoCases = [
    {
      id: 1,
      title: 'Demo 1: The Single-Path Gridlock vs Multi-Corridor Flow',
      subtitle: 'Dijkstra vs Edmonds-Karp Maximum Flow (Min-Cut Theorem)',
      icon: GitBranch,
      problem: 'When 8,500 evacuees from T. Nagar all take the single shortest road (Dijkstra), the 2,400 cap bridge instantly gridlocks, leaving 6,100 people trapped in traffic.',
      solution: 'Edmonds-Karp constructs a residual network with augmenting paths via BFS, distributing flow across 3 parallel corridors simultaneously to evacuate everyone safely.',
      script: '"Professor, Dijkstra only finds a single shortest path. But in a mass disaster, roads have capacities. Edmonds-Karp solves this by formulating the evacuation as a max-flow problem, ensuring zero road congestion."',
      daaLogic: 'Ford-Fulkerson with BFS (Edmonds-Karp, O(V·E²)). Computes S-T Min-Cut bottleneck edges to prove maximum achievable citywide throughput.',
      actionLabel: 'Launch Demo 1 (Dijkstra vs Max-Flow)',
      scenarioId: 'greater_chennai',
      algorithm: 'max-flow',
      sourceId: 'Z_TNAGAR'
    },
    {
      id: 2,
      title: 'Demo 2: The Cut-Off Island & Trapped Population Detection',
      subtitle: 'Breadth-First Search (BFS) Reachability Analysis',
      icon: AlertTriangle,
      problem: 'Floods or earthquake fault lines sever arterial bridges leading into George Town / Royapuram coastal sector.',
      solution: 'BFS performs level-order traversal from source. When the queue terminates without reaching any shelter, it automatically flags isolated topological components.',
      script: '"Professor, BFS ignores road kilometers and evaluates unweighted connectivity. It immediately alerts emergency commanders that 4,800 people have zero safe road corridors and need aerial airlifts."',
      daaLogic: 'O(V + E) level-order BFS queue traversal. Identifies disconnected subgraphs and trapped population pockets cut off by hazard obstacles.',
      actionLabel: 'Launch Demo 2 (BFS Reachability Check)',
      scenarioId: 'greater_chennai',
      algorithm: 'bfs',
      sourceId: 'Z_GEORGE'
    },
    {
      id: 3,
      title: 'Demo 3: Directed Heuristic Pruning (A* vs Dijkstra)',
      subtitle: 'A* Search with Consistent Haversine Heuristic',
      icon: Compass,
      problem: 'Dijkstra expands radially in all 360-degree directions (including away from shelters), checking unnecessary roads.',
      solution: 'A* uses an admissible Haversine straight-line distance heuristic h(n) <= d*(n, goal) to guide exploration directly toward the target shelter, cutting evaluated nodes by over 50%.',
      script: '"Professor, notice how A* uses f(n) = g(n) + h(n). The straight-line Haversine heuristic is admissible (it never overestimates road distance), guaranteeing the optimal shortest path in half the runtime."',
      daaLogic: 'Best-first heuristic search. Proves triangle inequality consistency: h(u) <= c(u, v) + h(v), ensuring optimal edge relaxation.',
      actionLabel: 'Launch Demo 3 (A* Guided Search)',
      scenarioId: 'greater_chennai',
      algorithm: 'astar',
      sourceId: 'Z_ANNANAGAR'
    },
    {
      id: 4,
      title: 'Demo 4: Emergency Triage Priority (Greedy Allocation)',
      subtitle: 'Greedy Urgency Ranking vs Global Optimal',
      icon: Zap,
      problem: 'Multiple neighborhoods are threatened at once. Standard routing doesn’t prioritize which neighborhood is closest to the fire.',
      solution: 'Greedy ranks sectors by composite risk (Population × Hazard Proximity / Shelter Distance) and greedily allocates the highest-urgency survivors first.',
      script: '"Professor, in emergency triage, speed is paramount. Our greedy algorithm runs in O(Z log Z) time, sorting by composite hazard urgency to allocate ambulances to the most critical sector first."',
      daaLogic: 'Greedy choice property: iteratively satisfies local maximum urgency. Fast O(Z log Z + Z·S), contrasting with global Max-Flow optimization.',
      actionLabel: 'Launch Demo 4 (Greedy Urgency Triage)',
      scenarioId: 'greater_chennai',
      algorithm: 'greedy',
      sourceId: 'Z_ROYAPURAM'
    }
  ];

  const current = demoCases.find(d => d.id === activeDemo) || demoCases[0];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel border border-sky-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-sky-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500 text-slate-950 font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Professor Presentation & Live Demo Suite
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40">
                  Interactive DAA Defense
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                1-click demonstration scenarios to explain your algorithmic logic and impress your professor
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-3 border-b border-white/10 bg-black/40">
          {demoCases.map(d => {
            const isSelected = activeDemo === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setActiveDemo(d.id)}
                className={`p-2.5 rounded-xl text-left transition border ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-500 text-white shadow'
                    : 'bg-white/5 border-transparent text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="text-[11px] font-bold text-sky-400">DEMO {d.id}</div>
                <div className="text-xs font-semibold truncate text-zinc-200 mt-0.5">{d.title.split(':')[1] || d.title}</div>
              </button>
            );
          })}
        </div>

        {/* Demo Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Title Banner */}
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 mt-0.5">
              <Icon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-white">{current.title}</div>
              <div className="text-xs text-sky-300 font-mono">{current.subtitle}</div>
            </div>
          </div>

          {/* Problem vs Solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-1.5">
              <div className="font-semibold text-rose-400 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                The Real-World Crisis Dilemma
              </div>
              <p className="text-zinc-300 text-xs leading-relaxed">{current.problem}</p>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
              <div className="font-semibold text-emerald-400 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                How Your Algorithm Solves It
              </div>
              <p className="text-zinc-300 text-xs leading-relaxed">{current.solution}</p>
            </div>
          </div>

          {/* What to Tell Your Professor */}
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 space-y-1.5">
            <div className="font-bold text-amber-300 text-xs uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              What to Tell Your Professor (Your Exact Script)
            </div>
            <p className="text-zinc-100 text-xs italic font-medium leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5">
              {current.script}
            </p>
          </div>

          {/* DAA Backend Logic */}
          <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 space-y-1">
            <div className="font-semibold text-zinc-300 text-xs">
              🧠 Underlying DAA Mathematical Concept:
            </div>
            <div className="text-xs font-mono text-sky-400">
              {current.daaLogic}
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Button */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="text-zinc-400 text-xs">
            Clicking will configure the map and execute this exact test live.
          </div>

          <button
            onClick={() => {
              onRunDemoCase(current);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{current.actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
