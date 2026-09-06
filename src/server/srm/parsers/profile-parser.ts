import * as cheerio from "cheerio";
import type { SRMStudentProfile } from "../academia-config";

export function parseStudentProfile(html: string): SRMStudentProfile {
  const $ = cheerio.load(html);
  $("script, style").remove();
  const fields = new Map<string, string>();
  $("tr").each((_, row) => {
    const cells = $(row).children("th, td");
    for (let i = 0; i + 1 < cells.length; i += 2) {
      const key = $(cells[i]).text().replace(/\s+/g, " ").trim().replace(/\s*:$/, "").toLowerCase();
      const value = $(cells[i + 1]).text().replace(/\s+/g, " ").trim();
      if (value && !fields.has(key)) fields.set(key, value);
    }
  });
  const field = (...keys: string[]) => keys.map((key) => fields.get(key)).find(Boolean) ?? null;
  const regNumber = field("register number", "registration number", "reg no", "reg number", "roll number")
    ?? $.root().text().match(/\bRA\d{13}\b/i)?.[0] ?? "";
  const semester = field("semester");
  const department = field("department");
  return {
    name: field("name", "student name") ?? "", regNumber: regNumber.toUpperCase(),
    program: field("program", "programme"),
    department: department?.replace(/\s*-?\s*\([^)]*section\)\s*$/i, "").trim() ?? null,
    semester: semester && /^\d{1,2}$/.test(semester) ? Number(semester) : null,
    section: field("section") ?? department?.match(/\(([^)]+?)\s*section\)/i)?.[1].trim() ?? null,
    batch: field("combo / batch", "batch"), mobile: field("mobile", "mobile number"),
  };
}

