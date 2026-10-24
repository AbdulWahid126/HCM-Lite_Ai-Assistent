/**
 * Sanitizes CSV cell values to prevent CSV / Formula Injection (CWE-1236)
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value).trim();
  const dangerousPrefixes = ["=", "+", "-", "@", "\t", "\r"];

  if (dangerousPrefixes.some((prefix) => str.startsWith(prefix))) {
    return `'${str}`;
  }
  return str;
}

export function buildSafeCsvRow(cells: unknown[]): string {
  return cells
    .map((cell) => {
      const sanitized = sanitizeCsvCell(cell);
      // Escape double quotes
      const escaped = sanitized.replace(/"/g, '""');
      return `"${escaped}"`;
    })
    .join(",");
}
