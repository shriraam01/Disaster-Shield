from collections import deque
import time
from typing import Dict, List, Optional, Any, Set, Tuple
from backend.models.graph import CityGraph

def run_edmonds_karp(
    graph: CityGraph
) -> Dict[str, Any]:
    """
    Executes Edmonds-Karp Algorithm (BFS-based Ford-Fulkerson) for Maximum Network Evacuation Flow.
    
    DAA Concepts:
      - Max-Flow Min-Cut Theorem: The maximum amount of flow from Super-Source to Super-Sink
        equals the capacity of the minimum cut.
      - Residual Graph: For every directed edge (u, v) with capacity c and flow f, 
        residual capacity cf(u, v) = c - f, and reverse edge cf(v, u) = f.
      - Augmenting Path: Path with positive residual capacity found via BFS (shortest hop count).
      - Time Complexity: O(V * E^2), space complexity O(V + E).
      - Practical Impact: Identifies exact road bottlenecks limiting citywide throughput.
    """
    start_time = time.perf_counter()

    SUPER_SOURCE = "__SUPER_SOURCE__"
    SUPER_SINK = "__SUPER_SINK__"

    # Step 1: Build the Capacity Matrix and Adjacency structure for the Residual Network
    # We map all nodes + super source + super sink
    nodes_set = set(graph.nodes.keys())
    nodes_set.add(SUPER_SOURCE)
    nodes_set.add(SUPER_SINK)

    capacity: Dict[str, Dict[str, int]] = {u: {} for u in nodes_set}
    flow: Dict[str, Dict[str, int]] = {u: {} for u in nodes_set}
    adj: Dict[str, Set[str]] = {u: set() for u in nodes_set}

    def add_network_edge(u: str, v: str, cap: int):
        capacity[u][v] = capacity[u].get(v, 0) + cap
        capacity[v][u] = capacity[v].get(u, 0)  # 0 initially for back-edge
        flow[u][v] = 0
        flow[v][u] = 0
        adj[u].add(v)
        adj[v].add(u)

    # Connect Super-Source to all population zones with capacity = zone population
    total_evacuee_demand = 0
    for zone in graph.get_evacuation_zones():
        add_network_edge(SUPER_SOURCE, zone.id, zone.population)
        total_evacuee_demand += zone.population

    # Connect all shelters to Super-Sink with capacity = shelter available capacity
    total_shelter_capacity = 0
    for shelter in graph.get_shelters():
        avail = max(0, shelter.capacity - shelter.current_occupancy)
        add_network_edge(shelter.id, SUPER_SINK, avail)
        total_shelter_capacity += avail

    # Add road network edges (only passable / unblocked edges)
    edge_map: Dict[Tuple[str, str], str] = {}
    for edge in graph.edges.values():
        if not edge.is_passable:
            continue
        add_network_edge(edge.source, edge.target, edge.capacity_flow)
        edge_map[(edge.source, edge.target)] = edge.id
        if edge.bidirectional:
            add_network_edge(edge.target, edge.source, edge.capacity_flow)
            edge_map[(edge.target, edge.source)] = edge.id

    max_flow = 0
    augmenting_paths_record = []
    step_trace = []
    step_counter = 0

    step_trace.append({
        "step": step_counter,
        "type": "init",
        "description": f"Constructed multi-source multi-sink evacuation network. Total Demand: {total_evacuee_demand} people, Shelter Capacity: {total_shelter_capacity}.",
        "current_flow": 0
    })
    step_counter += 1

    # Step 2: Edmonds-Karp BFS loop
    def bfs_find_path() -> Tuple[Optional[List[str]], int]:
        parent: Dict[str, Optional[str]] = {u: None for u in nodes_set}
        parent[SUPER_SOURCE] = SUPER_SOURCE
        queue = deque([SUPER_SOURCE])
        
        while queue:
            curr = queue.popleft()
            if curr == SUPER_SINK:
                break
            for nxt in adj[curr]:
                residual = capacity[curr].get(nxt, 0) - flow[curr].get(nxt, 0)
                if residual > 0 and parent[nxt] is None:
                    parent[nxt] = curr
                    queue.append(nxt)

        if parent[SUPER_SINK] is None:
            return None, 0

        # Backtrack to find bottleneck residual capacity along augmenting path
        path = []
        curr = SUPER_SINK
        bottleneck = float('inf')
        while curr != SUPER_SOURCE:
            path.append(curr)
            prev = parent[curr]
            res = capacity[prev][curr] - flow[prev][curr]
            bottleneck = min(bottleneck, res)
            curr = prev
        path.append(SUPER_SOURCE)
        path.reverse()
        return path, int(bottleneck)

    iteration = 1
    while True:
        path, bottleneck = bfs_find_path()
        if not path or bottleneck == 0:
            break

        # Augment flow along path
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            flow[u][v] += bottleneck
            flow[v][u] -= bottleneck

        max_flow += bottleneck

        # Clean display path (excluding super source/sink)
        internal_path = [node for node in path if node not in (SUPER_SOURCE, SUPER_SINK)]
        human_path = [graph.nodes[n].name if n in graph.nodes else n for n in internal_path]

        augmenting_paths_record.append({
            "iteration": iteration,
            "path": internal_path,
            "path_names": human_path,
            "flow_augmented": bottleneck,
            "cumulative_flow": max_flow
        })

        step_trace.append({
            "step": step_counter,
            "type": "augment",
            "iteration": iteration,
            "path": internal_path,
            "flow_augmented": bottleneck,
            "cumulative_flow": max_flow,
            "description": f"Found Augmenting Path #{iteration}: {' -> '.join(human_path)}. Siphoned {bottleneck} evacuees/hr."
        })
        step_counter += 1
        iteration += 1

    # Step 3: Compute Min-Cut to identify saturated bottleneck roads
    # BFS in residual graph from SUPER_SOURCE
    reachable_from_source: Set[str] = set()
    queue = deque([SUPER_SOURCE])
    reachable_from_source.add(SUPER_SOURCE)

    while queue:
        curr = queue.popleft()
        for nxt in adj[curr]:
            if nxt not in reachable_from_source and (capacity[curr].get(nxt, 0) - flow[curr].get(nxt, 0)) > 0:
                reachable_from_source.add(nxt)
                queue.append(nxt)

    # Bottleneck edges: u in reachable, v not in reachable, with initial capacity > 0
    bottleneck_edges = []
    for edge in graph.edges.values():
        edge_flow = 0
        is_saturated = False
        
        # Check forward flow
        f_fwd = max(0, flow[edge.source].get(edge.target, 0))
        f_bwd = max(0, flow[edge.target].get(edge.source, 0)) if edge.bidirectional else 0
        edge_flow = max(f_fwd, f_bwd)
        edge.current_flow = edge_flow

        # Saturated check
        if edge.source in reachable_from_source and edge.target not in reachable_from_source:
            if edge_flow >= edge.capacity_flow:
                is_saturated = True
                edge.is_bottleneck = True
                bottleneck_edges.append({
                    "edge_id": edge.id,
                    "source": graph.nodes[edge.source].name,
                    "target": graph.nodes[edge.target].name,
                    "capacity": edge.capacity_flow,
                    "utilized_flow": edge_flow,
                    "status": "100% Saturated (Min-Cut Bottleneck)",
                    "recommendation": f"Expand lane capacity on road {edge.id} or redirect traffic to relieve arterial choke."
                })

    # Update shelter occupancies according to flow entering them
    for shelter in graph.get_shelters():
        shelter_intake = sum(max(0, flow[u].get(shelter.id, 0)) for u in adj[shelter.id] if u != SUPER_SINK)
        shelter.current_occupancy = shelter_intake

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    evac_rate = round((max_flow / total_evacuee_demand * 100.0), 1) if total_evacuee_demand > 0 else 100.0

    return {
        "algorithm": "Edmonds-Karp Maximum Evacuation Flow",
        "category": "Network Flow / Min-Cut Bottleneck Theorem",
        "execution_time_ms": round(elapsed_ms, 3),
        "max_evacuation_flow_rate": max_flow,
        "total_demand": total_evacuee_demand,
        "evacuation_coverage_pct": evac_rate,
        "shelter_total_capacity": total_shelter_capacity,
        "augmenting_paths_count": len(augmenting_paths_record),
        "augmenting_paths": augmenting_paths_record,
        "bottlenecks_count": len(bottleneck_edges),
        "bottleneck_roads": bottleneck_edges,
        "steps_count": len(step_trace),
        "steps": step_trace[:200],
        "theoretical_complexity": {
            "time_complexity": "O(V * E^2)",
            "space_complexity": "O(V + E)",
            "description": "Computes shortest augmenting paths via BFS in the residual network until no augmenting path exists. The S-T cut of saturated edges reveals physical city bottlenecks (Max-Flow Min-Cut Theorem)."
        }
    }
