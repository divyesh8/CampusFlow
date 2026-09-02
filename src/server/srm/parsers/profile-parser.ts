import * as cheerio from "cheerio";
import type { SRMStudentProfile } from "../academia-config";

function parseRegNumber(html: string): string {
  const match = html.match(/RA2\d{12}/);
  return match ? match[0] : "";
}

function parseIntSafe(value: string): number {
  const match = value.match(/\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function parseStudentProfile(html: string): SRMStudentProfile {
  const $ = cheerio.load(html);
  const regNumber = parseRegNumber(html);

  const profile: SRMStudentProfile = {
    name: "",
    regNumber,
    program: "",
    department: "",
    semester: 0,
    section: "",
    batch: "",
    mobile: "",
  };

  const userTable = $('table[style*="width:900px"]')
    .first()
    .find("tr");

  userTable.each(function () {
    const cells = $(this).find("td");
    for (let i = 0; i < cells.length; i += 2) {
      if (i + 1 >= cells.length) continue;

      const key = $(cells[i])
        .text()
        .trim()
        .replace(/:$/, "");
      const value = $(cells[i + 1]).text().trim();

      switch (key) {
        case "Name":
          profile.name = value;
          break;
        case "Program":
          profile.program = value;
          break;
        case "Combo / Batch": {
          const font = $(cells[i + 1]).find("font");
          profile.batch = font.length ? font.text().trim() : value;
          break;
        }
        case "Mobile":
          profile.mobile = value;
          break;
        case "Semester":
          profile.semester = parseIntSafe(value);
          break;
        case "Department": {
          const parts = value.split("-", 1);
          profile.department = parts[0]?.trim() || "";
          if (value.includes("-")) {
            const sectionMatch = value.match(
              /\(([^)]+)\s*Section\)/
            );
            if (sectionMatch) {
              profile.section = sectionMatch[1].trim();
            }
          }
          break;
        }
      }
    }
  });

  if (!profile.name) {
    const nameMatch = html.match(/Name[^<]*<[^>]*>([^<]+)/i);
    if (nameMatch) {
      profile.name = nameMatch[1].trim();
    }
  }

  return profile;
}
