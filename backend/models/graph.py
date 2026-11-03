import math
from typing import Dict, List, Optional, Tuple, Any

class Node:
    def __init__(
        self,
        node_id: str,
        name: str,
        lat: float,
        lng: float,
        node_type: str = "junction",  # "zone", "junction", "shelter"
        population: int = 0,
        capacity: int = 0,
        current_occupancy: int = 0,
        description: str = ""
    ):
        self.id = node_id
        self.name = name
        self.lat = lat
        self.lng = lng
        self.type = node_type
        self.population = population
        self.capacity = capacity
        self.current_occupancy = current_occupancy
        self.description = description
        self.in_hazard_zone = False
        self.hazard_severity = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "lat": self.lat,
            "lng": self.lng,
            "type": self.type,
            "population": self.population,
            "capacity": self.capacity,
            "current_occupancy": self.current_occupancy,
            "available_capacity": max(0, self.capacity - self.current_occupancy) if self.type == "shelter" else 0,
            "description": self.description,
            "in_hazard_zone": self.in_hazard_zone,
            "hazard_severity": self.hazard_severity
        }


class Edge:
    def __init__(
        self,
        edge_id: str,
        source: str,
        target: str,
        distance_km: float,
        capacity_flow: int = 500,  # Max persons/vehicles per hour
        status: str = "open",       # "open", "blocked", "flooded", "fire_damaged", "collapsed"
        bidirectional: bool = True,
        risk_factor: float = 1.0,
        speed_kmh: float = 40.0
    ):
        self.id = edge_id
        self.source = source
        self.target = target
        self.distance_km = distance_km
        self.capacity_flow = capacity_flow
        self.current_flow = 0
        self.status = status
        self.bidirectional = bidirectional
        self.risk_factor = risk_factor
        self.speed_kmh = speed_kmh
        self.is_bottleneck = False

    @property
    def is_passable(self) -> bool:
        return self.status == "open"

    @property
    def effective_weight(self) -> float:
        """Effective travel cost considering distance and hazard risk."""
        if not self.is_passable:
            return float('inf')
        return self.distance_km * self.risk_factor

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "source": self.source,
            "target": self.target,
            "distance_km": round(self.distance_km, 2),
            "capacity_flow": self.capacity_flow,
            "current_flow": self.current_flow,
            "status": self.status,
            "bidirectional": self.bidirectional,
            "risk_factor": round(self.risk_factor, 2),
            "effective_weight": round(self.effective_weight, 2) if self.effective_weight != float('inf') else None,
            "speed_kmh": self.speed_kmh,
            "is_bottleneck": self.is_bottleneck
        }


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points in kilometers."""
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def point_to_segment_distance(
    px: float, py: float,
    x1: float, y1: float,
    x2: float, y2: float
) -> float:
    """Computes approx distance in km from point (px, py) to line segment (x1, y1)-(x2, y2)."""
    # For local city scale, equirectangular projection approximation is fast and accurate
    # lat = y, lng = x
    # Average latitude for scaling longitude
    mid_lat = math.radians((y1 + y2 + py) / 3.0)
    kx = 111.32 * math.cos(mid_lat)
    ky = 110.574

    # Convert coordinates to km relative to (x1, y1)
    px_km = (px - x1) * kx
    py_km = (py - y1) * ky
    dx_km = (x2 - x1) * kx
    dy_km = (y2 - y1) * ky

    seg_len_sq = dx_km * dx_km + dy_km * dy_km
    if seg_len_sq == 0:
        return math.sqrt(px_km * px_km + py_km * py_km)

    t = max(0.0, min(1.0, (px_km * dx_km + py_km * dy_km) / seg_len_sq))
    proj_x = t * dx_km
    proj_y = t * dy_km

    diff_x = px_km - proj_x
    diff_y = py_km - proj_y
    return math.sqrt(diff_x * diff_x + diff_y * diff_y)


class CityGraph:
    def __init__(self, scenario_id: str = "default", name: str = "City Network"):
        self.scenario_id = scenario_id
        self.name = name
        self.nodes: Dict[str, Node] = {}
        self.edges: Dict[str, Edge] = {}
        self.adj: Dict[str, List[Edge]] = {}
        self.disaster_zones: List[Dict[str, Any]] = []

    def add_node(self, node: Node):
        self.nodes[node.id] = node
        if node.id not in self.adj:
            self.adj[node.id] = []

    def add_edge(self, edge: Edge):
        self.edges[edge.id] = edge
        if edge.source not in self.adj:
            self.adj[edge.source] = []
        self.adj[edge.source].append(edge)

        if edge.bidirectional:
            if edge.target not in self.adj:
                self.adj[edge.target] = []
            # We add reference so traversal knows reverse path
            self.adj[edge.target].append(edge)

    def get_shelters(self) -> List[Node]:
        return [node for node in self.nodes.values() if node.type == "shelter"]

    def get_evacuation_zones(self) -> List[Node]:
        return [node for node in self.nodes.values() if node.type == "zone" and node.population > 0]

    def get_neighbors(self, node_id: str, include_blocked: bool = False) -> List[Tuple[str, Edge]]:
        """Returns list of (neighbor_id, edge) for a given node."""
        neighbors = []
        if node_id not in self.adj:
            return neighbors

        for edge in self.adj[node_id]:
            if not include_blocked and not edge.is_passable:
                continue

            if edge.source == node_id:
                neighbors.append((edge.target, edge))
            elif edge.bidirectional and edge.target == node_id:
                neighbors.append((edge.source, edge))
        return neighbors

    def toggle_edge_block(self, edge_id: str, new_status: Optional[str] = None) -> bool:
        """Toggles or sets the status of an edge."""
        if edge_id not in self.edges:
            return False
        edge = self.edges[edge_id]
        if new_status:
            edge.status = new_status
        else:
            edge.status = "blocked" if edge.status == "open" else "open"
        return True

    def reset_flows(self):
        """Reset flow allocation on all edges."""
        for edge in self.edges.values():
            edge.current_flow = 0
            edge.is_bottleneck = False
        for node in self.nodes.values():
            if node.type == "shelter":
                node.current_occupancy = 0

    def apply_disasters(self, disasters: List[Dict[str, Any]]):
        """
        Applies a list of disaster epicenters to the network.
        Each disaster: {
            id: str,
            type: "flood" | "fire" | "earthquake",
            lat: float,
            lng: float,
            radius_km: float,
            severity: float (0.0 to 1.0)
        }
        """
        self.disaster_zones = disasters

        # Reset all nodes and edges to default state before re-evaluating
        for node in self.nodes.values():
            node.in_hazard_zone = False
            node.hazard_severity = 0.0

        for edge in self.edges.values():
            edge.status = "open"
            edge.risk_factor = 1.0

        for disaster in disasters:
            d_lat = disaster.get("lat", 0.0)
            d_lng = disaster.get("lng", 0.0)
            radius = disaster.get("radius_km", 1.0)
            severity = disaster.get("severity", 0.5)
            d_type = disaster.get("type", "flood")

            # Check nodes
            for node in self.nodes.values():
                dist = haversine_distance(d_lat, d_lng, node.lat, node.lng)
                if dist <= radius:
                    node.in_hazard_zone = True
                    # Higher proximity = higher hazard severity
                    node_sev = severity * (1.0 - (dist / (radius + 0.001)) * 0.5)
                    node.hazard_severity = max(node.hazard_severity, node_sev)

            # Check edges
            for edge in self.edges.values():
                src = self.nodes.get(edge.source)
                dst = self.nodes.get(edge.target)
                if not src or not dst:
                    continue

                dist_to_road = point_to_segment_distance(
                    d_lng, d_lat,
                    src.lng, src.lat,
                    dst.lng, dst.lat
                )

                if dist_to_road <= radius:
                    # In core danger radius: block road or increase risk
                    impact_ratio = 1.0 - (dist_to_road / (radius + 0.001))
                    if impact_ratio > 0.45 or severity >= 0.75:
                        edge.status = "flooded" if d_type == "flood" else ("fire_damaged" if d_type == "fire" else "collapsed")
                    else:
                        edge.risk_factor = max(edge.risk_factor, 1.0 + (severity * 3.0 * impact_ratio))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scenario_id": self.scenario_id,
            "name": self.name,
            "nodes": [node.to_dict() for node in self.nodes.values()],
            "edges": [edge.to_dict() for edge in self.edges.values()],
            "disasters": self.disaster_zones,
            "statistics": {
                "total_nodes": len(self.nodes),
                "total_edges": len(self.edges),
                "total_population": sum(n.population for n in self.nodes.values() if n.type == "zone"),
                "total_shelter_capacity": sum(n.capacity for n in self.nodes.values() if n.type == "shelter"),
                "blocked_edges": sum(1 for e in self.edges.values() if not e.is_passable)
            }
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CityGraph":
        graph = cls(
            scenario_id=data.get("scenario_id", "custom"),
            name=data.get("name", "Custom Scenario")
        )
        for n_data in data.get("nodes", []):
            node = Node(
                node_id=n_data["id"],
                name=n_data.get("name", n_data["id"]),
                lat=n_data["lat"],
                lng=n_data["lng"],
                node_type=n_data.get("type", "junction"),
                population=n_data.get("population", 0),
                capacity=n_data.get("capacity", 0),
                current_occupancy=n_data.get("current_occupancy", 0),
                description=n_data.get("description", "")
            )
            graph.add_node(node)

        for e_data in data.get("edges", []):
            edge = Edge(
                edge_id=e_data["id"],
                source=e_data["source"],
                target=e_data["target"],
                distance_km=float(e_data["distance_km"]),
                capacity_flow=int(e_data.get("capacity_flow", 500)),
                status=e_data.get("status", "open"),
                bidirectional=e_data.get("bidirectional", True),
                risk_factor=float(e_data.get("risk_factor", 1.0)),
                speed_kmh=float(e_data.get("speed_kmh", 40.0))
            )
            graph.add_edge(edge)

        if "disasters" in data and data["disasters"]:
            graph.apply_disasters(data["disasters"])

        return graph
