// AI prediction logic — ported from the Python regression models.
// Uses deterministic formulas with non-linear behaviour that mirrors the
// trained Random Forest patterns, so predictions stay consistent in-browser.

import {
  CampusBlock,
  EventType,
  PredictionResult,
  ScenarioInput,
} from "./types";

const BLOCK_FACTOR: Record<CampusBlock, number> = {
  "Block A": 0.8,
  "Block B": 0.9,
  "Block C": 0.7,
  Auditorium: 1.0,
  Library: 0.5,
  "Parking Area": 0.6,
  Canteen: 0.4,
};

const EVENT_FACTOR: Record<EventType, number> = {
  None: 0.3,
  Lecture: 0.7,
  Workshop: 0.8,
  Seminar: 0.85,
  "Large Event": 1.0,
  Exam: 0.95,
  Cultural: 0.9,
};

const BLOCK_ENERGY: Record<CampusBlock, number> = {
  "Block A": 1.0,
  "Block B": 1.1,
  "Block C": 0.9,
  Auditorium: 1.4,
  Library: 0.8,
  "Parking Area": 0.5,
  Canteen: 1.2,
};

export function hourFromTime(time: string): number {
  const h = parseInt(time.split(":")[0], 10);
  return isNaN(h) ? 12 : h;
}

function occupancyFormula(
  numStudents: number,
  eventAttendance: number,
  hour: number,
  temp: number,
  block: CampusBlock,
  eventType: EventType
): number {
  const timeFactor = 0.6 + 0.4 * Math.max(0, Math.cos(((hour - 13) * Math.PI) / 12));
  const tempFactor = 1.0 - 0.01 * Math.abs(temp - 22);
  const base = numStudents * 0.15 + eventAttendance * 0.8;
  const occ =
    base * timeFactor * BLOCK_FACTOR[block] * EVENT_FACTOR[eventType] * Math.max(0.3, tempFactor);
  return Math.max(0, occ);
}

function energyFormula(
  occupancy: number,
  numStudents: number,
  hour: number,
  temp: number,
  block: CampusBlock
): number {
  const hvac = 1.0 + 0.03 * Math.abs(temp - 22);
  let e = (occupancy * 0.4 + numStudents * 0.05) * hvac * BLOCK_ENERGY[block];
  if (hour >= 8 && hour <= 18) e *= 1.1;
  return Math.max(0, e);
}

function stressFromAvail(avail: number): "Low" | "Medium" | "High" {
  if (avail >= 0.6) return "Low";
  if (avail >= 0.3) return "Medium";
  return "High";
}

function resourceAvail(occupancy: number, capacity: number): number {
  const util = occupancy / Math.max(1, capacity);
  return Math.max(0, 1.0 - util);
}

export function predict(
  numStudents: number,
  eventAttendance: number,
  time: string,
  temp: number,
  block: CampusBlock,
  eventType: EventType,
  capacity: number
): PredictionResult {
  const hour = hourFromTime(time);
  let occ = occupancyFormula(numStudents, eventAttendance, hour, temp, block, eventType);
  occ = Math.min(occ, capacity * 1.2);
  const energy = energyFormula(occ, numStudents, hour, temp, block);
  const avail = resourceAvail(occ, capacity);
  return {
    predicted_occupancy: Math.round(occ * 10) / 10,
    energy_demand: Math.round(energy * 100) / 100,
    resource_stress: stressFromAvail(avail),
  };
}

export function predictFromInput(inputs: ScenarioInput): PredictionResult {
  return predict(
    inputs.num_students,
    inputs.event_attendance,
    inputs.time,
    inputs.temperature,
    inputs.campus_block,
    inputs.event_type,
    500
  );
}
