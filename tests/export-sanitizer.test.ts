import { describe, it, expect } from "vitest";
import { sanitizeCsvCell, buildSafeCsvRow } from "../src/lib/export-sanitizer";

describe("CSV Formula Injection Protection", () => {
  it("prefixes dangerous formula trigger characters with a single quote", () => {
    expect(sanitizeCsvCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    expect(sanitizeCsvCell("+12345678")).toBe("'+12345678");
    expect(sanitizeCsvCell("-cmd|' /C calc'!A0")).toBe("'-cmd|' /C calc'!A0");
    expect(sanitizeCsvCell("@SUM(1+1)")).toBe("'@SUM(1+1)");
  });

  it("leaves normal strings and values untouched", () => {
    expect(sanitizeCsvCell("EMP-001")).toBe("EMP-001");
    expect(sanitizeCsvCell("John Doe")).toBe("John Doe");
    expect(sanitizeCsvCell("john@company.com")).toBe("john@company.com");
    expect(sanitizeCsvCell(150000)).toBe("150000");
  });

  it("builds safe CSV rows with escaped double quotes", () => {
    const row = buildSafeCsvRow(["EMP-001", "Jane, Doe", "=1+1", 'Contains "quotes"']);
    expect(row).toBe('"EMP-001","Jane, Doe","\'=1+1","Contains ""quotes"""');
  });
});
