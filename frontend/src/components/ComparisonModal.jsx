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

  const executionTimeData = tableData.map(row => ({
    name: row.algorithm.replace("'s Algorithm", "").replace(" (Max-Flow)", ""),
    time_ms: row.execution_time_ms,
    nodes: row.nodes_explored
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Routing Engine Diagnostics & Benchmark
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-sky-300 border border-white/10">
                  Telemetry Comparison
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Performance benchmarking across active routing engines on identical incident topology
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/10 bg-black/20">
          {[
            { id: 'table', label: 'Engine Benchmark Matrix', icon: Layers },
            { id: 'charts', label: 'Latency & Capability Profiles', icon: TrendingUp },
            { id: 'bottlenecks', label: 'Critical Capacity Bottlenecks', icon: AlertCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-[1px] ${
                  isActive
                    ? 'border-sky-400 text-sky-400 bg-sky-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
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
            <div className="py-20 flex flex-col items-center justify-center text-zinc-400 space-y-3">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-mono text-xs">Running empirical benchmark suite across network graph...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: Benchmark Matrix */}
              {activeTab === 'table' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black/40 text-zinc-300 font-medium text-[11px] border-b border-white/10">
                          <th className="py-3 px-4">Engine Mode</th>
                          <th className="py-3 px-4">Core Strategy</th>
                          <th className="py-3 px-4">Response Latency</th>
                          <th className="py-3 px-4">Nodes Evaluated</th>
                          <th className="py-3 px-4">Primary Metric</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {tableData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition">
                            <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                              {row.algorithm}
                            </td>
                            <td className="py-3 px-4 text-sky-400 font-mono text-[11px]">
                              {row.paradigm}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-sky-300">
                              {row.execution_time_ms} ms
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-300">
                              {row.nodes_explored}
                            </td>
                            <td className="py-3 px-4 font-semibold text-emerald-400 whitespace-nowrap">
                              {row.metric_value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Operational Capabilities */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {tableData.map((row, idx) => (
                      <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-3.5 space-y-1.5">
                        <div className="font-semibold text-zinc-200 text-xs flex items-center justify-between">
                          <span>{row.algorithm}</span>
                          <span className="font-mono text-[10px] text-sky-400">{row.paradigm}</span>
                        </div>
                        <div className="text-[11px] text-zinc-300">
                          <span className="text-emerald-400 font-medium">&bull; Strategic Advantage: </span>
                          {row.strengths}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          <span className="text-amber-400 font-medium">&bull; Operational Constraint: </span>
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
                  {/* Latency */}
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="font-semibold text-zinc-200 text-xs flex items-center justify-between">
                      <span>Dispatch Response Latency (Milliseconds)</span>
                      <span className="text-sky-400 font-mono text-[10px]">Empirical Execution Time</span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={executionTimeData}>
                          <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#71717a" tick={{ fontSize: 10 }} unit="ms" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#090a0f', borderColor: '#27272a', borderRadius: 8, fontSize: 12 }}
                          />
                          <Bar dataKey="time_ms" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Latency (ms)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Multi-Dimensional Capabilities */}
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="font-semibold text-zinc-200 text-xs flex items-center justify-between">
                      <span>Engine Capability Matrix</span>
                      <span className="text-sky-400 font-mono text-[10px]">Normalized 0-100</span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={[
                          { metric: 'Path Optimality', Dijkstra: 100, AStar: 100, BFS: 70, MaxFlow: 90, Greedy: 75 },
                          { metric: 'Search Pruning', Dijkstra: 40, AStar: 95, BFS: 30, MaxFlow: 20, Greedy: 85 },
                          { metric: 'Capacity Aware', Dijkstra: 0, AStar: 0, BFS: 0, MaxFlow: 100, Greedy: 80 },
                          { metric: 'Hazard Adapt', Dijkstra: 85, AStar: 90, BFS: 60, MaxFlow: 95, Greedy: 90 },
                          { metric: 'Dispatch Speed', Dijkstra: 80, AStar: 95, BFS: 90, MaxFlow: 50, Greedy: 95 },
                        ]}>
                          <PolarGrid stroke="#27272a" />
                          <PolarAngleAxis dataKey="metric" stroke="#a1a1aa" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis stroke="#3f3f46" angle={30} domain={[0, 100]} />
                          <Radar name="Precision Express (A*)" dataKey="AStar" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.3} />
                          <Radar name="Multi-Corridor (Max-Flow)" dataKey="MaxFlow" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                          <Radar name="Shortest Route (Dijkstra)" dataKey="Dijkstra" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Capacity Bottlenecks */}
              {activeTab === 'bottlenecks' && (
                <div className="space-y-4">
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="font-semibold text-zinc-200 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        Saturated Corridor Bottlenecks
                      </span>
                      <span className="font-mono text-[11px] text-zinc-400">
                        {bottleneckRoads.length} Choke Points Identified
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs">
                      Corridor bottlenecks identified by network flow min-cut analysis. These arterial segments are currently operating at 100% capacity and require municipal traffic intervention:
                    </p>

                    {bottleneckRoads.length === 0 ? (
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-zinc-400 text-center font-mono">
                        No corridors are currently saturated. Evacuation flow remains within network tolerances.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {bottleneckRoads.map((b, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                              <span>Corridor {b.edge_id}: {b.source} &rarr; {b.target}</span>
                              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                {b.utilized_flow} / {b.capacity} p/hr (100% Saturated)
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-300">
                              <span className="text-sky-400 font-medium">Recommended Action: </span>
                              {b.recommendation}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-2">
                      <div className="font-semibold text-zinc-200 text-xs flex items-center gap-2 text-sky-400">
                        <Lightbulb className="w-4 h-4" />
                        Automated Operational Insights
                      </div>
                      <div className="space-y-1.5">
                        {recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-zinc-300 text-xs">
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
        <div className="px-6 py-3.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs">
          <div className="text-zinc-500 font-medium">
            DisasterShield™ Municipal Command Telemetry System
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
