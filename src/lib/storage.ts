// Input validation and localStorage-based scenario history

import {
  CAMPUS_BLOCKS,
  CampusBlock,
  EVENT_TYPES,
  EventType,
  SavedScenario,
  ScenarioInput,
} from "./types";

const STORAGE_KEY = "twinopt_history";
let idCounter = 0;

export function validateInputs(inputs: ScenarioInput): string[] {
  const errors: string[] = [];
  if (inputs.num_students < 0) errors.push("Number of students cannot be negative.");
  if (inputs.num_students > 2000) errors.push("Number of students exceeds reasonable limit (2000).");
  if (inputs.event_attendance < 0) errors.push("Event attendance cannot be negative.");
  if (inputs.event_attendance > inputs.num_students + 500)
    errors.push("Event attendance is unrealistically high vs. student count.");
  const h = parseInt(inputs.time.split(":")[0], 10);
  if (isNaN(h) || h < 6 || h > 22)
    errors.push("Time should be between 06:00 and 22:00.");
  if (!CAMPUS_BLOCKS.includes(inputs.campus_block as CampusBlock))
    errors.push("Invalid campus location.");
  if (!EVENT_TYPES.includes(inputs.event_type as EventType))
    errors.push("Invalid event type.");
  if (inputs.temperature < 0 || inputs.temperature > 55)
    errors.push("Temperature out of plausible range (0-55°C).");
  return errors;
}

export function getHistory(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedScenario[];
    idCounter = arr.length > 0 ? Math.max(...arr.map((s) => s.id)) : 0;
    return arr;
  } catch {
    return [];
  }
}

export function saveScenario(
  name: string,
  inputs: ScenarioInput,
  predictions: SavedScenario["predictions"],
  simulation: SavedScenario["simulation"],
  recommendation: SavedScenario["recommendation"]
): SavedScenario {
  const history = getHistory();
  idCounter += 1;
  const record: SavedScenario = {
    id: idCounter,
    scenario_name: name,
    created_at: new Date().toLocaleString(),
    inputs,
    predictions,
    simulation,
    recommendation,
  };
  history.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return record;
}

export function deleteScenario(id: number): void {
  const history = getHistory().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
