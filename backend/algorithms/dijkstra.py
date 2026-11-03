import heapq
import time
from typing import Dict, List, Optional, Any, Set
from backend.models.graph import CityGraph

def run_dijkstra(
    graph: CityGraph,
    source_id: Optional[str] = None,
    target_shelter_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes Dijkstra's Shortest Path Algorithm on CityGraph.
    Can find:
      - Shortest path from a specific source zone to the nearest reachable shelter
      - Or shortest paths from all evacuation zones to their nearest reachable shelters
    
    DAA Concepts:
      - Greedy choice property: Always extracts vertex with minimum tentative distance from min-heap.
      - Edge relaxation: If dist[u] + w(u, v) < dist[v], update dist[v] and predecessor.
      - Complexity: O((V + E) log V) time using min-heap, O(V) space.
    """
    start_time = time.perf_counter()

    shelters = graph.get_shelters()
    shelter_ids = {s.id for s in shelters}
    if target_shelter_id:
        shelter_ids = {target_shelter_id}

    sources = [source_id] if source_id else [z.id for z in graph.get_evacuation_zones()]
    if not sources and graph.nodes:
        sources = [next(iter(graph.nodes.keys()))]

    # Global tracking across execution
    total_nodes_explored = 0
    total_edges_evaluated = 0
    all_paths = []
    step_trace = []
    step_counter = 0

    # Execute Dijkstra for each requested source zone
    for src in sources:
        if src not in graph.nodes:
            continue

        # Distances and predecessors
        dist: Dict[str, float] = {node_id: float('inf') for node_id in graph.nodes}
        prev: Dict[str, Optional[str]] = {node_id: None for node_id in graph.nodes}
        edge_used: Dict[str, Optional[str]] = {node_id: None for node_id in graph.nodes}
        visited: Set[str] = set()

        dist[src] = 0.0
        # Priority Queue stores: (distance, node_id)
        pq: List[tuple[float, str]] = [(0.0, src)]

        step_trace.append({
            "step": step_counter,
            "type": "init",
            "current_node": src,
            "description": f"Initialized Dijkstra from source '{graph.nodes[src].name}'. Distances set to infinity.",
            "visited_nodes": list(visited),
            "frontier_nodes": [src],
            "distances": {k: (round(v, 2) if v != float('inf') else None) for k, v in dist.items()}
        })
        step_counter += 1

        nearest_shelter_reached: Optional[str] = None

        while pq:
            current_dist, u = heapq.heappop(pq)

            if u in visited:
                continue

            visited.add(u)
            total_nodes_explored += 1

            step_trace.append({
                "step": step_counter,
                "type": "visit",
                "current_node": u,
                "current_dist": round(current_dist, 2),
                "description": f"Extracted '{graph.nodes[u].name}' from priority queue with minimum distance {round(current_dist, 2)} km.",
                "visited_nodes": list(visited),
                "frontier_nodes": [n for _, n in pq],
                "distances": {k: (round(v, 2) if v != float('inf') else None) for k, v in dist.items()}
            })
            step_counter += 1

            # Check if this node is a shelter target
            if u in shelter_ids:
                nearest_shelter_reached = u
                step_trace.append({
                    "step": step_counter,
                    "type": "target_found",
                    "current_node": u,
                    "description": f"Safe Shelter reached: '{graph.nodes[u].name}' at total distance {round(current_dist, 2)} km.",
                    "visited_nodes": list(visited),
                    "frontier_nodes": [n for _, n in pq],
                    "distances": {k: (round(v, 2) if v != float('inf') else None) for k, v in dist.items()}
                })
                step_counter += 1
                if source_id:  # Single target mode, terminate search
                    break

            # Explore outgoing passable edges
            neighbors = graph.get_neighbors(u, include_blocked=False)
            for v, edge in neighbors:
                total_edges_evaluated += 1
                weight = edge.effective_weight
                new_dist = current_dist + weight

                if new_dist < dist[v]:
                    old_dist = dist[v]
                    dist[v] = new_dist
                    prev[v] = u
                    edge_used[v] = edge.id
                    heapq.heappush(pq, (new_dist, v))

                    step_trace.append({
                        "step": step_counter,
                        "type": "relax",
                        "current_node": u,
                        "target_node": v,
                        "edge_id": edge.id,
                        "edge_weight": round(weight, 2),
                        "description": f"Relaxed road {edge.id} to '{graph.nodes[v].name}'. Tentative distance reduced from {('inf' if old_dist == float('inf') else round(old_dist, 2))} to {round(new_dist, 2)} km.",
                        "visited_nodes": list(visited),
                        "frontier_nodes": [n for _, n in pq],
                        "distances": {k: (round(val, 2) if val != float('inf') else None) for k, val in dist.items()}
                    })
                    step_counter += 1

        # Reconstruct path to target shelter(s)
        targets_to_evaluate = [nearest_shelter_reached] if nearest_shelter_reached else shelter_ids
        for s_id in targets_to_evaluate:
            if not s_id or dist[s_id] == float('inf'):
                continue

            curr: Optional[str] = s_id
            path_nodes = []
            path_edges = []
            while curr is not None:
                path_nodes.append(curr)
                e_id = edge_used[curr]
                if e_id:
                    path_edges.append(e_id)
                curr = prev[curr]
            path_nodes.reverse()
            path_edges.reverse()

            total_dist = dist[s_id]
            # Speed estimate ~40 km/h average
            travel_time_min = (total_dist / 40.0) * 60.0

            all_paths.append({
                "source_id": src,
                "source_name": graph.nodes[src].name,
                "shelter_id": s_id,
                "shelter_name": graph.nodes[s_id].name,
                "path_nodes": path_nodes,
                "path_edges": path_edges,
                "distance_km": round(total_dist, 2),
                "estimated_time_min": round(travel_time_min, 1),
                "population_evacuating": graph.nodes[src].population
            })

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "algorithm": "Dijkstra's Shortest Path",
        "category": "Greedy / Single-Source Shortest Path",
        "execution_time_ms": round(elapsed_ms, 3),
        "nodes_explored": total_nodes_explored,
        "edges_evaluated": total_edges_evaluated,
        "paths": all_paths,
        "steps_count": len(step_trace),
        "steps": step_trace[:200],  # Bound steps payload for responsive UI
        "theoretical_complexity": {
            "time_complexity": "O((V + E) log V)",
            "space_complexity": "O(V)",
            "description": "Utilizes a min-heap priority queue for optimal greedy frontier exploration. Optimal for nonnegative road distances."
        }
    }
