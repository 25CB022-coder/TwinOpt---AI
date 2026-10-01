// Campus data types and location definitions for TwinOpt AI

export const CAMPUS_BLOCKS = [
  "Block A",
  "Block B",
  "Block C",
  "Auditorium",
  "Library",
  "Parking Area",
  "Canteen",
] as const;

export type CampusBlock = (typeof CAMPUS_BLOCKS)[number];

export const EVENT_TYPES = [
  "None",
  "Lecture",
  "Workshop",
  "Seminar",
  "Large Event",
  "Exam",
  "Cultural",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface LocationInfo {
  capacity: number;
  x: number;
  y: number;
  type: string;
}

export const CAMPUS_LOCATIONS: Record<CampusBlock, LocationInfo> = {
  "Block A": { capacity: 400, x: 1, y: 3, type: "Classrooms" },
  "Block B": { capacity: 500, x: 3, y: 3, type: "Classrooms" },
  "Block C": { capacity: 350, x: 5, y: 3, type: "Classrooms" },
  Auditorium: { capacity: 1000, x: 3, y: 5, type: "Auditorium" },
  Library: { capacity: 300, x: 1, y: 1, type: "Library" },
  "Parking Area": { capacity: 600, x: 5, y: 1, type: "Parking" },
  Canteen: { capacity: 250, x: 3, y: 1, type: "Canteen" },
};

export interface ScenarioInput {
  num_students: number;
  event_attendance: number;
  time: string; // "HH:MM"
  temperature: number;
  campus_block: CampusBlock;
  event_type: EventType;
}

export interface PredictionResult {
  predicted_occupancy: number;
  energy_demand: number;
  resource_stress: "Low" | "Medium" | "High";
}

export interface LocationState {
  type: string;
  capacity: number;
  current_occupancy: number;
  predicted_occupancy: number;
  utilization: number;
  energy_demand: number;
  resource_stress: "Low" | "Medium" | "High";
  x: number;
  y: number;
}

export interface ResourceRequirement {
  extra_seats: number;
  extra_classrooms: number;
}

export interface ResourceEstimates {
  required_seats: number;
  required_classrooms: number;
  required_electricity_kwh: number;
  parking_requirement: number;
  canteen_load: number;
  facility_load_pct: number;
}

export interface KPIs {
  predicted_occupancy: number;
  energy_demand: number;
  room_utilization: number;
  resource_stress: "Low" | "Medium" | "High";
  predicted_congestion: number;
  resource_requirement: ResourceRequirement;
}

export interface CampusTotals {
  total_occupancy: number;
  total_energy: number;
  avg_utilization: number;
}

export interface SimulationResult {
  block: CampusBlock;
  predictions: PredictionResult;
  twin_state: Record<CampusBlock, LocationState>;
  kpis: KPIs;
  resource_estimates: ResourceEstimates;
  campus_totals: CampusTotals;
}

export interface RecommendationItem {
  level: "Critical" | "Warning" | "OK";
  area: string;
  message: string;
  factor: string;
}

export interface RecommendationResult {
  recommendations: RecommendationItem[];
  verdict: string;
  critical_count: number;
  warning_count: number;
}

export interface SavedScenario {
  id: number;
  scenario_name: string;
  created_at: string;
  inputs: ScenarioInput;
  predictions: PredictionResult;
  simulation: SimulationResult;
  recommendation: RecommendationResult;
}
