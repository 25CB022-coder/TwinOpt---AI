// Digital Twin: build per-location state from predictions

import {
  CampusBlock,
  LocationState,
  PredictionResult,
  CAMPUS_LOCATIONS,
} from "./types";

export function utilization(occupancy: number, capacity: number): number {
  return Math.round((occupancy / Math.max(1, capacity)) * 100 * 10) / 10;
}

export function energyFor(occupancy: number, capacity: number): number {
  return Math.round((occupancy * 0.4 + capacity * 0.02) * 100) / 100;
}

export function stressFromUtil(utilPct: number): "Low" | "Medium" | "High" {
  if (utilPct >= 85) return "High";
  if (utilPct >= 50) return "Medium";
  return "Low";
}

export function buildTwinState(
  predictionsByLocation: Record<string, PredictionResult>
): Record<CampusBlock, LocationState> {
  const state = {} as Record<CampusBlock, LocationState>;
  for (const name of Object.keys(CAMPUS_LOCATIONS) as CampusBlock[]) {
    const info = CAMPUS_LOCATIONS[name];
    const pred = predictionsByLocation[name] || {
      predicted_occupancy: 0,
      energy_demand: 0,
      resource_stress: "Low" as const,
    };
    const occ = pred.predicted_occupancy;
    const energy = pred.energy_demand || energyFor(occ, info.capacity);
    const stress = pred.resource_stress;
    const util = utilization(occ, info.capacity);
    state[name] = {
      type: info.type,
      capacity: info.capacity,
      current_occupancy: Math.round(occ),
      predicted_occupancy: Math.round(occ * 10) / 10,
      utilization: util,
      energy_demand: Math.round(energy * 100) / 100,
      resource_stress: stress,
      x: info.x,
      y: info.y,
    };
  }
  return state;
}

export function defaultTwinState(): Record<CampusBlock, LocationState> {
  const preds: Record<string, PredictionResult> = {};
  for (const [name, info] of Object.entries(CAMPUS_LOCATIONS)) {
    preds[name] = {
      predicted_occupancy: info.capacity * 0.2,
      energy_demand: info.capacity * 0.08,
      resource_stress: "Low",
    };
  }
  return buildTwinState(preds);
}

export const STRESS_COLOR: Record<string, string> = {
  High: "#e74c3c",
  Medium: "#f39c12",
  Low: "#27ae60",
};
