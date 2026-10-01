// What-If Simulator: compute campus-wide outcomes for a scenario input

import { predict, hourFromTime } from "./aiModel";
import {
  CAMPUS_BLOCKS,
  CAMPUS_LOCATIONS,
  CampusBlock,
  KPIs,
  ResourceEstimates,
  ResourceRequirement,
  ScenarioInput,
  SimulationResult,
  CampusTotals,
} from "./types";
import { buildTwinState, utilization } from "./digitalTwin";

function traffic(occupancy: number, eventAttendance: number, hour: number, block: string): number {
  const rush = [8, 9, 16, 17, 18].includes(hour) ? 1.3 : 1.0;
  let t = (occupancy * 0.3 + eventAttendance * 0.5) * rush;
  if (block === "Parking Area") t *= 1.4;
  return Math.min(100, Math.round(t * 100) / 100);
}

function resourceRequirement(occupancy: number, capacity: number): ResourceRequirement {
  const deficit = Math.max(0, Math.round(occupancy - capacity));
  return {
    extra_seats: deficit,
    extra_classrooms: Math.ceil(deficit / 50),
  };
}

export function runSimulation(inputs: ScenarioInput): SimulationResult {
  const block = inputs.campus_block;
  const capacity = CAMPUS_LOCATIONS[block].capacity;

  // Core ML prediction at the target location
  const core = predict(
    inputs.num_students,
    inputs.event_attendance,
    inputs.time,
    inputs.temperature,
    block,
    inputs.event_type,
    capacity
  );

  // Distribute spillover across campus
  const preds: Record<string, typeof core> = {};
  for (const name of CAMPUS_BLOCKS) {
    if (name === block) {
      preds[name] = core;
    } else {
      const info = CAMPUS_LOCATIONS[name];
      preds[name] = predict(
        Math.round(inputs.num_students * 0.4),
        Math.round(inputs.event_attendance * 0.15),
        inputs.time,
        inputs.temperature,
        name,
        inputs.event_type,
        info.capacity
      );
    }
  }

  const twinState = buildTwinState(preds);
  const hour = hourFromTime(inputs.time);
  const main = twinState[block];
  const occupancy = main.predicted_occupancy;
  const energy = main.energy_demand;
  const util = main.utilization;
  const stress = main.resource_stress;
  const cong = traffic(occupancy, inputs.event_attendance, hour, block);
  const resourceReq = resourceRequirement(occupancy, capacity);

  const requiredSeats = Math.ceil(occupancy);
  const requiredClassrooms = Math.ceil(occupancy / 50);
  const requiredElectricity = Math.round(energy * 100) / 100;
  const parkingReq = Math.ceil(inputs.num_students * 0.3 + inputs.event_attendance * 0.5);
  const canteenLoad = Math.ceil(occupancy * 0.3);
  const facilityLoadPct = Math.min(100, Math.round((occupancy / capacity) * 100 * 10) / 10);

  const totalOccupancy = Object.values(twinState).reduce((s, v) => s + v.current_occupancy, 0);
  const totalEnergy = Math.round(Object.values(twinState).reduce((s, v) => s + v.energy_demand, 0) * 100) / 100;
  const avgUtil = Math.round((Object.values(twinState).reduce((s, v) => s + v.utilization, 0) / Object.keys(twinState).length) * 10) / 10;

  const kpis: KPIs = {
    predicted_occupancy: occupancy,
    energy_demand: energy,
    room_utilization: util,
    resource_stress: stress,
    predicted_congestion: cong,
    resource_requirement: resourceReq,
  };

  const resourceEstimates: ResourceEstimates = {
    required_seats: requiredSeats,
    required_classrooms: requiredClassrooms,
    required_electricity_kwh: requiredElectricity,
    parking_requirement: parkingReq,
    canteen_load: canteenLoad,
    facility_load_pct: facilityLoadPct,
  };

  const campusTotals: CampusTotals = {
    total_occupancy: totalOccupancy,
    total_energy: totalEnergy,
    avg_utilization: avgUtil,
  };

  return {
    block,
    predictions: core,
    twin_state: twinState,
    kpis,
    resource_estimates: resourceEstimates,
    campus_totals: campusTotals,
  };
}
