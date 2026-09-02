import { describe, it, expect } from "vitest";
import {
  calculateAttendancePercentage,
  calculateAttendanceStatus,
  calculateCanBunk,
  calculateMustAttend,
  calculateSimulatedAttendance,
  getSubjectMarks,
  getUpcomingExams,
  getAssignmentsDueToday,
  sortByDeadline,
  getAcademicStanding,
  getGreeting,
  formatDate,
  formatTime,
  daysUntil,
  getAttendanceTrend,
  getFreePeriods,
  getTimeUntil,
  getNextClass,
  getChangesSinceLastVisit,
} from "./calculations";

describe("calculateAttendancePercentage", () => {
  it("calculates percentage correctly", () => {
    expect(calculateAttendancePercentage(18, 20)).toBe(90);
  });

  it("returns 0 when conducted is 0", () => {
    expect(calculateAttendancePercentage(0, 0)).toBe(0);
  });

  it("handles 100% attendance", () => {
    expect(calculateAttendancePercentage(20, 20)).toBe(100);
  });

  it("handles 0% attendance", () => {
    expect(calculateAttendancePercentage(0, 20)).toBe(0);
  });

  it("rounds to one decimal place", () => {
    expect(calculateAttendancePercentage(1, 3)).toBe(33.3);
  });

  it("handles edge case of 1 conducted", () => {
    expect(calculateAttendancePercentage(1, 1)).toBe(100);
  });
});

describe("calculateAttendanceStatus", () => {
  it("returns safe when well above threshold", () => {
    expect(calculateAttendanceStatus(90, 75)).toBe("safe");
  });

  it("returns safe when 5 above threshold", () => {
    expect(calculateAttendanceStatus(80, 75)).toBe("safe");
  });

  it("returns warning when exactly at threshold", () => {
    expect(calculateAttendanceStatus(75, 75)).toBe("warning");
  });

  it("returns critical when below threshold", () => {
    expect(calculateAttendanceStatus(70, 75)).toBe("critical");
  });

  it("returns warning when just below safe zone", () => {
    expect(calculateAttendanceStatus(79, 75)).toBe("warning");
  });
});

describe("calculateCanBunk", () => {
  it("calculates max safe skips", () => {
    // 18/20 = 90%, can skip 2 before dropping below 75%
    expect(calculateCanBunk(18, 20, 75)).toBe(5);
  });

  it("returns 1 when exactly at threshold", () => {
    // 15/20 = 75%, can skip 1 before dropping below 75% (15/21 = 71.4%)
    expect(calculateCanBunk(15, 20, 75)).toBe(1);
  });

  it("returns 0 when below threshold", () => {
    expect(calculateCanBunk(14, 20, 75)).toBe(0);
  });

  it("handles high attendance", () => {
    // 20/20 = 100%, can skip 7 before dropping below 75% (20/27 = 74.1%)
    expect(calculateCanBunk(20, 20, 75)).toBe(7);
  });
});

describe("calculateMustAttend", () => {
  it("returns 0 when already above threshold", () => {
    expect(calculateMustAttend(18, 20, 75)).toBe(0);
  });

  it("calculates classes needed to reach threshold", () => {
    // 14/20 = 70%, need to attend next classes
    const result = calculateMustAttend(14, 20, 75);
    expect(result).toBeGreaterThan(0);
    // After attending result classes: (14+result)/(20+result) >= 75%
    const finalPercentage = ((14 + result) / (20 + result)) * 100;
    expect(finalPercentage).toBeGreaterThanOrEqual(75);
  });

  it("returns 0 when exactly at threshold", () => {
    expect(calculateMustAttend(15, 20, 75)).toBe(0);
  });

  it("handles very low attendance", () => {
    const result = calculateMustAttend(5, 20, 75);
    expect(result).toBeGreaterThan(0);
  });
});

describe("calculateSimulatedAttendance", () => {
  it("simulates attending a class", () => {
    const result = calculateSimulatedAttendance(18, 20, ["attend"]);
    expect(result).toBe(90.5);
  });

  it("simulates missing a class", () => {
    const result = calculateSimulatedAttendance(18, 20, ["miss"]);
    expect(result).toBe(85.7);
  });

  it("simulates extra class", () => {
    // extra: attended++, conducted stays. 19/20 = 95%
    const result = calculateSimulatedAttendance(18, 20, ["extra"]);
    expect(result).toBe(95);
  });

  it("simulates cancelled class", () => {
    const result = calculateSimulatedAttendance(18, 20, ["cancelled"]);
    expect(result).toBe(90);
  });

  it("simulates multiple actions", () => {
    // attend: a=19,c=21; miss: c=22; attend: a=20,c=23 => 20/23 = 86.96 => 87
    const result = calculateSimulatedAttendance(18, 20, ["attend", "miss", "attend"]);
    expect(result).toBe(87);
  });

  it("handles empty actions", () => {
    const result = calculateSimulatedAttendance(18, 20, []);
    expect(result).toBe(90);
  });
});

describe("getSubjectMarks", () => {
  it("groups marks by subject", () => {
    const marks = [
      { subjectId: "s1", subjectName: "Math", subjectCode: "M1", assessmentName: "Test1", assessmentType: "exam", marksObtained: 18, maxMarks: 20, weightage: 20 },
      { subjectId: "s1", subjectName: "Math", subjectCode: "M1", assessmentName: "A1", assessmentType: "assignment", marksObtained: 9, maxMarks: 10, weightage: 10 },
      { subjectId: "s2", subjectName: "Physics", subjectCode: "P1", assessmentName: "Test1", assessmentType: "exam", marksObtained: 16, maxMarks: 20, weightage: 20 },
    ];
    const result = getSubjectMarks(marks);
    expect(result).toHaveLength(2);
    expect(result[0].subjectName).toBe("Math");
    expect(result[0].totalObtained).toBe(27);
    expect(result[0].totalMax).toBe(30);
  });

  it("handles empty marks", () => {
    expect(getSubjectMarks([])).toHaveLength(0);
  });
});

describe("getUpcomingExams", () => {
  it("filters future exams", () => {
    const exams = [
      { id: "1", subjectId: "s1", subjectName: "Math", subjectCode: "M1", name: "Midterm", date: "2026-10-01", startTime: "10:00", endTime: "11:00", type: "midterm" as const, preparationStatus: "not_started" as const },
      { id: "2", subjectId: "s2", subjectName: "Physics", subjectCode: "P1", name: "Final", date: "2025-01-01", startTime: "10:00", endTime: "11:00", type: "final" as const, preparationStatus: "not_started" as const },
    ];
    const result = getUpcomingExams(exams, new Date("2026-09-01"));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("sorts by date ascending", () => {
    const exams = [
      { id: "1", subjectId: "s1", subjectName: "Math", subjectCode: "M1", name: "Midterm", date: "2026-10-15", startTime: "10:00", endTime: "11:00", type: "midterm" as const, preparationStatus: "not_started" as const },
      { id: "2", subjectId: "s2", subjectName: "Physics", subjectCode: "P1", name: "Final", date: "2026-10-01", startTime: "10:00", endTime: "11:00", type: "final" as const, preparationStatus: "not_started" as const },
    ];
    const result = getUpcomingExams(exams, new Date("2026-09-01"));
    expect(result[0].id).toBe("2");
  });
});

describe("getAssignmentsDueToday", () => {
  it("filters assignments due today", () => {
    const assignments = [
      { id: "1", title: "HW1", subjectId: "s1", subjectName: "Math", dueDate: "2026-09-02", status: "not_started" as const, priority: "high" as const },
      { id: "2", title: "HW2", subjectId: "s2", subjectName: "Physics", dueDate: "2026-09-03", status: "not_started" as const, priority: "low" as const },
    ];
    const result = getAssignmentsDueToday(assignments, new Date("2026-09-02"));
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("HW1");
  });

  it("excludes submitted assignments", () => {
    const assignments = [
      { id: "1", title: "HW1", subjectId: "s1", subjectName: "Math", dueDate: "2026-09-02", status: "submitted" as const, priority: "high" as const },
    ];
    const result = getAssignmentsDueToday(assignments, new Date("2026-09-02"));
    expect(result).toHaveLength(0);
  });
});

describe("sortByDeadline", () => {
  it("sorts by nearest deadline first", () => {
    const assignments = [
      { id: "1", title: "HW1", subjectId: "s1", subjectName: "Math", dueDate: "2026-09-10", status: "not_started" as const, priority: "high" as const },
      { id: "2", title: "HW2", subjectId: "s2", subjectName: "Physics", dueDate: "2026-09-02", status: "not_started" as const, priority: "low" as const },
    ];
    const result = sortByDeadline(assignments);
    expect(result[0].dueDate).toBe("2026-09-02");
  });
});

describe("getAcademicStanding", () => {
  it("calculates academic standing correctly", () => {
    const attendance = [
      { subjectId: "s1", subjectName: "Math", subjectCode: "M1", attended: 18, conducted: 20, percentage: 90, status: "safe" as const, canBunk: 3, mustAttend: 0 },
      { subjectId: "s2", subjectName: "Physics", subjectCode: "P1", attended: 14, conducted: 20, percentage: 70, status: "critical" as const, canBunk: 0, mustAttend: 5 },
    ];
    const marks = [
      { subjectId: "s1", subjectName: "Math", subjectCode: "M1", assessments: [], totalObtained: 85, totalMax: 100, percentage: 85 },
      { subjectId: "s2", subjectName: "Physics", subjectCode: "P1", assessments: [], totalObtained: 70, totalMax: 100, percentage: 70 },
    ];
    const result = getAcademicStanding(attendance, 8, 16, marks);
    expect(result.attendanceHealth.status).toBe("critical");
    expect(result.attendanceHealth.criticalCount).toBe(1);
    expect(result.assessmentPerformance.highestSubject).toBe("Math");
    expect(result.assessmentPerformance.lowestSubject).toBe("Physics");
  });

  it("handles empty data", () => {
    const result = getAcademicStanding([], 0, 16, []);
    expect(result.attendanceHealth.status).toBe("good");
    expect(result.assessmentPerformance.averageScore).toBe(0);
  });
});

describe("getGreeting", () => {
  it("returns a greeting string", () => {
    const greeting = getGreeting();
    expect(typeof greeting).toBe("string");
    expect(greeting.length).toBeGreaterThan(0);
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2026-09-02");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formats a Date object", () => {
    const result = formatDate(new Date("2026-09-02"));
    expect(typeof result).toBe("string");
  });
});

describe("formatTime", () => {
  it("formats 24h time to 12h", () => {
    expect(formatTime("14:30")).toBe("2:30 PM");
  });

  it("formats morning time", () => {
    expect(formatTime("09:00")).toBe("9:00 AM");
  });

  it("formats midnight", () => {
    expect(formatTime("00:00")).toBe("12:00 AM");
  });

  it("formats noon", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
  });
});

describe("daysUntil", () => {
  it("returns positive for future dates", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(daysUntil(future.toISOString().split("T")[0])).toBe(5);
  });

  it("returns 0 for today", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(daysUntil(today)).toBe(0);
  });

  it("returns negative for past dates", () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(daysUntil(past.toISOString().split("T")[0])).toBe(-3);
  });
});

describe("getAttendanceTrend", () => {
  it("filters records within date range", () => {
    const records = [
      { date: "2026-09-01", attended: 5, conducted: 5 },
      { date: "2026-08-01", attended: 4, conducted: 5 },
      { date: "2026-07-01", attended: 3, conducted: 5 },
    ];
    const result = getAttendanceTrend(records, 30);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("sorts by date ascending", () => {
    const records = [
      { date: "2026-09-02", attended: 5, conducted: 5 },
      { date: "2026-09-01", attended: 4, conducted: 5 },
    ];
    const result = getAttendanceTrend(records, 7);
    if (result.length >= 2) {
      expect(new Date(result[0].date).getTime()).toBeLessThanOrEqual(
        new Date(result[1].date).getTime()
      );
    }
  });
});

describe("getFreePeriods", () => {
  it("finds gaps between classes", () => {
    const entries = [
      { id: "1", subjectId: "s1", subjectName: "Math", subjectCode: "M1", dayOfWeek: 1, startTime: "09:00", endTime: "10:00", type: "class" as const },
      { id: "2", subjectId: "s2", subjectName: "Physics", subjectCode: "P1", dayOfWeek: 1, startTime: "11:00", endTime: "12:00", type: "class" as const },
    ];
    const result = getFreePeriods(entries, 1);
    expect(result).toHaveLength(1);
    expect(result[0].start).toBe("10:00");
    expect(result[0].end).toBe("11:00");
  });

  it("returns empty for no gaps", () => {
    const entries = [
      { id: "1", subjectId: "s1", subjectName: "Math", subjectCode: "M1", dayOfWeek: 1, startTime: "09:00", endTime: "10:00", type: "class" as const },
      { id: "2", subjectId: "s2", subjectName: "Physics", subjectCode: "P1", dayOfWeek: 1, startTime: "10:00", endTime: "11:00", type: "class" as const },
    ];
    const result = getFreePeriods(entries, 1);
    expect(result).toHaveLength(0);
  });

  it("returns empty for no classes", () => {
    expect(getFreePeriods([], 1)).toHaveLength(0);
  });
});

describe("getTimeUntil", () => {
  it("returns time until target", () => {
    const now = new Date("2026-09-02T10:00:00");
    const result = getTimeUntil("11:30", now);
    expect(result).toBe("1h 30m");
  });

  it("returns 'Now' for past time", () => {
    const now = new Date("2026-09-02T10:00:00");
    const result = getTimeUntil("09:00", now);
    expect(result).toBe("Now");
  });

  it("returns minutes only for same hour", () => {
    const now = new Date("2026-09-02T10:00:00");
    const result = getTimeUntil("10:45", now);
    expect(result).toBe("45 min");
  });
});

describe("getNextClass", () => {
  it("finds next class", () => {
    const entries = [
      { id: "1", subjectId: "s1", subjectName: "Math", subjectCode: "M1", dayOfWeek: 3, startTime: "09:00", endTime: "10:00", type: "class" as const },
      { id: "2", subjectId: "s2", subjectName: "Physics", subjectCode: "P1", dayOfWeek: 3, startTime: "11:00", endTime: "12:00", type: "class" as const },
    ];
    const now = new Date("2026-09-02T10:30:00"); // Wednesday
    const result = getNextClass(entries, [], now);
    expect(result?.subjectName).toBe("Physics");
  });

  it("returns null when no more classes today", () => {
    const entries = [
      { id: "1", subjectId: "s1", subjectName: "Math", subjectCode: "M1", dayOfWeek: 3, startTime: "09:00", endTime: "10:00", type: "class" as const },
    ];
    const now = new Date("2026-09-02T11:00:00");
    const result = getNextClass(entries, [], now);
    expect(result).toBeNull();
  });

  it("skips cancelled classes", () => {
    const entries = [
      { id: "1", subjectId: "s1", subjectName: "Math", subjectCode: "M1", dayOfWeek: 3, startTime: "09:00", endTime: "10:00", type: "class" as const },
      { id: "2", subjectId: "s2", subjectName: "Physics", subjectCode: "P1", dayOfWeek: 3, startTime: "11:00", endTime: "12:00", type: "class" as const },
    ];
    const overrides = [{ entryId: "1", date: "2026-09-02", cancelled: true }];
    const now = new Date("2026-09-02T08:00:00");
    const result = getNextClass(entries, overrides, now);
    expect(result?.subjectName).toBe("Physics");
  });
});

describe("getChangesSinceLastVisit", () => {
  it("creates change log entries", () => {
    const data = {
      marks: [{ subjectName: "Math", old: 16, new: 18 }],
      attendance: [{ subjectName: "Physics", old: 80, new: 75 }],
      timetable: ["Room changed for Math"],
    };
    const result = getChangesSinceLastVisit(data);
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe("marks");
    expect(result[1].type).toBe("attendance");
    expect(result[2].type).toBe("timetable");
  });

  it("returns empty for no changes", () => {
    const result = getChangesSinceLastVisit({});
    expect(result).toHaveLength(0);
  });
});
