import heapq
import time
from typing import Dict, List, Optional, Any, Set
from backend.models.graph import CityGraph, haversine_distance

def run_astar(
    graph: CityGraph,
    source_id: str,
    target_shelter_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes A* Search Algorithm on CityGraph with an admissible Haversine heuristic.
    
    DAA Concepts:
      - Best-First Search guided by evaluation function: f(n) = g(n) + h(n)
      - g(n): Exact cost from start to node n.
      - h(n): Admissible heuristic (straight-line distance <= road network distance).
      - Optimality: Guaranteed optimal shortest path when h(n) is admissible and consistent.
      - Pruning: Drastically reduces search space compared to uninformed Dijkstra.
      - Complexity: O(E) in best case with perfect heuristic; O(b^d) worst-case.
    """
    start_time = time.perf_counter()

    if source_id not in graph.nodes:
        # Pick first population zone if invalid
        evac_zones = graph.get_evacuation_zones()
        source_id = evac_zones[0].id if evac_zones else next(iter(graph.nodes.keys()))

    shelters = graph.get_shelters()
    if not shelters:
        return {"error": "No shelters available in scenario."}

    # If no specific shelter targeted, find closest shelter geographically to guide heuristic
    src_node = graph.nodes[source_id]
    target_node = None

    if target_shelter_id and target_shelter_id in graph.nodes:
        target_node = graph.nodes[target_shelter_id]
    else:
        # Choose the geographically closest shelter as goal heuristic target
        target_node = min(
            shelters,
            key=lambda s: haversine_distance(src_node.lat, src_node.lng, s.lat, s.lng)
        )

    target_id = target_node.id

    def heuristic(u_id: str) -> float:
        """Admissible Euclidean / Haversine distance heuristic to target shelter."""
        u = graph.nodes[u_id]
        return haversine_distance(u.lat, u.lng, target_node.lat, target_node.lng)

    # g_score[n]: cost of cheapest path from start to n currently known
    g_score: Dict[str, float] = {node_id: float('inf') for node_id in graph.nodes}
    g_score[source_id] = 0.0

    # f_score[n] = g_score[n] + h(n)
    f_score: Dict[str, float] = {node_id: float('inf') for node_id in graph.nodes}
    f_score[source_id] = heuristic(source_id)

    # Priority queue stores (f_score, tie_breaker_counter, node_id)
    tie_breaker = 0
    open_set: List[tuple[float, int, str]] = [(f_score[source_id], tie_breaker, source_id)]
    open_set_hash: Set[str] = {source_id}
    closed_set: Set[str] = set()

    came_from: Dict[str, Optional[str]] = {node_id: None for node_id in graph.nodes}
    edge_used: Dict[str, Optional[str]] = {node_id: None for node_id in graph.nodes}

    step_trace = []
    step_counter = 0
    total_nodes_explored = 0
    total_edges_evaluated = 0

    step_trace.append({
        "step": step_counter,
        "type": "init",
        "current_node": source_id,
        "g_score": 0.0,
        "h_score": round(f_score[source_id], 2),
        "f_score": round(f_score[source_id], 2),
        "target_shelter": target_id,
        "description": f"Initialized A* from '{src_node.name}' towards '{target_node.name}'. h({source_id}) = {round(f_score[source_id], 2)} km.",
        "open_set": list(open_set_hash),
        "closed_set": list(closed_set)
    })
    step_counter += 1

    path_found = False

    while open_set:
        current_f, _, current = heapq.heappop(open_set)
        if current in closed_set:
            continue

        open_set_hash.discard(current)
        closed_set.add(current)
        total_nodes_explored += 1

        step_trace.append({
            "step": step_counter,
            "type": "visit",
            "current_node": current,
            "g_score": round(g_score[current], 2),
            "h_score": round(heuristic(current), 2),
            "f_score": round(current_f, 2),
            "description": f"Extracted '{graph.nodes[current].name}' with lowest f(n) = g({round(g_score[current], 2)}) + h({round(heuristic(current), 2)}) = {round(current_f, 2)}.",
            "open_set": list(open_set_hash),
            "closed_set": list(closed_set)
        })
        step_counter += 1

        # Check goal condition
        if current == target_id or (target_shelter_id is None and graph.nodes[current].type == "shelter"):
            path_found = True
            target_id = current
            step_trace.append({
                "step": step_counter,
                "type": "target_found",
                "current_node": current,
                "description": f"Goal Shelter '{graph.nodes[current].name}' reached! Total cost g(n) = {round(g_score[current], 2)} km.",
                "open_set": list(open_set_hash),
                "closed_set": list(closed_set)
            })
            step_counter += 1
            break

        # Explore outgoing edges
        neighbors = graph.get_neighbors(current, include_blocked=False)
        for neighbor, edge in neighbors:
            total_edges_evaluated += 1
            if neighbor in closed_set:
                continue

            tentative_g = g_score[current] + edge.effective_weight

            if tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                edge_used[neighbor] = edge.id
                g_score[neighbor] = tentative_g
                h_val = heuristic(neighbor)
                f_val = tentative_g + h_val
                f_score[neighbor] = f_val

                if neighbor not in open_set_hash:
                    tie_breaker += 1
                    heapq.heappush(open_set, (f_val, tie_breaker, neighbor))
                    open_set_hash.add(neighbor)

                step_trace.append({
                    "step": step_counter,
                    "type": "relax",
                    "current_node": current,
                    "target_node": neighbor,
                    "edge_id": edge.id,
                    "g_score": round(tentative_g, 2),
                    "h_score": round(h_val, 2),
                    "f_score": round(f_val, 2),
                    "description": f"Evaluated neighbor '{graph.nodes[neighbor].name}': g={round(tentative_g, 2)}, h={round(h_val, 2)} -> f={round(f_val, 2)} km.",
                    "open_set": list(open_set_hash),
                    "closed_set": list(closed_set)
                })
                step_counter += 1

    # Reconstruct path
    path_nodes = []
    path_edges = []
    total_dist = 0.0

    if path_found:
        curr: Optional[str] = target_id
        while curr is not None:
            path_nodes.append(curr)
            e_id = edge_used[curr]
            if e_id:
                path_edges.append(e_id)
            curr = came_from[curr]
        path_nodes.reverse()
        path_edges.reverse()
        total_dist = g_score[target_id]

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "algorithm": "A* Heuristic Pathfinder",
        "category": "Informed Search / Heuristic Graph Traversal",
        "execution_time_ms": round(elapsed_ms, 3),
        "nodes_explored": total_nodes_explored,
        "edges_evaluated": total_edges_evaluated,
        "path_found": path_found,
        "paths": [{
            "source_id": source_id,
            "source_name": graph.nodes[source_id].name,
            "shelter_id": target_id,
            "shelter_name": graph.nodes[target_id].name,
            "path_nodes": path_nodes,
            "path_edges": path_edges,
            "distance_km": round(total_dist, 2),
            "estimated_time_min": round((total_dist / 40.0) * 60.0, 1),
            "population_evacuating": graph.nodes[source_id].population
        }] if path_found else [],
        "steps_count": len(step_trace),
        "steps": step_trace[:200],
        "theoretical_complexity": {
            "time_complexity": "O(E) best, O(b^d) worst",
            "space_complexity": "O(V)",
            "description": "Uses consistent Haversine distance heuristic h(n) <= d*(n, goal) to guide search directly toward target shelter, drastically pruning search frontier."
        }
    }
