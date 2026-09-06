import { describe, expect, it } from "vitest";
import { parseStudentProfile } from "./profile-parser";

describe("SRM profile parser", () => {
  it("normalizes labelled fields and preserves optional absence as null", () => {
    const html = `<table><tr><td>Name:</td><td> Ada Student </td><td>Register Number:</td><td>RA2412345678901</td></tr>
      <tr><td>Program:</td><td>B.Tech CSE</td><td>Department:</td><td>Computing - (A Section)</td></tr>
      <tr><td>Semester:</td><td>3</td><td>Combo / Batch:</td><td>2024-2028</td></tr></table>`;
    expect(parseStudentProfile(html)).toMatchObject({ name: "Ada Student", regNumber: "RA2412345678901",
      program: "B.Tech CSE", department: "Computing", semester: 3, section: "A", batch: "2024-2028", mobile: null });
  });

  it("does not accept values from script markup", () => {
    const profile = parseStudentProfile(`<script>name=\"Fake\";reg=\"RA2412345678901\"</script><p>Not a profile</p>`);
    expect(profile.name).toBe("");
    expect(profile.regNumber).toBe("");
  });
});
