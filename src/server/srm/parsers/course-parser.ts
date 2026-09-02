import * as cheerio from "cheerio";
import type { SRMCourse } from "../academia-config";

function parseRegNumber(html: string): string {
  const match = html.match(/RA2\d{12}/);
  return match ? match[0] : "";
}

function extractCourseTable(html: string): string {
  const tableStart = html.indexOf('class="course_tbl"');
  if (tableStart === -1) return html;

  const start = html.lastIndexOf("<table", tableStart);
  if (start === -1) return html;

  let depth = 0;
  let i = start;
  while (i < html.length) {
    if (html.substring(i, i + 6).toLowerCase() === "<table") depth++;
    if (html.substring(i, i + 7).toLowerCase() === "</table>") {
      depth--;
      if (depth === 0) return html.substring(start, i + 7);
    }
    i++;
  }
  return html.substring(start, Math.min(start + 20000, html.length));
}

export function parseCourses(html: string): {
  regNumber: string;
  courses: SRMCourse[];
} {
  const regNumber = parseRegNumber(html);
  const tableHtml = extractCourseTable(html);
  const $ = cheerio.load(tableHtml);

  const courses: SRMCourse[] = [];

  const rows = $("tr").toArray();

  for (let index = 0; index < rows.length; index++) {
    if (index === 0) continue;

    const cells = $(rows[index]).find("td");
    if (cells.length < 11) continue;

    const values = Array.from(cells).map((cell) => $(cell).text().trim());

    let room = values[9] || "N/A";
    if (room !== "N/A") {
      room = room.charAt(0).toUpperCase() + room.slice(1);
    }
    const slot = values[8].replace(/-$/, "");

    courses.push({
      code: values[1],
      title: values[2].split(" \u2013")[0],
      credit: values[3] || "N/A",
      category: values[4],
      courseCategory: values[5],
      type: values[6] || "N/A",
      slotType: slot.includes("P") ? "Practical" : "Theory",
      faculty: values[7] || "N/A",
      slot,
      room,
      academicYear: values[10],
    });
  }

  return { regNumber, courses };
}
