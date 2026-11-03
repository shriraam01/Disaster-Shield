import copy
from typing import Dict, Any
from backend.models.graph import CityGraph
from backend.algorithms.dijkstra import run_dijkstra
from backend.algorithms.astar import run_astar
from backend.algorithms.bfs import run_bfs
from backend.algorithms.max_flow import run_edmonds_karp
from backend.algorithms.greedy import run_greedy_prioritization

def compare_all_algorithms(graph: CityGraph, source_zone_id: str = None) -> Dict[str, Any]:
    """
    Executes all 5 DAA algorithms on the exact same graph instance and disaster state,
    collecting execution timings, nodes explored, path qualities, and throughput.
    """
    # Choose default source zone if not provided
    zones = graph.get_evacuation_zones()
    if not source_zone_id or source_zone_id not in graph.nodes:
        source_zone_id = zones[0].id if zones else next(iter(graph.nodes.keys()))

    # Run Dijkstra
    g_dijkstra = copy.deepcopy(graph)
    dijkstra_res = run_dijkstra(g_dijkstra, source_id=source_zone_id)

    # Run A*
    g_astar = copy.deepcopy(graph)
    astar_res = run_astar(g_astar, source_id=source_zone_id)

    # Run BFS
    g_bfs = copy.deepcopy(graph)
    bfs_res = run_bfs(g_bfs, source_id=source_zone_id)

    # Run Edmonds-Karp (Max Flow)
    g_mf = copy.deepcopy(graph)
    max_flow_res = run_edmonds_karp(g_mf)

    # Run Greedy Prioritization
    g_greedy = copy.deepcopy(graph)
    greedy_res = run_greedy_prioritization(g_greedy)

    # Extract primary path distance for single-source algorithms
    dijkstra_path_dist = dijkstra_res["paths"][0]["distance_km"] if dijkstra_res.get("paths") else None
    astar_path_dist = astar_res["paths"][0]["distance_km"] if astar_res.get("paths") else None
    bfs_path_dist = bfs_res["paths"][0]["distance_km"] if bfs_res.get("paths") else None
    bfs_hops = bfs_res["paths"][0]["hops"] if bfs_res.get("paths") else None

    comparison_table = [
        {
            "algorithm": "Dijkstra's Algorithm",
            "paradigm": "Greedy / Single-Source Shortest Path",
            "time_complexity": "O((V + E) log V)",
            "space_complexity": "O(V)",
            "execution_time_ms": dijkstra_res["execution_time_ms"],
            "nodes_explored": dijkstra_res["nodes_explored"],
            "edges_evaluated": dijkstra_res["edges_evaluated"],
            "metric_value": f"{dijkstra_path_dist} km" if dijkstra_path_dist else "No path",
            "metric_label": "Shortest Road Distance",
            "strengths": "Mathematically optimal shortest distance; handles arbitrary positive edge weights.",
            "limitations": "Explores radially in all directions without heuristic focus; doesn't consider road capacity."
        },
        {
            "algorithm": "A* Search",
            "paradigm": "Heuristic Informed Search",
            "time_complexity": "O(E) best to O(b^d) worst",
            "space_complexity": "O(V)",
            "execution_time_ms": astar_res["execution_time_ms"],
            "nodes_explored": astar_res["nodes_explored"],
            "edges_evaluated": astar_res["edges_evaluated"],
            "metric_value": f"{astar_path_dist} km" if astar_path_dist else "No path",
            "metric_label": "Heuristic Shortest Distance",
            "strengths": "Fastest single-target pathfinder; goal-oriented heuristic prunes search space drastically.",
            "limitations": "Heuristic must be strictly admissible (h <= h*) to guarantee optimality."
        },
        {
            "algorithm": "Breadth-First Search (BFS)",
            "paradigm": "Level-Order Graph Traversal",
            "time_complexity": "O(V + E)",
            "space_complexity": "O(V)",
            "execution_time_ms": bfs_res["execution_time_ms"],
            "nodes_explored": bfs_res["nodes_explored"],
            "edges_evaluated": bfs_res["edges_evaluated"],
            "metric_value": f"{bfs_hops} hops ({bfs_path_dist} km)" if bfs_hops is not None else "No path",
            "metric_label": "Fewest Road Intersections",
            "strengths": "Minimizes road intersections/checkpoints; detects trapped/isolated population clusters.",
            "limitations": "Ignores real road lengths and hazard risk weights; sub-optimal on weighted graphs."
        },
        {
            "algorithm": "Edmonds-Karp (Max-Flow)",
            "paradigm": "Network Flow / Min-Cut Bottleneck",
            "time_complexity": "O(V * E^2)",
            "space_complexity": "O(V + E)",
            "execution_time_ms": max_flow_res["execution_time_ms"],
            "nodes_explored": max_flow_res.get("augmenting_paths_count", 0),
            "edges_evaluated": len(graph.edges),
            "metric_value": f"{max_flow_res['max_evacuation_flow_rate']} evacuees/hr",
            "metric_label": "Maximum Safe Flow Throughput",
            "strengths": "Prevents gridlock by spreading traffic; pinpoints bottleneck roads via Min-Cut Theorem.",
            "limitations": "Higher computational overhead O(V*E^2); requires accurate edge capacity bounds."
        },
        {
            "algorithm": "Greedy Prioritization",
            "paradigm": "Greedy Triage Approximation",
            "time_complexity": "O(Z log Z + Z * S)",
            "space_complexity": "O(V)",
            "execution_time_ms": greedy_res["execution_time_ms"],
            "nodes_explored": len(greedy_res.get("priority_ranked_zones", [])),
            "edges_evaluated": len(graph.get_shelters()),
            "metric_value": f"{greedy_res['total_evacuated']} evacuees ({greedy_res['evacuation_coverage_pct']}%)",
            "metric_label": "High-Risk Evacuee Allocation",
            "strengths": "Fastest triage assignment for endangered populations; sorts by hazard urgency.",
            "limitations": "Greedy choice can saturate nearby shelters, leaving distant survivors stranded."
        }
    ]

    # Compute comparative radar / bar chart metrics
    chart_data = [
        {
            "name": "Dijkstra",
            "speed_score": round(10.0 / (dijkstra_res["execution_time_ms"] + 0.1), 2),
            "nodes_explored": dijkstra_res["nodes_explored"],
            "path_optimality_pct": 100,
            "capacity_awareness": 0,
            "hazard_adaptability": 85
        },
        {
            "name": "A* Search",
            "speed_score": round(10.0 / (astar_res["execution_time_ms"] + 0.1), 2),
            "nodes_explored": astar_res["nodes_explored"],
            "path_optimality_pct": 100,
            "capacity_awareness": 0,
            "hazard_adaptability": 90
        },
        {
            "name": "BFS",
            "speed_score": round(10.0 / (bfs_res["execution_time_ms"] + 0.1), 2),
            "nodes_explored": bfs_res["nodes_explored"],
            "path_optimality_pct": 75,
            "capacity_awareness": 0,
            "hazard_adaptability": 60
        },
        {
            "name": "Edmonds-Karp",
            "speed_score": round(10.0 / (max_flow_res["execution_time_ms"] + 0.1), 2),
            "nodes_explored": max_flow_res.get("augmenting_paths_count", 1) * 3,
            "path_optimality_pct": 95,
            "capacity_awareness": 100,
            "hazard_adaptability": 95
        },
        {
            "name": "Greedy Prioritizer",
            "speed_score": round(10.0 / (greedy_res["execution_time_ms"] + 0.1), 2),
            "nodes_explored": len(zones),
            "path_optimality_pct": 70,
            "capacity_awareness": 85,
            "hazard_adaptability": 90
        }
    ]

    # Engineering recommendations based on algorithmic outcomes
    recommendations = []
    if astar_res["nodes_explored"] < dijkstra_res["nodes_explored"]:
        prune_pct = round((1 - astar_res["nodes_explored"] / (dijkstra_res["nodes_explored"] + 0.001)) * 100, 1)
        recommendations.append(f"A* Search reduced explored search space by {prune_pct}% compared to Dijkstra due to the directional Haversine heuristic.")

    if max_flow_res.get("bottleneck_roads"):
        bottlenecks = [b["edge_id"] for b in max_flow_res["bottleneck_roads"]]
        recommendations.append(f"Edmonds-Karp Min-Cut identified critical bottleneck roads: {', '.join(bottlenecks)}. Expanding these will directly raise network evacuation throughput.")

    if bfs_res.get("trapped_population", 0) > 0:
        recommendations.append(f"BFS Reachability flagged {bfs_res['trapped_population']} people isolated by hazard blockages requiring immediate air/boat rescue.")

    return {
        "scenario_name": graph.name,
        "source_zone_id": source_zone_id,
        "source_zone_name": graph.nodes[source_zone_id].name if source_zone_id in graph.nodes else "N/A",
        "comparison_table": comparison_table,
        "chart_data": chart_data,
        "recommendations": recommendations,
        "raw_results": {
            "dijkstra": dijkstra_res,
            "astar": astar_res,
            "bfs": bfs_res,
            "max_flow": max_flow_res,
            "greedy": greedy_res
        }
    }
