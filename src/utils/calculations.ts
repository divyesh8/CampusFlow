import type {
  SubjectAttendance,
  TimetableEntry,
  SubjectMarks,
  Exam,
  Assignment,
  ChangeLog,
  AcademicStanding,
} from "@/types";

export function calculateAttendancePercentage(attended: number, conducted: number): number {
  if (conducted === 0) return 0;
  return Math.round((attended / conducted) * 1000) / 10;
}

export function calculateAttendanceStatus(
  percentage: number,
  threshold: number
): "safe" | "warning" | "critical" {
  if (percentage >= threshold + 5) return "safe";
  if (percentage >= threshold) return "warning";
  return "critical";
}

export function calculateCanBunk(
  attended: number,
  conducted: number,
  threshold: number
): number {
  let skip = 0;
  while (true) {
    const newPercentage = (attended / (conducted + skip)) * 100;
    if (newPercentage < threshold) break;
    skip++;
  }
  return skip;
}

export function calculateMustAttend(
  attended: number,
  conducted: number,
  threshold: number
): number {
  let attend = 0;
  while (true) {
    const newPercentage = ((attended + attend) / (conducted + attend)) * 100;
    if (newPercentage >= threshold) break;
    attend++;
    if (attend > 100) break;
  }
  return attend;
}

export function calculateSimulatedAttendance(
  attended: number,
  conducted: number,
  actions: ("attend" | "miss" | "cancelled" | "extra")[]
): number {
  let a = attended;
  let c = conducted;
  for (const action of actions) {
    if (action === "attend") { a++; c++; }
    else if (action === "miss") { c++; }
    else if (action === "extra") { a++; }
  }
  return calculateAttendancePercentage(a, c);
}

export function getNextClass(
  entries: TimetableEntry[],
  overrides: { entryId: string; date: string; cancelled: boolean; newStartTime?: string; newRoom?: string }[],
  now: Date = new Date()
): TimetableEntry | null {
  const today = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayEntries = entries
    .filter((e) => e.dayOfWeek === today && e.type !== "break")
    .map((e) => {
      const override = overrides.find(
        (o) => o.entryId === e.id && o.date === now.toISOString().split("T")[0]
      );
      if (override?.cancelled) return null;
      return {
        ...e,
        startTime: override?.newStartTime || e.startTime,
        room: override?.newRoom || e.room,
      };
    })
    .filter(Boolean) as TimetableEntry[];

  const sorted = todayEntries.sort((a, b) => {
    const [aH, aM] = a.startTime.split(":").map(Number);
    const [bH, bM] = b.startTime.split(":").map(Number);
    return aH * 60 + aM - (bH * 60 + bM);
  });

  for (const entry of sorted) {
    const [h, m] = entry.startTime.split(":").map(Number);
    const entryMinutes = h * 60 + m;
    if (entryMinutes > currentMinutes) return entry;
  }

  return null;
}

export function getTimeUntil(targetTime: string, now: Date = new Date()): string {
  const [h, m] = targetTime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diff = target.getTime() - now.getTime();
  if (diff < 0) return "Now";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours === 0) return `${mins} min`;
  return `${hours}h ${mins}m`;
}

export function getFreePeriods(
  entries: TimetableEntry[],
  dayOfWeek: number
): { start: string; end: string; duration: string }[] {
  const dayEntries = entries
    .filter((e) => e.dayOfWeek === dayOfWeek && e.type !== "break")
    .sort((a, b) => {
      const [aH, aM] = a.startTime.split(":").map(Number);
      const [bH, bM] = b.startTime.split(":").map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });

  const freePeriods: { start: string; end: string; duration: string }[] = [];
  for (let i = 0; i < dayEntries.length - 1; i++) {
    const currentEnd = dayEntries[i].endTime;
    const nextStart = dayEntries[i + 1].startTime;
    const [endH, endM] = currentEnd.split(":").map(Number);
    const [startH, startM] = nextStart.split(":").map(Number);
    const diff = startH * 60 + startM - (endH * 60 + endM);
    if (diff > 15) {
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      freePeriods.push({
        start: currentEnd,
        end: nextStart,
        duration: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
      });
    }
  }
  return freePeriods;
}

export function getSubjectMarks(marks: { subjectId: string; subjectName: string; subjectCode: string; assessmentName: string; assessmentType: string; marksObtained: number; maxMarks: number; weightage: number }[]): SubjectMarks[] {
  const grouped = new Map<string, typeof marks>();
  for (const mark of marks) {
    const existing = grouped.get(mark.subjectId) || [];
    existing.push(mark);
    grouped.set(mark.subjectId, existing);
  }

  return Array.from(grouped.entries()).map(([subjectId, subjectMarks]) => {
    const first = subjectMarks[0];
    const assessments = subjectMarks.map((m) => ({
      assessmentId: m.assessmentName,
      name: m.assessmentName,
      type: m.assessmentType,
      marksObtained: m.marksObtained,
      maxMarks: m.maxMarks,
      weightage: m.weightage,
    }));
    const totalObtained = assessments.reduce((sum, a) => sum + a.marksObtained, 0);
    const totalMax = assessments.reduce((sum, a) => sum + a.maxMarks, 0);
    return {
      subjectId,
      subjectName: first.subjectName,
      subjectCode: first.subjectCode,
      assessments,
      totalObtained,
      totalMax,
      percentage: calculateAttendancePercentage(totalObtained, totalMax),
    };
  });
}

export function getUpcomingExams(exams: Exam[], now: Date = new Date()): Exam[] {
  return exams
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getAssignmentsDueToday(assignments: Assignment[], now: Date = new Date()): Assignment[] {
  const today = now.toISOString().split("T")[0];
  return assignments.filter((a) => a.dueDate === today && a.status !== "submitted");
}

export function sortByDeadline(assignments: Assignment[]): Assignment[] {
  return [...assignments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function getAcademicStanding(
  subjectAttendance: SubjectAttendance[],
  semesterWeek: number,
  totalWeeks: number,
  subjectMarks: SubjectMarks[]
): AcademicStanding {
  const safeCount = subjectAttendance.filter((s) => s.status === "safe").length;
  const warningCount = subjectAttendance.filter((s) => s.status === "warning").length;
  const criticalCount = subjectAttendance.filter((s) => s.status === "critical").length;

  const attendanceStatus = criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "good";

  const avgScore = subjectMarks.length > 0
    ? subjectMarks.reduce((sum, s) => sum + s.percentage, 0) / subjectMarks.length
    : 0;
  const sorted = [...subjectMarks].sort((a, b) => b.percentage - a.percentage);

  return {
    attendanceHealth: {
      status: attendanceStatus,
      safeCount,
      warningCount,
      criticalCount,
    },
    semesterProgress: {
      currentWeek: semesterWeek,
      totalWeeks,
      percentage: Math.round((semesterWeek / totalWeeks) * 100),
    },
    assessmentPerformance: {
      averageScore: Math.round(avgScore * 10) / 10,
      highestSubject: sorted[0]?.subjectName || "N/A",
      lowestSubject: sorted[sorted.length - 1]?.subjectName || "N/A",
    },
  };
}

export function getChangesSinceLastVisit(
  currentData: {
    marks?: { subjectName: string; old: number; new: number }[];
    attendance?: { subjectName: string; old: number; new: number }[];
    timetable?: string[];
  },
): ChangeLog[] {
  const changes: ChangeLog[] = [];
  const now = new Date().toISOString();

  currentData.marks?.forEach((m) => {
    changes.push({
      type: "marks",
      title: `${m.subjectName} marks updated`,
      description: `${m.old} → ${m.new}`,
      timestamp: now,
      subjectName: m.subjectName,
    });
  });

  currentData.attendance?.forEach((a) => {
    changes.push({
      type: "attendance",
      title: `${a.subjectName} attendance changed`,
      description: `${a.old}% → ${a.new}%`,
      timestamp: now,
      subjectName: a.subjectName,
    });
  });

  currentData.timetable?.forEach((t) => {
    changes.push({
      type: "timetable",
      title: "Timetable changed",
      description: t,
      timestamp: now,
    });
  });

  return changes;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

export function getAttendanceTrend(
  records: { date: string; attended: number; conducted: number }[],
  days: number
): { date: string; percentage: number }[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 86400000);
  return records
    .filter((r) => new Date(r.date) >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((r) => ({
      date: r.date,
      percentage: calculateAttendancePercentage(r.attended, r.conducted),
    }));
}
