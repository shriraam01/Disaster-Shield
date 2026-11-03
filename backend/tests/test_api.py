import unittest
import json
from backend.app import app

class TestDisasterShieldAPI(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health_check(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["status"], "online")

    def test_list_scenarios(self):
        resp = self.client.get("/api/scenarios")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIn("scenarios", data)
        self.assertGreaterEqual(len(data["scenarios"]), 3)

    def test_get_scenario(self):
        resp = self.client.get("/api/scenarios/metro_city")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["scenario_id"], "metro_city")
        self.assertIn("nodes", data)
        self.assertIn("edges", data)

    def test_dijkstra_endpoint(self):
        resp = self.client.post("/api/evacuate/dijkstra", json={
            "scenario_id": "metro_city",
            "source_id": "Z1"
        })
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["algorithm"], "Dijkstra's Shortest Path")
        self.assertTrue(len(data["paths"]) > 0)

    def test_max_flow_endpoint(self):
        resp = self.client.post("/api/evacuate/max-flow", json={
            "scenario_id": "metro_city"
        })
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIn("max_evacuation_flow_rate", data)
        self.assertGreater(data["max_evacuation_flow_rate"], 0)

    def test_compare_endpoint(self):
        resp = self.client.post("/api/compare", json={
            "scenario_id": "metro_city",
            "source_id": "Z1"
        })
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIn("comparison_table", data)
        self.assertEqual(len(data["comparison_table"]), 5)

if __name__ == "__main__":
    unittest.main()
