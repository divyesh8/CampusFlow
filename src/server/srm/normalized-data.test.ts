import { describe, expect, it } from "vitest";
import { normalizeAttendance, normalizeMarks } from "./normalized-data";

describe("SRM normalized data validation", () => {
  it("rejects attendance where absent exceeds conducted", () => {
    expect(() => normalizeAttendance([{ courseCode: "CSE101", courseTitle: "Course", category: "T", facultyName: "F", slot: "A", hoursConducted: "4", hoursAbsent: "5", attendancePercentage: "0" }], "<table>data</table>")).toThrow("SRM_SCHEMA_CHANGED");
  });

  it("keeps absent marks distinct from zero marks", () => {
    const result = normalizeMarks([{ courseCode: "CSE101", courseName: "Course", courseType: "Theory", overall: { scored: "0", total: "10" }, testPerformance: [{ test: "CAT 1", marks: { scored: "Abs", total: "10.00" } }] }], "<table>MARKS</table>");
    expect(result[0]).toMatchObject({ scored: null, absent: true, total: 10 });
  });
});
