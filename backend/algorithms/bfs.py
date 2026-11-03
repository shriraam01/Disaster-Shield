from collections import deque
import time
from typing import Dict, List, Optional, Any, Set
from backend.models.graph import CityGraph

def run_bfs(
    graph: CityGraph,
    source_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes Breadth-First Search (BFS) for reachability and unweighted hop-shortest paths.
    
    DAA Concepts:
      - Traversal mechanism: Level-order FIFO queue.
      - Unweighted shortest path: Guaranteed to find path with minimum number of edge hops.
      - Disaster Reachability Analysis: Identifies isolated components / cutoff zones trapped by hazard blockages.
      - Complexity: O(V + E) time, O(V) space.
    """
    start_time = time.perf_counter()

    if not source_id or source_id not in graph.nodes:
        evac_zones = graph.get_evacuation_zones()
        source_id = evac_zones[0].id if evac_zones else next(iter(graph.nodes.keys()))

    shelters = graph.get_shelters()
    shelter_ids = {s.id for s in shelters}

    queue: deque[tuple[str, int]] = deque([(source_id, 0)])
    visited: Set[str] = {source_id}
    parent: Dict[str, Optional[str]] = {source_id: None}
    edge_used: Dict[str, Optional[str]] = {source_id: None}
    hop_distance: Dict[str, int] = {source_id: 0}

    step_trace = []
    step_counter = 0
    total_nodes_explored = 0
    total_edges_evaluated = 0

    step_trace.append({
        "step": step_counter,
        "type": "init",
        "current_node": source_id,
        "hop_level": 0,
        "description": f"Enqueued start zone '{graph.nodes[source_id].name}' at Level 0.",
        "queue": [n for n, _ in queue],
        "visited_nodes": list(visited)
    })
    step_counter += 1

    reached_shelters = []

    while queue:
        curr, hops = queue.popleft()
        total_nodes_explored += 1

        step_trace.append({
            "step": step_counter,
            "type": "dequeue",
            "current_node": curr,
            "hop_level": hops,
            "description": f"Dequeued '{graph.nodes[curr].name}' at Hop Level {hops}.",
            "queue": [n for n, _ in queue],
            "visited_nodes": list(visited)
        })
        step_counter += 1

        if curr in shelter_ids:
            reached_shelters.append((curr, hops))
            step_trace.append({
                "step": step_counter,
                "type": "shelter_reached",
                "current_node": curr,
                "hop_level": hops,
                "description": f"Shelter reached via BFS: '{graph.nodes[curr].name}' in {hops} road hops.",
                "queue": [n for n, _ in queue],
                "visited_nodes": list(visited)
            })
            step_counter += 1

        neighbors = graph.get_neighbors(curr, include_blocked=False)
        for neighbor, edge in neighbors:
            total_edges_evaluated += 1
            if neighbor not in visited:
                visited.add(neighbor)
                parent[neighbor] = curr
                edge_used[neighbor] = edge.id
                hop_distance[neighbor] = hops + 1
                queue.append((neighbor, hops + 1))

                step_trace.append({
                    "step": step_counter,
                    "type": "enqueue",
                    "current_node": curr,
                    "target_node": neighbor,
                    "edge_id": edge.id,
                    "hop_level": hops + 1,
                    "description": f"Discovered '{graph.nodes[neighbor].name}' (Hop {hops + 1}) via road {edge.id}. Enqueued.",
                    "queue": [n for n, _ in queue],
                    "visited_nodes": list(visited)
                })
                step_counter += 1

    # Identify trapped / isolated nodes that could not be reached
    unreachable_nodes = [
        {"id": n.id, "name": n.name, "type": n.type, "population": n.population}
        for n in graph.nodes.values()
        if n.id not in visited
    ]

    # Reconstruct paths to all reached shelters
    paths = []
    for s_id, hops in reached_shelters:
        curr = s_id
        path_nodes = []
        path_edges = []
        total_km = 0.0

        while curr is not None:
            path_nodes.append(curr)
            e_id = edge_used[curr]
            if e_id and e_id in graph.edges:
                path_edges.append(e_id)
                total_km += graph.edges[e_id].distance_km
            curr = parent[curr]

        path_nodes.reverse()
        path_edges.reverse()

        paths.append({
            "source_id": source_id,
            "source_name": graph.nodes[source_id].name,
            "shelter_id": s_id,
            "shelter_name": graph.nodes[s_id].name,
            "path_nodes": path_nodes,
            "path_edges": path_edges,
            "hops": hops,
            "distance_km": round(total_km, 2),
            "estimated_time_min": round((total_km / 40.0) * 60.0, 1)
        })

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "algorithm": "Breadth-First Search (BFS)",
        "category": "Unweighted Graph Traversal / Reachability",
        "execution_time_ms": round(elapsed_ms, 3),
        "nodes_explored": total_nodes_explored,
        "edges_evaluated": total_edges_evaluated,
        "reachable_shelters_count": len(reached_shelters),
        "is_safe_route_available": len(reached_shelters) > 0,
        "unreachable_nodes": unreachable_nodes,
        "trapped_population": sum(n["population"] for n in unreachable_nodes if n["type"] == "zone"),
        "paths": paths,
        "steps_count": len(step_trace),
        "steps": step_trace[:200],
        "theoretical_complexity": {
            "time_complexity": "O(V + E)",
            "space_complexity": "O(V)",
            "description": "Explores network breadth-first level by level with FIFO queue. Identifies minimum hop count and isolated disaster-trapped topological components."
        }
    }
