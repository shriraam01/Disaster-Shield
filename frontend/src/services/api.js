const API_BASE = '/api';

export const apiService = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getScenarios() {
    const res = await fetch(`${API_BASE}/scenarios`);
    return res.json();
  },

  async getScenario(id, reload = false) {
    const res = await fetch(`${API_BASE}/scenarios/${id}${reload ? '?reload=true' : ''}`);
    return res.json();
  },

  async resetScenario(id) {
    const res = await fetch(`${API_BASE}/scenarios/${id}/reset`, { method: 'POST' });
    return res.json();
  },

  async simulateDisasters(scenarioId, disasters) {
    const res = await fetch(`${API_BASE}/disaster/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, disasters }),
    });
    return res.json();
  },

  async toggleRoad(scenarioId, edgeId, status = null) {
    const res = await fetch(`${API_BASE}/roads/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, edge_id: edgeId, status }),
    });
    return res.json();
  },

  async runDijkstra(scenarioId, sourceId, targetShelterId = null) {
    const res = await fetch(`${API_BASE}/evacuate/dijkstra`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, source_id: sourceId, target_shelter_id: targetShelterId }),
    });
    return res.json();
  },

  async runAStar(scenarioId, sourceId, targetShelterId = null) {
    const res = await fetch(`${API_BASE}/evacuate/astar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, source_id: sourceId, target_shelter_id: targetShelterId }),
    });
    return res.json();
  },

  async runBFS(scenarioId, sourceId) {
    const res = await fetch(`${API_BASE}/evacuate/bfs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, source_id: sourceId }),
    });
    return res.json();
  },

  async runMaxFlow(scenarioId) {
    const res = await fetch(`${API_BASE}/evacuate/max-flow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    return res.json();
  },

  async runGreedy(scenarioId) {
    const res = await fetch(`${API_BASE}/evacuate/greedy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    return res.json();
  },

  async compareAll(scenarioId, sourceId = null) {
    const res = await fetch(`${API_BASE}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, source_id: sourceId }),
    });
    return res.json();
  },
};
