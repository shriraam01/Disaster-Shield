import unittest
import json
import os
from backend.models.graph import CityGraph, Node, Edge
from backend.algorithms.dijkstra import run_dijkstra
from backend.algorithms.astar import run_astar
from backend.algorithms.bfs import run_bfs
from backend.algorithms.max_flow import run_edmonds_karp
from backend.algorithms.greedy import run_greedy_prioritization
from backend.algorithms.comparator import compare_all_algorithms

class TestDisasterShieldAlgorithms(unittest.TestCase):
    def setUp(self):
        # Create a clean synthetic graph for algorithmic verification
        self.graph = CityGraph(scenario_id="test_grid", name="Test Emergency Grid")
        self.graph.add_node(Node("Z1", "Zone Alpha", 13.0, 80.0, node_type="zone", population=800))
        self.graph.add_node(Node("J1", "Junction 1", 13.02, 80.02, node_type="junction"))
        self.graph.add_node(Node("J2", "Junction 2", 12.98, 80.01, node_type="junction"))
        self.graph.add_node(Node("S1", "Shelter North", 13.05, 80.05, node_type="shelter", capacity=1000))
        self.graph.add_node(Node("S2", "Shelter South", 12.95, 80.06, node_type="shelter", capacity=500))

        self.graph.add_edge(Edge("E1", "Z1", "J1", distance_km=2.0, capacity_flow=500, bidirectional=True))
        self.graph.add_edge(Edge("E2", "Z1", "J2", distance_km=1.0, capacity_flow=400, bidirectional=True))
        self.graph.add_edge(Edge("E3", "J1", "S1", distance_km=3.0, capacity_flow=600, bidirectional=True))
        self.graph.add_edge(Edge("E4", "J1", "J2", distance_km=1.0, capacity_flow=300, bidirectional=True))
        self.graph.add_edge(Edge("E5", "J2", "S2", distance_km=4.0, capacity_flow=500, bidirectional=True))

    def test_dijkstra_shortest_path(self):
        res = run_dijkstra(self.graph, source_id="Z1")
        self.assertEqual(res["algorithm"], "Dijkstra's Shortest Path")
        self.assertTrue(len(res["paths"]) > 0)
        first_path = res["paths"][0]
        self.assertAlmostEqual(first_path["distance_km"], 5.0, delta=0.1)
        self.assertIn("steps", res)
        self.assertGreater(len(res["steps"]), 0)

    def test_dijkstra_with_road_blockage(self):
        self.graph.toggle_edge_block("E1", new_status="flooded")
        res = run_dijkstra(self.graph, source_id="Z1")
        path = res["paths"][0]
        self.assertNotIn("E1", path["path_edges"])
        self.assertIn("E2", path["path_edges"])

    def test_astar_search(self):
        res = run_astar(self.graph, source_id="Z1", target_shelter_id="S1")
        self.assertEqual(res["algorithm"], "A* Heuristic Pathfinder")
        self.assertTrue(res["path_found"])
        self.assertEqual(res["paths"][0]["shelter_id"], "S1")
        self.assertAlmostEqual(res["paths"][0]["distance_km"], 5.0, delta=0.1)

    def test_bfs_hops_and_reachability(self):
        res = run_bfs(self.graph, source_id="Z1")
        self.assertEqual(res["algorithm"], "Breadth-First Search (BFS)")
        self.assertTrue(res["is_safe_route_available"])
        self.assertEqual(res["reachable_shelters_count"], 2)
        path_to_s1 = next(p for p in res["paths"] if p["shelter_id"] == "S1")
        self.assertEqual(path_to_s1["hops"], 2)

    def test_bfs_isolated_trapped_detection(self):
        self.graph.toggle_edge_block("E3", new_status="collapsed")
        self.graph.toggle_edge_block("E2", new_status="collapsed")
        self.graph.toggle_edge_block("E4", new_status="collapsed")
        
        res = run_bfs(self.graph, source_id="Z1")
        self.assertFalse(res["is_safe_route_available"])
        self.assertEqual(res["reachable_shelters_count"], 0)

    def test_edmonds_karp_max_flow(self):
        res = run_edmonds_karp(self.graph)
        self.assertEqual(res["algorithm"], "Edmonds-Karp Maximum Evacuation Flow")
        self.assertEqual(res["max_evacuation_flow_rate"], 800)
        self.assertEqual(res["evacuation_coverage_pct"], 100.0)
        self.assertGreater(len(res["augmenting_paths"]), 0)

    def test_greedy_prioritization(self):
        res = run_greedy_prioritization(self.graph)
        self.assertEqual(res["algorithm"], "Greedy Evacuation Prioritizer")
        self.assertEqual(res["total_demand"], 800)
        self.assertEqual(res["total_evacuated"], 800)
        self.assertEqual(res["unserved_evacuees"], 0)
        self.assertEqual(len(res["priority_ranked_zones"]), 1)

    def test_compare_all_algorithms(self):
        res = compare_all_algorithms(self.graph, source_zone_id="Z1")
        self.assertIn("comparison_table", res)
        self.assertEqual(len(res["comparison_table"]), 5)
        self.assertIn("chart_data", res)
        self.assertEqual(len(res["chart_data"]), 5)

    def test_load_all_scenario_files(self):
        scenarios_dir = os.path.join(os.path.dirname(__file__), "..", "data", "scenarios")
        scenario_files = ["metro_city.json", "coastal_bay.json", "valley_basin.json"]
        for s_file in scenario_files:
            file_path = os.path.join(scenarios_dir, s_file)
            self.assertTrue(os.path.exists(file_path), f"Missing {s_file}")
            with open(file_path, "r") as f:
                data = json.load(f)
            g = CityGraph.from_dict(data)
            self.assertGreater(len(g.nodes), 5)
            self.assertGreater(len(g.edges), 5)
            self.assertGreater(len(g.get_shelters()), 0)
            self.assertGreater(len(g.get_evacuation_zones()), 0)

            comp = compare_all_algorithms(g)
            self.assertEqual(len(comp["comparison_table"]), 5)

if __name__ == "__main__":
    unittest.main()
