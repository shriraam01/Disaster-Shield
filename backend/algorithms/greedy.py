import time
from typing import Dict, List, Optional, Any
from backend.models.graph import CityGraph, haversine_distance

def run_greedy_prioritization(
    graph: CityGraph
) -> Dict[str, Any]:
    """
    Executes Greedy Evacuation Prioritization Algorithm.
    
    DAA Concepts:
      - Greedy Choice Property: Always services the evacuation zone with highest Urgency/Risk Index first.
      - Urgency Index: Combines population size, proximity to disaster epicenter, and distance to safety.
      - Nearest Shelter Greedy Matching: Greedily assigns evacuees to the closest shelter with non-zero available capacity.
      - Algorithmic Trade-off: Very fast O(Z log Z + Z * S) execution, but can lead to sub-optimal global congestion
        or shelter starvation for more distant zones compared to Max-Flow optimal allocation.
      - Complexity: O(Z log Z + Z * S), Space O(V).
    """
    start_time = time.perf_counter()

    zones = graph.get_evacuation_zones()
    shelters = graph.get_shelters()

    if not shelters or not zones:
        return {
            "error": "Insufficient zones or shelters in scenario."
        }

    # Track remaining capacities of shelters
    shelter_capacities = {s.id: max(0, s.capacity - s.current_occupancy) for s in shelters}

    # Step 1: Calculate Urgency Score for each zone
    zone_urgencies = []
    for z in zones:
        # Closest straight-line distance to any shelter
        min_shelter_dist = min(
            haversine_distance(z.lat, z.lng, s.lat, s.lng)
            for s in shelters
        )

        # Hazard factor
        hazard_mult = 1.0 + (z.hazard_severity * 4.0 if z.in_hazard_zone else 0.0)

        # Urgency formula: Population * Hazard Factor / (0.5 + Min Distance)
        urgency_score = (z.population * hazard_mult) / (min_shelter_dist + 0.5)

        zone_urgencies.append({
            "zone_id": z.id,
            "zone_name": z.name,
            "population": z.population,
            "in_hazard_zone": z.in_hazard_zone,
            "hazard_severity": round(z.hazard_severity, 2),
            "min_shelter_dist_km": round(min_shelter_dist, 2),
            "urgency_score": round(urgency_score, 1)
        })

    # Greedily sort by Urgency Score descending
    zone_urgencies.sort(key=lambda item: item["urgency_score"], reverse=True)

    allocations = []
    unserved_evacuees = 0
    total_evacuated = 0
    total_demand = sum(z["population"] for z in zone_urgencies)

    step_trace = []
    step_counter = 0

    step_trace.append({
        "step": step_counter,
        "type": "init",
        "description": f"Calculated Urgency Index for {len(zone_urgencies)} zones. Ranked zones by risk priority.",
        "ranked_zones": [z["zone_name"] for z in zone_urgencies]
    })
    step_counter += 1

    # Step 2: Greedily allocate each zone to nearest available shelter
    for item in zone_urgencies:
        z_id = item["zone_id"]
        z_node = graph.nodes[z_id]
        remaining_pop = item["population"]

        # Sort shelters by distance from this zone
        sorted_shelters = sorted(
            shelters,
            key=lambda s: haversine_distance(z_node.lat, z_node.lng, s.lat, s.lng)
        )

        zone_allocations = []

        for s in sorted_shelters:
            avail = shelter_capacities[s.id]
            if avail <= 0:
                continue

            dist = haversine_distance(z_node.lat, z_node.lng, s.lat, s.lng)
            allocated = min(remaining_pop, avail)
            shelter_capacities[s.id] -= allocated
            remaining_pop -= allocated
            total_evacuated += allocated

            zone_allocations.append({
                "shelter_id": s.id,
                "shelter_name": s.name,
                "evacuees_sent": allocated,
                "distance_km": round(dist, 2)
            })

            step_trace.append({
                "step": step_counter,
                "type": "allocation",
                "zone_id": z_id,
                "shelter_id": s.id,
                "evacuees_sent": allocated,
                "shelter_remaining": shelter_capacities[s.id],
                "description": f"Greedily allocated {allocated} evacuees from '{z_node.name}' (Priority {item['urgency_score']}) to nearest available '{s.name}' ({round(dist, 2)} km away). Remaining shelter capacity: {shelter_capacities[s.id]}."
            })
            step_counter += 1

            if remaining_pop <= 0:
                break

        if remaining_pop > 0:
            unserved_evacuees += remaining_pop
            step_trace.append({
                "step": step_counter,
                "type": "deficit",
                "zone_id": z_id,
                "unserved_pop": remaining_pop,
                "description": f"WARNING: All reachable shelters saturated! {remaining_pop} evacuees from '{z_node.name}' remain unassigned."
            })
            step_counter += 1

        allocations.append({
            "zone_id": z_id,
            "zone_name": z_node.name,
            "total_population": item["population"],
            "urgency_score": item["urgency_score"],
            "allocations": zone_allocations,
            "unserved_population": remaining_pop
        })

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    evac_rate = round((total_evacuated / total_demand * 100.0), 1) if total_demand > 0 else 100.0

    return {
        "algorithm": "Greedy Evacuation Prioritizer",
        "category": "Greedy Approximation / Triage Allocation",
        "execution_time_ms": round(elapsed_ms, 3),
        "total_demand": total_demand,
        "total_evacuated": total_evacuated,
        "unserved_evacuees": unserved_evacuees,
        "evacuation_coverage_pct": evac_rate,
        "priority_ranked_zones": zone_urgencies,
        "zone_allocations": allocations,
        "shelter_remaining_capacities": {
            graph.nodes[s_id].name: cap for s_id, cap in shelter_capacities.items()
        },
        "steps_count": len(step_trace),
        "steps": step_trace[:200],
        "theoretical_complexity": {
            "time_complexity": "O(Z log Z + Z * S)",
            "space_complexity": "O(V)",
            "description": "Sorts Z hazard zones by composite urgency index in O(Z log Z) time, then greedily satisfies demand against S shelters. Optimal for quick field triage."
        }
    }
