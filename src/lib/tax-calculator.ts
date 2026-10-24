/**
 * HCM Lite — Tax & Salary Calculation Engine
 * 
 * Slabs (Annualized Gross in PKR):
 * - Up to 600,000: 0%
 * - > 600,000 to 1,200,000: 5% of excess over 600,000
 * - > 1,200,000 to 2,400,000: 30,000 + 15% of excess over 1,200,000
 * - > 2,400,000 to 3,600,000: 210,000 + 25% of excess over 2,400,000
 * - > 3,600,000: 510,000 + 35% of excess over 3,600,000
 * 
 * Monthly tax deduction = Annual tax / 12
 */

export interface SalaryBreakdown {
  basicSalary: number;
  hraAllowance: number;
  medicalAllowance: number;
  grossSalary: number;
}

export function computeSalaryBreakdown(basicSalary: number): SalaryBreakdown {
  const basic = Math.round(Number(basicSalary) * 100) / 100;
  const hra = Math.round(basic * 0.4 * 100) / 100;
  const medical = Math.round(basic * 0.1 * 100) / 100;
  const gross = Math.round((basic + hra + medical) * 100) / 100; // equals 1.5 * basic

  return {
    basicSalary: basic,
    hraAllowance: hra,
    medicalAllowance: medical,
    grossSalary: gross,
  };
}

export function computeAnnualTax(annualGross: number): number {
  if (annualGross <= 600_000) {
    return 0;
  }
  if (annualGross <= 1_200_000) {
    return Math.round((annualGross - 600_000) * 0.05);
  }
  if (annualGross <= 2_400_000) {
    return Math.round(30_000 + (annualGross - 1_200_000) * 0.15);
  }
  if (annualGross <= 3_600_000) {
    return Math.round(210_000 + (annualGross - 2_400_000) * 0.25);
  }
  return Math.round(510_000 + (annualGross - 3_600_000) * 0.35);
}

export function computeMonthlyTax(monthlyGross: number): number {
  const annualGross = monthlyGross * 12;
  const annualTax = computeAnnualTax(annualGross);
  return Math.round((annualTax / 12) * 100) / 100;
}

export interface PayrollCalculationInput {
  basicSalary: number;
  workingDaysInMonth: number;
  absentDays: number;
  unpaidLeaveDays: number;
  halfDays: number;
  joiningDate?: Date;
  exitDate?: Date | null;
  payrollMonth: number; // 1-12
  payrollYear: number;
}

export interface PayrollCalculationResult {
  basicSalary: number;
  hraAllowance: number;
  medicalAllowance: number;
  grossSalary: number;
  workingDaysInMonth: number;
  perDaySalary: number;
  daysDeducted: number;
  attendanceDeductions: number;
  taxDeduction: number;
  netSalary: number;
}

export function calculateEmployeePayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const { basicSalary, hraAllowance, medicalAllowance, grossSalary } = computeSalaryBreakdown(input.basicSalary);
  
  const workingDays = Math.max(1, input.workingDaysInMonth);
  const perDaySalary = Math.round((grossSalary / workingDays) * 100) / 100;
  
  // Deductions: 1 day for each absent, 1 day for each unpaid leave, 0.5 day for each half-day
  const daysDeducted = input.absentDays + input.unpaidLeaveDays + (input.halfDays * 0.5);
  const rawAttendanceDeductions = Math.round(daysDeducted * perDaySalary * 100) / 100;
  const attendanceDeductions = Math.min(grossSalary, rawAttendanceDeductions);
  
  // Tax is computed on the taxable gross
  const taxableGross = Math.max(0, grossSalary - attendanceDeductions);
  const taxDeduction = computeMonthlyTax(taxableGross);
  
  const netSalary = Math.max(0, Math.round((grossSalary - attendanceDeductions - taxDeduction) * 100) / 100);

  return {
    basicSalary,
    hraAllowance,
    medicalAllowance,
    grossSalary,
    workingDaysInMonth: workingDays,
    perDaySalary,
    daysDeducted,
    attendanceDeductions,
    taxDeduction,
    netSalary,
  };
}
