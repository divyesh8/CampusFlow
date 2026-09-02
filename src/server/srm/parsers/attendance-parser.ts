import * as cheerio from "cheerio";
import type { SRMAttendance } from "../academia-config";

function parseIntSafe(value: string): number {
  const match = value.match(/\s*(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseRegNumber(html: string): string {
  const match = html.match(/RA2\d{12}/);
  return match ? match[0] : "";
}

function extractAttendanceTable(html: string): string {
  const tableStart = html.indexOf(
    '<table style="font-size :16px;" border="1"'
  );
  if (tableStart === -1) return html;

  let depth = 0;
  let i = tableStart;
  while (i < html.length) {
    if (html.substring(i, i + 6).toLowerCase() === "<table") depth++;
    if (html.substring(i, i + 7).toLowerCase() === "</table>") {
      depth--;
      if (depth === 0) return html.substring(tableStart, i + 7);
    }
    i++;
  }
  return html.substring(tableStart, Math.min(tableStart + 10000, html.length));
}

function extractMarksFragment(html: string): string {
  const marksIndex = html.indexOf("MARKS");
  if (marksIndex === -1) return "";

  const start = html.lastIndexOf("<table", marksIndex);
  if (start === -1) return "";

  return html.substring(start, Math.min(start + 50000, html.length));
}

export function parseAttendance(html: string): {
  regNumber: string;
  attendance: SRMAttendance[];
} {
  const regNumber = parseRegNumber(html);
  const tableHtml = extractAttendanceTable(html);
  const $ = cheerio.load(tableHtml);

  const attendance: SRMAttendance[] = [];

  const cells = $("td[bgcolor='#E6E6FA']").toArray();

  for (const cell of cells) {
    const $cell = $(cell);
    if ($cell.text().trim() === " - ") continue;

    const courseCode = $cell.text().trim();
    if (
      !(
        (courseCode.length > 10 && /^\d/.test(courseCode)) ||
        courseCode.toLowerCase().includes("regular")
      )
    ) {
      continue;
    }

    const siblings: string[] = [];
    let next = cell.nextSibling;
    while (next) {
      if (next.type === "tag" && (next as { name?: string }).name === "td") {
        siblings.push($(next).text().trim());
      }
      next = next.nextSibling;
    }

    if (siblings.length < 7) continue;

    const conducted = siblings[4];
    const absent = siblings[5];
    const conductedHours = parseIntSafe(conducted);
    const absentHours = parseIntSafe(absent);
    const percentage =
      conductedHours > 0
        ? ((conductedHours - absentHours) / conductedHours) * 100
        : 0;

    const title = siblings[0].split(" \u2013")[0];
    if (title.toLowerCase() === "null") continue;

    attendance.push({
      courseCode: courseCode.replace("Regular", ""),
      courseTitle: title,
      category: siblings[1],
      facultyName: siblings[2],
      slot: siblings[3],
      hoursConducted: conducted,
      hoursAbsent: absent,
      attendancePercentage: percentage.toFixed(2),
    });
  }

  return { regNumber, attendance };
}

export function parseMarks(html: string): {
  regNumber: string;
  marks: {
    courseCode: string;
    courseName: string;
    courseType: string;
    overall: { scored: string; total: string };
    testPerformance: {
      test: string;
      marks: { scored: string; total: string };
    }[];
  }[];
} {
  const { regNumber, attendance } = parseAttendance(html);
  const courseMap = new Map(
    attendance.map((a) => [a.courseCode, a.courseTitle])
  );

  const marksHtml = extractMarksFragment(html);
  if (!marksHtml) return { regNumber, marks: [] };

  const $ = cheerio.load(marksHtml);
  const marks: {
    courseCode: string;
    courseName: string;
    courseType: string;
    overall: { scored: string; total: string };
    testPerformance: {
      test: string;
      marks: { scored: string; total: string };
    }[];
  }[] = [];

  const serialized = $.html();
  const tableParts = serialized.split("</table></td>");

  for (const tableHtml of tableParts) {
    const table = cheerio.load(tableHtml);
    const rows = table("tr").toArray();

    for (const row of rows) {
      const cells = table(row).find("td");
      if (cells.length < 3) continue;

      const courseCode = table(cells[0]).text().trim();
      const courseType = table(cells[1]).text().trim();

      let overallScored = 0;
      let overallTotal = 0;
      const performances: {
        test: string;
        marks: { scored: string; total: string };
      }[] = [];

      const testCells = table(cells[2]).find("table td").toArray();

      for (const testCell of testCells) {
        const text = table(testCell).text().trim();
        const pieces = text.split(".00");
        if (pieces.length < 2) continue;

        const nameParts = pieces[0].split("/");
        if (nameParts.length < 2) continue;

        const testTitle = nameParts[0];
        const total = parseFloat(nameParts[1]) || 0;
        const scoredStr = pieces[1];
        const scored = scoredStr === "Abs" ? 0 : parseFloat(scoredStr) || 0;

        performances.push({
          test: testTitle,
          marks: {
            scored: scoredStr === "Abs" ? "Abs" : scored.toFixed(2),
            total: total.toFixed(2),
          },
        });

        overallScored += scored;
        overallTotal += total;
      }

      if (performances.length > 0) {
        marks.push({
          courseCode,
          courseName: courseMap.get(courseCode) || "",
          courseType,
          overall: {
            scored: overallScored.toFixed(2),
            total: overallTotal.toFixed(2),
          },
          testPerformance: performances,
        });
      }
    }
  }

  const ordered = [
    ...marks.filter((m) => m.courseType === "Theory"),
    ...marks.filter((m) => m.courseType !== "Theory"),
  ];

  return { regNumber, marks: ordered };
}
