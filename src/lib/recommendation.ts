// Decision-support recommendation engine based on simulation values

import { RecommendationItem, RecommendationResult, SimulationResult } from "./types";

export function generateRecommendation(sim: SimulationResult): RecommendationResult {
  const k = sim.kpis;
  const r = sim.resource_estimates;
  const block = sim.block;
  const recs: RecommendationItem[] = [];

  // Venue / occupancy
  const util = k.room_utilization;
  const occ = k.predicted_occupancy;
  if (util >= 85) {
    recs.push({
      level: "Critical",
      area: "Venue",
      message: `High occupancy detected (${Math.round(occ)} at ${Math.round(util)}% utilization in ${block}). Consider a larger venue or split the event.`,
      factor: `Utilization ${Math.round(util)}% >= 85%`,
    });
  } else if (util >= 60) {
    recs.push({
      level: "Warning",
      area: "Venue",
      message: `Moderate occupancy load (${Math.round(util)}% utilization in ${block}). Monitor attendance and prepare overflow seating.`,
      factor: `Utilization ${Math.round(util)}% in 60-85% band`,
    });
  } else {
    recs.push({
      level: "OK",
      area: "Venue",
      message: `Current location ${block} has sufficient capacity (${Math.round(util)}% utilization).`,
      factor: `Utilization ${Math.round(util)}% < 60%`,
    });
  }

  // Energy
  const energy = k.energy_demand;
  if (energy >= 300) {
    recs.push({
      level: "Critical",
      area: "Energy",
      message: `Energy demand is very high (${Math.round(energy)} kWh). Schedule non-critical loads off-peak or activate backup power.`,
      factor: `Energy ${Math.round(energy)} kWh >= 300`,
    });
  } else if (energy >= 150) {
    recs.push({
      level: "Warning",
      area: "Energy",
      message: `Energy demand elevated (${Math.round(energy)} kWh). Verify HVAC capacity for this time period.`,
      factor: `Energy ${Math.round(energy)} kWh in 150-300 band`,
    });
  }

  // Congestion / parking
  const cong = k.predicted_congestion;
  if (cong >= 70) {
    recs.push({
      level: "Critical",
      area: "Traffic",
      message: `Parking congestion may increase sharply (congestion index ${Math.round(cong)}/100). Open overflow parking and stagger arrival times.`,
      factor: `Congestion ${Math.round(cong)} >= 70`,
    });
  } else if (cong >= 40) {
    recs.push({
      level: "Warning",
      area: "Traffic",
      message: `Traffic congestion building (index ${Math.round(cong)}/100). Inform attendees of parking options.`,
      factor: `Congestion ${Math.round(cong)} in 40-70 band`,
    });
  }

  // Resource stress
  if (k.resource_stress === "High") {
    recs.push({
      level: "Critical",
      area: "Resources",
      message: `Resource stress predicted HIGH in ${block}. Additional staff, seating, and supplies may be required.`,
      factor: "ML stress classifier = High",
    });
  } else if (k.resource_stress === "Medium") {
    recs.push({
      level: "Warning",
      area: "Resources",
      message: `Resource stress predicted MEDIUM. Pre-position extra resources for ${block}.`,
      factor: "ML stress classifier = Medium",
    });
  }

  // Capacity deficit
  const extra = k.resource_requirement;
  if (extra.extra_seats > 0) {
    recs.push({
      level: "Critical",
      area: "Capacity",
      message: `Capacity exceeded by ${extra.extra_seats} seats (${extra.extra_classrooms} extra classrooms needed).`,
      factor: `Occupancy ${Math.round(occ)} > capacity`,
    });
  }

  // Parking
  if (r.parking_requirement > 600) {
    recs.push({
      level: "Warning",
      area: "Parking",
      message: `Estimated parking demand ${r.parking_requirement} slots exceeds main lot capacity (600).`,
      factor: `Parking ${r.parking_requirement} > 600`,
    });
  }

  // Canteen
  if (r.canteen_load > 200) {
    recs.push({
      level: "Warning",
      area: "Canteen",
      message: `Canteen load estimated at ${r.canteen_load} occupants. Consider extra food stalls / extended timings.`,
      factor: `Canteen load ${r.canteen_load} > 200`,
    });
  }

  if (recs.length === 0) {
    recs.push({
      level: "OK",
      area: "Overall",
      message: "All indicators within safe range. No special action required.",
      factor: "All metrics below warning thresholds",
    });
  }

  const critical = recs.filter((x) => x.level === "Critical");
  const warnings = recs.filter((x) => x.level === "Warning");
  let verdict: string;
  if (critical.length > 0) verdict = "Risky - revise plan before proceeding";
  else if (warnings.length > 0) verdict = "Feasible with precautions";
  else verdict = "Safe to proceed";

  return {
    recommendations: recs,
    verdict,
    critical_count: critical.length,
    warning_count: warnings.length,
  };
}
