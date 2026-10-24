# HCM Lite — Engineering Rules & Constraints

1. **Zero Fakes Rule**: No hardcoded mock metrics, no synthetic chart values, no fake AI answers. Everything must originate from real persistent database records and honest API calls.
2. **Server-Side Enforcement**: Never trust client inputs or UI button states. All authorizations, validations, and timestamps must be determined strictly on the server.
3. **Data Scoping**: An employee must never access another employee's records. Enforce `recordScope` checks in every API and AI tool.
4. **Formula Injection Defense**: All CSV exports must prefix any cell starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with a single quote `'`.
5. **Precision Arithmetic**: Monetary calculations (salary, tax, deductions) must use deterministic integer or rounded 2-decimal calculations to prevent floating-point drift.
6. **Immutable Audit Trail**: All mutations to employees, salaries, attendance corrections, leave statuses, payroll, and organization settings must generate permanent audit log entries that cannot be edited or deleted.
7. **Graceful Degradation**: If an external LLM API key is not configured or times out (15s limit), the system must provide a clear error or fallback without breaking core HR operations.
8. **Safe Transactions**: Multi-table operations (payroll draft generation, finalization, CSV import) must execute within Prisma transactions (`prisma.$transaction`).
