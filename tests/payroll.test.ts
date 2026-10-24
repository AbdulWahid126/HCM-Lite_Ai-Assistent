import { describe, it, expect } from "vitest";
import {
  computeSalaryBreakdown,
  computeAnnualTax,
  computeMonthlyTax,
  calculateEmployeePayroll,
} from "../src/lib/tax-calculator";

describe("Salary Breakdown Calculations", () => {
  it("calculates HRA (40%), Medical (10%), and Gross (1.5x) correctly", () => {
    const basic = 100_000;
    const breakdown = computeSalaryBreakdown(basic);

    expect(breakdown.basicSalary).toBe(100_000);
    expect(breakdown.hraAllowance).toBe(40_000);
    expect(breakdown.medicalAllowance).toBe(10_000);
    expect(breakdown.grossSalary).toBe(150_000); // 1.5 * basic
  });
});

describe("Annual Tax Slab Calculations", () => {
  it("taxes 0% for annual gross up to 600,000", () => {
    expect(computeAnnualTax(500_000)).toBe(0);
    expect(computeAnnualTax(600_000)).toBe(0);
  });

  it("taxes 5% of amount exceeding 600,000 up to 1,200,000", () => {
    // 800,000 -> (800,000 - 600,000) * 0.05 = 200,000 * 0.05 = 10,000
    expect(computeAnnualTax(800_000)).toBe(10_000);
    // 1,200,000 -> 600,000 * 0.05 = 30,000
    expect(computeAnnualTax(1_200_000)).toBe(30_000);
  });

  it("taxes 30,000 + 15% of amount exceeding 1,200,000 up to 2,400,000", () => {
    // 1,800,000 -> 30,000 + (600,000 * 0.15) = 30,000 + 90,000 = 120,000
    expect(computeAnnualTax(1_800_000)).toBe(120_000);
  });

  it("taxes 210,000 + 25% of amount exceeding 2,400,000 up to 3,600,000", () => {
    // 3,000,000 -> 210,000 + (600,000 * 0.25) = 210,000 + 150,000 = 360,000
    expect(computeAnnualTax(3_000_000)).toBe(360_000);
  });

  it("taxes 510,000 + 35% of amount exceeding 3,600,000", () => {
    // 4,000,000 -> 510,000 + (400,000 * 0.35) = 510,000 + 140,000 = 650,000
    expect(computeAnnualTax(4_000_000)).toBe(650_000);
  });
});

describe("Payroll Deductions & Net Salary", () => {
  it("deducts absent days, unpaid leave, and half-days proportionally", () => {
    // Basic = 100,000 -> Gross = 150,000
    // Working days = 20 -> Per-day = 7,500
    // Deductions: 1 absent (7,500) + 1 unpaid (7,500) + 2 half-days (7,500 * 0.5 * 2 = 7,500) = 22,500
    const result = calculateEmployeePayroll({
      basicSalary: 100_000,
      workingDaysInMonth: 20,
      absentDays: 1,
      unpaidLeaveDays: 1,
      halfDays: 2,
      payrollMonth: 10,
      payrollYear: 2026,
    });

    expect(result.grossSalary).toBe(150_000);
    expect(result.perDaySalary).toBe(7_500);
    expect(result.daysDeducted).toBe(3); // 1 + 1 + 0.5*2
    expect(result.attendanceDeductions).toBe(22_500);
    
    // Taxable gross = 150,000 - 22,500 = 127,500
    // Annualized = 127,500 * 12 = 1,530,000
    // Tax = 30,000 + (1,530,000 - 1,200,000) * 0.15 = 30,000 + 49,500 = 79,500
    // Monthly Tax = 79,500 / 12 = 6,625
    expect(result.taxDeduction).toBe(6_625);
    expect(result.netSalary).toBe(150_000 - 22_500 - 6_625);
  });
});
