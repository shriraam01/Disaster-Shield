import os
import json
import copy
from flask import Flask, request, jsonify
from flask_cors import CORS
from backend.models.graph import CityGraph
from backend.algorithms import (
    run_dijkstra,
    run_astar,
    run_bfs,
    run_edmonds_karp,
    run_greedy_prioritization,
    compare_all_algorithms
)

app = Flask(__name__)
# Enable CORS for all routes to allow frontend dev server communication
CORS(app, resources={r"/api/*": {"origins": "*"}})

SCENARIOS_DIR = os.path.join(os.path.dirname(__file__), "data", "scenarios")

# In-memory storage of active graphs per scenario
ACTIVE_GRAPHS: dict[str, CityGraph] = {}

def get_or_load_scenario(scenario_id: str, force_reload: bool = False) -> CityGraph:
    """Loads a scenario from disk or retrieves the active mutated in-memory copy."""
    if not force_reload and scenario_id in ACTIVE_GRAPHS:
        return ACTIVE_GRAPHS[scenario_id]

    file_path = os.path.join(SCENARIOS_DIR, f"{scenario_id}.json")
    if not os.path.exists(file_path):
        # Default fallback to metro_city
        file_path = os.path.join(SCENARIOS_DIR, "metro_city.json")
        scenario_id = "metro_city"

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    graph = CityGraph.from_dict(data)
    ACTIVE_GRAPHS[scenario_id] = graph
    return graph

def parse_graph_from_request() -> tuple[CityGraph, dict]:
    """Helper to parse custom graph payload from request or fallback to cached scenario."""
    req_data = request.get_json(silent=True) or {}
    scenario_id = req_data.get("scenario_id", "metro_city")

    if "custom_graph" in req_data and req_data["custom_graph"]:
        graph = CityGraph.from_dict(req_data["custom_graph"])
    else:
        graph = get_or_load_scenario(scenario_id)

    return graph, req_data


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "system": "DisasterShield Intelligent Evacuation Command Core",
        "algorithms": ["Dijkstra", "A* Search", "BFS", "Edmonds-Karp Max-Flow", "Greedy Prioritizer"]
    })


@app.route("/api/scenarios", methods=["GET"])
def list_scenarios():
    """Lists available scenarios with metadata."""
    scenarios_meta = []
    if os.path.exists(SCENARIOS_DIR):
        for f in os.listdir(SCENARIOS_DIR):
            if f.endswith(".json"):
                path = os.path.join(SCENARIOS_DIR, f)
                try:
                    with open(path, "r", encoding="utf-8") as file:
                        data = json.load(file)
                        scenarios_meta.append({
                            "id": data.get("scenario_id", f.replace(".json", "")),
                            "name": data.get("name", f),
                            "description": data.get("description", ""),
                            "center": data.get("center", {"lat": 13.0827, "lng": 80.2707, "zoom": 13}),
                            "disaster_count": len(data.get("disasters", [])),
                            "disaster_type": data.get("disasters", [{}])[0].get("type", "flood") if data.get("disasters") else "none",
                            "node_count": len(data.get("nodes", [])),
                            "edge_count": len(data.get("edges", []))
                        })
                except Exception as err:
                    continue
    return jsonify({"scenarios": scenarios_meta})


@app.route("/api/scenarios/<scenario_id>", methods=["GET"])
def get_scenario(scenario_id: str):
    """Retrieves full graph details for a scenario."""
    force_reload = request.args.get("reload", "false").lower() == "true"
    graph = get_or_load_scenario(scenario_id, force_reload=force_reload)
    return jsonify(graph.to_dict())


@app.route("/api/scenarios/<scenario_id>/reset", methods=["POST"])
def reset_scenario(scenario_id: str):
    """Resets scenario to default state from disk."""
    graph = get_or_load_scenario(scenario_id, force_reload=True)
    graph.reset_flows()
    return jsonify(graph.to_dict())


@app.route("/api/disaster/simulate", methods=["POST"])
def simulate_disasters():
    """
    Applies or updates disaster epicenters on the graph and re-evaluates road severances.
    """
    graph, req_data = parse_graph_from_request()
    disasters = req_data.get("disasters", [])
    
    graph.apply_disasters(disasters)
    return jsonify({
        "status": "success",
        "graph": graph.to_dict()
    })


@app.route("/api/roads/toggle", methods=["POST"])
def toggle_road():
    """Toggles or modifies the block/status of a specific road edge."""
    graph, req_data = parse_graph_from_request()
    edge_id = req_data.get("edge_id")
    new_status = req_data.get("status")

    if not edge_id or not graph.toggle_edge_block(edge_id, new_status=new_status):
        return jsonify({"error": f"Edge '{edge_id}' not found"}), 404

    return jsonify({
        "status": "success",
        "edge": graph.edges[edge_id].to_dict(),
        "graph": graph.to_dict()
    })


@app.route("/api/nodes/add", methods=["POST"])
def add_custom_node():
    """Adds a custom zone or shelter dynamically to the graph."""
    graph, req_data = parse_graph_from_request()
    node_data = req_data.get("node", {})
    if not node_data or "id" not in node_data:
        return jsonify({"error": "Invalid node data"}), 400

    from backend.models.graph import Node
    new_node = Node(
        node_id=node_data["id"],
        name=node_data.get("name", "Custom Location"),
        lat=float(node_data["lat"]),
        lng=float(node_data["lng"]),
        node_type=node_data.get("type", "zone"),
        population=int(node_data.get("population", 3000)),
        capacity=int(node_data.get("capacity", 5000)),
        description=node_data.get("description", "Custom added via Interactive Command Tools")
    )

    graph.add_custom_node(new_node, connect_nearest=2)
    return jsonify({
        "status": "success",
        "node": new_node.to_dict(),
        "graph": graph.to_dict()
    })


@app.route("/api/evacuate/dijkstra", methods=["POST"])
def execute_dijkstra():
    graph, req_data = parse_graph_from_request()
    source_id = req_data.get("source_id")
    target_shelter_id = req_data.get("target_shelter_id")

    res = run_dijkstra(graph, source_id=source_id, target_shelter_id=target_shelter_id)
    return jsonify(res)


@app.route("/api/evacuate/astar", methods=["POST"])
def execute_astar():
    graph, req_data = parse_graph_from_request()
    source_id = req_data.get("source_id")
    target_shelter_id = req_data.get("target_shelter_id")

    res = run_astar(graph, source_id=source_id, target_shelter_id=target_shelter_id)
    return jsonify(res)


@app.route("/api/evacuate/bfs", methods=["POST"])
def execute_bfs():
    graph, req_data = parse_graph_from_request()
    source_id = req_data.get("source_id")

    res = run_bfs(graph, source_id=source_id)
    return jsonify(res)


@app.route("/api/evacuate/max-flow", methods=["POST"])
def execute_max_flow():
    graph, _ = parse_graph_from_request()
    res = run_edmonds_karp(graph)
    # Include updated graph to reflect edge current flows
    res["updated_graph"] = graph.to_dict()
    return jsonify(res)


@app.route("/api/evacuate/greedy", methods=["POST"])
def execute_greedy():
    graph, _ = parse_graph_from_request()
    res = run_greedy_prioritization(graph)
    return jsonify(res)


@app.route("/api/compare", methods=["POST"])
def execute_comparison():
    graph, req_data = parse_graph_from_request()
    source_id = req_data.get("source_id")
    res = compare_all_algorithms(graph, source_zone_id=source_id)
    return jsonify(res)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[*] DisasterShield Backend running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
