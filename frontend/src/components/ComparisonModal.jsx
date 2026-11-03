import React, { useState } from 'react';
import {
  X,
  BarChart3,
  TrendingUp,
  Cpu,
  Layers,
  Award,
  AlertCircle,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

export default function ComparisonModal({ isOpen, onClose, comparisonData, isLoading }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'charts' | 'bottlenecks'

  const tableData = comparisonData?.comparison_table || [];
  const chartData = comparisonData?.chart_data || [];
  const recommendations = comparisonData?.recommendations || [];
  const rawResults = comparisonData?.raw_results || {};
  const bottleneckRoads = rawResults.max_flow?.bottleneck_roads || [];

  // Prepare chart formatted data
  const executionTimeData = tableData.map(row => ({
    name: row.algorithm.replace("'s Algorithm", "").replace(" (Max-Flow)", ""),
    time_ms: row.execution_time_ms,
    nodes: row.nodes_explored
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                DAA Algorithmic Evaluation & Empirical Benchmark
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Identical Graph State
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Comparative analysis of Dijkstra, A*, BFS, Edmonds-Karp, and Greedy Prioritization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/50">
          {[
            { id: 'table', label: 'Complexity & Metrics Table', icon: Layers },
            { id: 'charts', label: 'Performance Charts', icon: TrendingUp },
            { id: 'bottlenecks', label: 'Min-Cut Bottlenecks', icon: AlertCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-[1px] ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-mono text-xs">Executing Benchmarks across all 5 DAA algorithms...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: Comparison Table */}
              {activeTab === 'table' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-300 font-mono text-[11px] border-b border-slate-800">
                          <th className="py-3 px-3">Algorithm</th>
                          <th className="py-3 px-3">DAA Paradigm</th>
                          <th className="py-3 px-3">Time Complexity</th>
                          <th className="py-3 px-3">Space Complexity</th>
                          <th className="py-3 px-3">Runtime</th>
                          <th className="py-3 px-3">Explored</th>
                          <th className="py-3 px-3">Primary Outcome</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {tableData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                              {row.algorithm}
                            </td>
                            <td className="py-3 px-3 text-cyan-300 font-mono text-[11px]">
                              {row.paradigm}
                            </td>
                            <td className="py-3 px-3 font-mono text-amber-300">
                              {row.time_complexity}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-400">
                              {row.space_complexity}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                              {row.execution_time_ms} ms
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300">
                              {row.nodes_explored}
                            </td>
                            <td className="py-3 px-3 font-semibold text-emerald-400 whitespace-nowrap">
                              {row.metric_value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Algorithmic Strengths and Limitations Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {tableData.map((row, idx) => (
                      <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1.5">
                        <div className="font-bold text-slate-200 text-xs flex items-center justify-between">
                          <span>{row.algorithm}</span>
                          <span className="font-mono text-[10px] text-cyan-400">{row.paradigm}</span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <span className="text-emerald-400 font-semibold">&bull; Strength: </span>
                          {row.strengths}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          <span className="text-amber-400 font-semibold">&bull; Trade-off: </span>
                          {row.limitations}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: Performance Charts */}
              {activeTab === 'charts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Execution Time Bar Chart */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="font-bold text-slate-200 text-xs flex items-center justify-between">
                      <span>Execution Latency (Milliseconds)</span>
                      <span className="text-cyan-400 font-mono text-[10px]">Lower is Faster</span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={executionTimeData}>
                          <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="ms" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                          />
                          <Bar dataKey="time_ms" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Runtime (ms)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Multi-Dimensional Capabilities Radar Chart */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="font-bold text-slate-200 text-xs flex items-center justify-between">
                      <span>DAA Algorithmic Profile Radar</span>
                      <span className="text-cyan-400 font-mono text-[10px]">Normalized 0-100</span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={[
                          { metric: 'Path Optimality', Dijkstra: 100, AStar: 100, BFS: 70, MaxFlow: 90, Greedy: 75 },
                          { metric: 'Search Pruning', Dijkstra: 40, AStar: 95, BFS: 30, MaxFlow: 20, Greedy: 85 },
                          { metric: 'Capacity Aware', Dijkstra: 0, AStar: 0, BFS: 0, MaxFlow: 100, Greedy: 80 },
                          { metric: 'Hazard Adapt', Dijkstra: 85, AStar: 90, BFS: 60, MaxFlow: 95, Greedy: 90 },
                          { metric: 'Execution Speed', Dijkstra: 80, AStar: 95, BFS: 90, MaxFlow: 50, Greedy: 95 },
                        ]}>
                          <PolarGrid stroke="#334155" />
                          <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} />
                          <Radar name="A* Search" dataKey="AStar" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                          <Radar name="Edmonds-Karp" dataKey="MaxFlow" stroke="#eab308" fill="#eab308" fillOpacity={0.2} />
                          <Radar name="Dijkstra" dataKey="Dijkstra" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Min-Cut Bottlenecks & Recommendations */}
              {activeTab === 'bottlenecks' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="font-bold text-slate-200 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        Max-Flow Min-Cut Saturated Bottleneck Roads
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {bottleneckRoads.length} Critical Choke Points
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">
                      According to the <strong>Max-Flow Min-Cut Theorem</strong>, the maximum flow of evacuees through the road network is bounded by the sum of capacities of edges in the minimum cut. These edges are operating at 100% capacity and represent the physical bottlenecks of the city:
                    </p>

                    {bottleneckRoads.length === 0 ? (
                      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-center font-mono">
                        No roads are currently 100% saturated. Network flow has not exceeded capacity.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {bottleneckRoads.map((b, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/40 space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                              <span>Road {b.edge_id}: {b.source} &rarr; {b.target}</span>
                              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                                {b.utilized_flow} / {b.capacity} evacuees/hr (100% SATURATED)
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-300">
                              <span className="text-cyan-400 font-semibold">Engineering Action: </span>
                              {b.recommendation}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5 text-cyan-400">
                        <Lightbulb className="w-4 h-4" />
                        System Analysis Insights
                      </div>
                      <div className="space-y-1.5">
                        {recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-slate-300 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <div className="text-slate-400 font-mono text-[11px]">
            Design and Analysis of Algorithms (DAA) Capstone Project
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
