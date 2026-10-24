import { describe, it, expect } from "vitest";
import {
  isWeekend,
  calculateWorkingDays,
  calculateHaversineDistance,
} from "../src/lib/date-utils";

describe("Date & Schedule Utilities", () => {
  it("identifies configured weekends (Saturday & Sunday)", () => {
    // 2026-10-24 is Saturday, 2026-10-25 is Sunday, 2026-10-26 is Monday
    const sat = new Date("2026-10-24T10:00:00Z");
    const sun = new Date("2026-10-25T10:00:00Z");
    const mon = new Date("2026-10-26T10:00:00Z");

    expect(isWeekend(sat, "SATURDAY,SUNDAY")).toBe(true);
    expect(isWeekend(sun, "SATURDAY,SUNDAY")).toBe(true);
    expect(isWeekend(mon, "SATURDAY,SUNDAY")).toBe(false);
  });

  it("calculates working days excluding weekends and public holidays", () => {
    // Monday 2026-10-26 to Friday 2026-10-30 = 5 days
    // Add public holiday on Wednesday 2026-10-28
    const start = new Date("2026-10-26T00:00:00Z");
    const end = new Date("2026-10-30T00:00:00Z");
    const holidays = [{ date: new Date("2026-10-28T00:00:00Z") }];

    const workingDays = calculateWorkingDays(start, end, "SATURDAY,SUNDAY", holidays);
    expect(workingDays).toBe(4);
  });

  it("calculates Haversine distance in meters accurately", () => {
    // Office Karachi (approx 24.8607, 67.0011)
    // Point 100 meters away
    const lat1 = 24.8607;
    const lon1 = 67.0011;
    // Same location distance is 0
    expect(calculateHaversineDistance(lat1, lon1, lat1, lon1)).toBe(0);

    // Nearby coordinates (approx ~111m per 0.001 deg latitude)
    const lat2 = 24.8617;
    const lon2 = 67.0011;
    const dist = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(125);
  });
});
