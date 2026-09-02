import type {
  StudentProfile,
  SubjectAttendance,
  TimetableEntry,
  Exam,
  Assignment,
  AcademicEvent,
  CampusEvent,
  Club,
  MessMenu,
  Notification,
} from "@/types";

export const DEMO_STUDENT: StudentProfile = {
  id: "demo-001",
  userId: "user-001",
  universityId: "srm",
  campusId: "srm-main",
  studentId: "RA2311003010001",
  name: "Alex Kumar",
  email: "alex.kumar@srm.edu.in",
  phone: "+91 98765 43210",
  program: "B.Tech Computer Science",
  department: "Computer Science and Engineering",
  year: 2,
  semester: 3,
  section: "A",
  attendanceThreshold: 75,
  onboarded: true,
  createdAt: "2025-06-15T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
};

export const DEMO_ATTENDANCE: SubjectAttendance[] = [
  {
    subjectId: "sub-os",
    subjectName: "Operating Systems",
    subjectCode: "CS301",
    attended: 19,
    conducted: 22,
    percentage: 86.4,
    status: "safe",
    canBunk: 3,
    mustAttend: 0,
  },
  {
    subjectId: "sub-cn",
    subjectName: "Computer Networks",
    subjectCode: "CS302",
    attended: 14,
    conducted: 20,
    percentage: 70.0,
    status: "critical",
    canBunk: 0,
    mustAttend: 5,
  },
  {
    subjectId: "sub-java",
    subjectName: "Java Programming",
    subjectCode: "CS303",
    attended: 27,
    conducted: 30,
    percentage: 90.0,
    status: "safe",
    canBunk: 6,
    mustAttend: 0,
  },
  {
    subjectId: "sub-ds",
    subjectName: "Data Structures",
    subjectCode: "CS304",
    attended: 20,
    conducted: 24,
    percentage: 83.3,
    status: "safe",
    canBunk: 2,
    mustAttend: 0,
  },
  {
    subjectId: "sub-ps",
    subjectName: "Probability and Statistics",
    subjectCode: "MA301",
    attended: 16,
    conducted: 22,
    percentage: 72.7,
    status: "warning",
    canBunk: 0,
    mustAttend: 2,
  },
];

export const DEMO_TIMETABLE: TimetableEntry[] = [
  { id: "tt-1", subjectId: "sub-ps", subjectName: "Probability and Statistics", subjectCode: "MA301", dayOfWeek: 1, startTime: "08:00", endTime: "09:00", room: "TP 101", building: "Tech Park", faculty: "Dr. Sharma", type: "class" },
  { id: "tt-2", subjectId: "sub-os", subjectName: "Operating Systems", subjectCode: "CS301", dayOfWeek: 1, startTime: "09:00", endTime: "10:00", room: "TP 402", building: "Tech Park", faculty: "Dr. Patel", type: "class" },
  { id: "tt-3", subjectId: "sub-cn", subjectName: "Computer Networks", subjectCode: "CS302", dayOfWeek: 1, startTime: "10:45", endTime: "11:35", room: "TP 301", building: "Tech Park", faculty: "Dr. Reddy", type: "class" },
  { id: "tt-4", subjectId: "sub-java", subjectName: "Java Programming", subjectCode: "CS303", dayOfWeek: 1, startTime: "11:35", endTime: "12:30", room: "TP 205", building: "Tech Park", faculty: "Prof. Singh", type: "class" },
  { id: "tt-5", subjectId: "sub-ds", subjectName: "Data Structures", subjectCode: "CS304", dayOfWeek: 1, startTime: "14:00", endTime: "15:00", room: "TP 402", building: "Tech Park", faculty: "Dr. Kumar", type: "class" },
  { id: "tt-6", subjectId: "sub-ps", subjectName: "Probability and Statistics", subjectCode: "MA301", dayOfWeek: 2, startTime: "08:00", endTime: "09:00", room: "TP 101", building: "Tech Park", faculty: "Dr. Sharma", type: "class" },
  { id: "tt-7", subjectId: "sub-os", subjectName: "Operating Systems", subjectCode: "CS301", dayOfWeek: 2, startTime: "09:00", endTime: "10:00", room: "TP 402", building: "Tech Park", faculty: "Dr. Patel", type: "class" },
  { id: "tt-8", subjectId: "sub-cn", subjectName: "Computer Networks", subjectCode: "CS302", dayOfWeek: 2, startTime: "10:45", endTime: "11:35", room: "TP 301", building: "Tech Park", faculty: "Dr. Reddy", type: "class" },
  { id: "tt-9", subjectId: "sub-java", subjectName: "Java Programming", subjectCode: "CS303", dayOfWeek: 2, startTime: "11:35", endTime: "12:30", room: "TP 205", building: "Tech Park", faculty: "Prof. Singh", type: "class" },
  { id: "tt-10", subjectId: "sub-ds", subjectName: "Data Structures", subjectCode: "CS304", dayOfWeek: 2, startTime: "14:00", endTime: "15:00", room: "TP 402", building: "Tech Park", faculty: "Dr. Kumar", type: "class" },
  { id: "tt-11", subjectId: "sub-ps", subjectName: "Probability and Statistics", subjectCode: "MA301", dayOfWeek: 3, startTime: "08:00", endTime: "09:00", room: "TP 101", building: "Tech Park", faculty: "Dr. Sharma", type: "class" },
  { id: "tt-12", subjectId: "sub-os", subjectName: "Operating Systems", subjectCode: "CS301", dayOfWeek: 3, startTime: "09:00", endTime: "10:00", room: "TP 402", building: "Tech Park", faculty: "Dr. Patel", type: "class" },
  { id: "tt-13", subjectId: "sub-cn", subjectName: "Computer Networks", subjectCode: "CS302", dayOfWeek: 3, startTime: "10:45", endTime: "11:35", room: "TP 301", building: "Tech Park", faculty: "Dr. Reddy", type: "class" },
  { id: "tt-14", subjectId: "sub-java", subjectName: "Java Programming", subjectCode: "CS303", dayOfWeek: 3, startTime: "11:35", endTime: "12:30", room: "TP 205", building: "Tech Park", faculty: "Prof. Singh", type: "class" },
  { id: "tt-15", subjectId: "sub-ds", subjectName: "Data Structures", subjectCode: "CS304", dayOfWeek: 3, startTime: "14:00", endTime: "15:00", room: "TP 402", building: "Tech Park", faculty: "Dr. Kumar", type: "class" },
  { id: "tt-16", subjectId: "sub-ps", subjectName: "Probability and Statistics", subjectCode: "MA301", dayOfWeek: 4, startTime: "08:00", endTime: "09:00", room: "TP 101", building: "Tech Park", faculty: "Dr. Sharma", type: "class" },
  { id: "tt-17", subjectId: "sub-os", subjectName: "Operating Systems", subjectCode: "CS301", dayOfWeek: 4, startTime: "09:00", endTime: "10:00", room: "TP 402", building: "Tech Park", faculty: "Dr. Patel", type: "class" },
  { id: "tt-18", subjectId: "sub-cn", subjectName: "Computer Networks", subjectCode: "CS302", dayOfWeek: 4, startTime: "10:45", endTime: "11:35", room: "TP 301", building: "Tech Park", faculty: "Dr. Reddy", type: "class" },
  { id: "tt-19", subjectId: "sub-java", subjectName: "Java Programming", subjectCode: "CS303", dayOfWeek: 4, startTime: "11:35", endTime: "12:30", room: "TP 205", building: "Tech Park", faculty: "Prof. Singh", type: "class" },
  { id: "tt-20", subjectId: "sub-ds", subjectName: "Data Structures", subjectCode: "CS304", dayOfWeek: 4, startTime: "14:00", endTime: "15:00", room: "TP 402", building: "Tech Park", faculty: "Dr. Kumar", type: "class" },
  { id: "tt-21", subjectId: "sub-ps", subjectName: "Probability and Statistics", subjectCode: "MA301", dayOfWeek: 5, startTime: "08:00", endTime: "09:00", room: "TP 101", building: "Tech Park", faculty: "Dr. Sharma", type: "class" },
  { id: "tt-22", subjectId: "sub-os", subjectName: "Operating Systems", subjectCode: "CS301", dayOfWeek: 5, startTime: "09:00", endTime: "10:00", room: "TP 402", building: "Tech Park", faculty: "Dr. Patel", type: "class" },
  { id: "tt-23", subjectId: "sub-cn", subjectName: "Computer Networks", subjectCode: "CS302", dayOfWeek: 5, startTime: "10:45", endTime: "11:35", room: "TP 301", building: "Tech Park", faculty: "Dr. Reddy", type: "class" },
  { id: "tt-24", subjectId: "sub-java", subjectName: "Java Programming", subjectCode: "CS303", dayOfWeek: 5, startTime: "11:35", endTime: "12:30", room: "TP 205", building: "Tech Park", faculty: "Prof. Singh", type: "class" },
];

export const DEMO_MARKS: { subjectId: string; subjectName: string; subjectCode: string; assessmentName: string; assessmentType: string; marksObtained: number; maxMarks: number; weightage: number }[] = [
  { subjectId: "sub-os", subjectName: "Operating Systems", subjectCode: "CS301", assessmentName: "Cycle Test 1", assessmentType: "exam", marksObtained: 17, maxMarks: 20, weightage: 20 },
  { subjectId: "sub-os", subjectName: "Operating Systems", subjectCode: "CS301", assessmentName: "Assignment 1", assessmentType: "assignment", marksObtained: 9, maxMarks: 10, weightage: 10 },
  { subjectId: "sub-os", subjectName: "Operating Systems", subjectCode: "CS301", assessmentName: "Lab 1", assessmentType: "lab", marksObtained: 18, maxMarks: 20, weightage: 20 },
  { subjectId: "sub-cn", subjectName: "Computer Networks", subjectCode: "CS302", assessmentName: "Cycle Test 1", assessmentType: "exam", marksObtained: 15, maxMarks: 20, weightage: 20 },
  { subjectId: "sub-cn", subjectName: "Computer Networks", subjectCode: "CS302", assessmentName: "Assignment 1", assessmentType: "assignment", marksObtained: 8, maxMarks: 10, weightage: 10 },
  { subjectId: "sub-java", subjectName: "Java Programming", subjectCode: "CS303", assessmentName: "Cycle Test 1", assessmentType: "exam", marksObtained: 18, maxMarks: 20, weightage: 20 },
  { subjectId: "sub-java", subjectName: "Java Programming", subjectCode: "CS303", assessmentName: "Assignment 1", assessmentType: "assignment", marksObtained: 10, maxMarks: 10, weightage: 10 },
  { subjectId: "sub-java", subjectName: "Java Programming", subjectCode: "CS303", assessmentName: "Lab 1", assessmentType: "lab", marksObtained: 19, maxMarks: 20, weightage: 20 },
  { subjectId: "sub-ds", subjectName: "Data Structures", subjectCode: "CS304", assessmentName: "Cycle Test 1", assessmentType: "exam", marksObtained: 16, maxMarks: 20, weightage: 20 },
  { subjectId: "sub-ds", subjectName: "Data Structures", subjectCode: "CS304", assessmentName: "Assignment 1", assessmentType: "assignment", marksObtained: 9, maxMarks: 10, weightage: 10 },
  { subjectId: "sub-ps", subjectName: "Probability and Statistics", subjectCode: "MA301", assessmentName: "Cycle Test 1", assessmentType: "exam", marksObtained: 14, maxMarks: 20, weightage: 20 },
  { subjectId: "sub-ps", subjectName: "Probability and Statistics", subjectCode: "MA301", assessmentName: "Assignment 1", assessmentType: "assignment", marksObtained: 7, maxMarks: 10, weightage: 10 },
];

export const DEMO_EXAMS: Exam[] = [
  { id: "exam-1", subjectId: "sub-os", subjectName: "Operating Systems", subjectCode: "CS301", name: "Cycle Test II", date: "2026-09-09", startTime: "10:00", endTime: "11:30", room: "TP 503", building: "Tech Park", type: "midterm", preparationStatus: "revising" },
  { id: "exam-2", subjectId: "sub-cn", subjectName: "Computer Networks", subjectCode: "CS302", name: "Cycle Test II", date: "2026-09-11", startTime: "10:00", endTime: "11:30", room: "TP 301", building: "Tech Park", type: "midterm", preparationStatus: "not_started" },
  { id: "exam-3", subjectId: "sub-java", subjectName: "Java Programming", subjectCode: "CS303", name: "Cycle Test II", date: "2026-09-13", startTime: "10:00", endTime: "11:30", room: "TP 205", building: "Tech Park", type: "midterm", preparationStatus: "ready" },
  { id: "exam-4", subjectId: "sub-ds", subjectName: "Data Structures", subjectCode: "CS304", name: "Cycle Test II", date: "2026-09-15", startTime: "10:00", endTime: "11:30", room: "TP 402", building: "Tech Park", type: "midterm", preparationStatus: "not_started" },
  { id: "exam-5", subjectId: "sub-ps", subjectName: "Probability and Statistics", subjectCode: "MA301", name: "Cycle Test II", date: "2026-09-17", startTime: "10:00", endTime: "11:30", room: "TP 101", building: "Tech Park", type: "midterm", preparationStatus: "not_started" },
];

export const DEMO_ASSIGNMENTS: Assignment[] = [
  { id: "asgn-1", title: "OS Process Scheduling Report", subjectId: "sub-os", subjectName: "Operating Systems", description: "Implement and compare FCFS, SJF, and Round Robin scheduling algorithms.", dueDate: "2026-09-05", status: "in_progress", priority: "high" },
  { id: "asgn-2", title: "CN Wireshark Lab", subjectId: "sub-cn", subjectName: "Computer Networks", description: "Capture and analyze HTTP, DNS, and TCP packets using Wireshark.", dueDate: "2026-09-08", status: "not_started", priority: "medium" },
  { id: "asgn-3", title: "Java GUI Application", subjectId: "sub-java", subjectName: "Java Programming", description: "Build a student management system with Swing/JavaFX.", dueDate: "2026-09-10", status: "not_started", priority: "medium" },
  { id: "asgn-4", title: "DS Binary Tree Implementation", subjectId: "sub-ds", subjectName: "Data Structures", description: "Implement BST with insert, delete, search, and traversal operations.", dueDate: "2026-09-03", status: "submitted", priority: "low" },
  { id: "asgn-5", title: "PS Probability Distribution Analysis", subjectId: "sub-ps", subjectName: "Probability and Statistics", description: "Analyze given datasets using binomial and Poisson distributions.", dueDate: "2026-09-12", status: "not_started", priority: "medium" },
];

export const DEMO_EVENTS: AcademicEvent[] = [
  { id: "ev-1", title: "Independence Day Holiday", date: "2026-08-15", type: "holiday", isAllDay: true },
  { id: "ev-2", title: "Onam Holiday", date: "2026-09-05", type: "holiday", isAllDay: true },
  { id: "ev-3", title: "Ganesh Chaturthi", date: "2026-09-07", type: "holiday", isAllDay: true },
  { id: "ev-4", title: "Tech Fest Registration", date: "2026-09-15", type: "event", location: "Main Auditorium", isAllDay: false, startTime: "09:00", endTime: "17:00" },
  { id: "ev-5", title: "Mid-Term Exams Begin", date: "2026-09-09", type: "exam", isAllDay: true },
];

export const DEMO_CAMPUS_EVENTS: CampusEvent[] = [
  { id: "ce-1", title: "Cloud Computing Workshop", description: "Hands-on workshop on AWS and Azure cloud services.", clubId: "club-1", clubName: "ACM Student Chapter", date: "2026-09-04", startTime: "17:00", endTime: "19:00", location: "Seminar Hall A", category: "workshop", registrationLimit: 60, registeredCount: 42, isRegistered: true },
  { id: "ce-2", title: "HackSrm 2026", description: "48-hour hackathon with prizes worth ₹2,00,000.", clubId: "club-2", clubName: "Developer Student Club", date: "2026-09-19", endDate: "2026-09-21", location: "Tech Park", category: "hackathon", registrationLimit: 200, registeredCount: 156, isRegistered: false },
  { id: "ce-3", title: "Cultural Night", description: "Annual cultural night featuring music, dance, and drama.", clubId: "club-3", clubName: "Cultural Club", date: "2026-09-25", startTime: "18:00", endTime: "22:00", location: "Open Air Theatre", category: "cultural", isRegistered: false },
  { id: "ce-4", title: "Resume Building Session", description: "Learn to craft the perfect resume for placements.", clubId: "club-4", clubName: "Training & Placement Cell", date: "2026-09-08", startTime: "14:00", endTime: "16:00", location: "Seminar Hall B", category: "career", registrationLimit: 100, registeredCount: 78, isRegistered: false },
];

export const DEMO_CLUBS: Club[] = [
  { id: "club-1", name: "ACM Student Chapter", description: "Association for Computing Machinery student chapter focused on technical excellence.", category: "technical", socialLinks: { website: "https://acm.srm.edu.in" } },
  { id: "club-2", name: "Developer Student Club", description: "Google-sponsored developer community for learning and building.", category: "technical", socialLinks: { website: "https://dsc.srm.edu.in" } },
  { id: "club-3", name: "Cultural Club", description: "Organizes cultural events, fests, and performances throughout the year.", category: "cultural" },
  { id: "club-4", name: "Training & Placement Cell", description: "Handles campus placements, internships, and career development.", category: "entrepreneurship" },
  { id: "club-5", name: "Photography Club", description: "For students passionate about photography and visual storytelling.", category: "photography" },
  { id: "club-6", name: "Music Club", description: "A community for musicians, singers, and music enthusiasts.", category: "music" },
];

export const DEMO_MESS: MessMenu = {
  id: "mess-1",
  date: new Date().toISOString().split("T")[0],
  meals: [
    { type: "breakfast", items: ["Idli", "Sambar", "Chutney", "Tea/Coffee"] },
    { type: "lunch", items: ["Rice", "Dal Fry", "Paneer Butter Masala", "Curd", "Salad"] },
    { type: "snacks", items: ["Samosa", "Tea", "Biscuits"] },
    { type: "dinner", items: ["Chapati", "Vegetable Curry", "Rice", "Dal", "Ice Cream"] },
  ],
};

export const DEMO_NOTIFICATIONS: Notification[] = [
  { id: "n-1", title: "Attendance Alert", message: "Computer Networks attendance dropped below 75%. Attend the next 5 classes to recover.", category: "attendance", read: false, actionUrl: "/attendance", createdAt: "2026-09-01T10:00:00Z" },
  { id: "n-2", title: "Exam Reminder", message: "OS Cycle Test II is in 6 days. Start preparing!", category: "exam", read: false, actionUrl: "/exams", createdAt: "2026-09-01T09:00:00Z" },
  { id: "n-3", title: "Assignment Due", message: "OS Process Scheduling Report is due in 3 days.", category: "assignment", read: false, actionUrl: "/assignments", createdAt: "2026-09-01T08:00:00Z" },
  { id: "n-4", title: "New Marks Published", message: "Java Programming Cycle Test 1 marks are now available.", category: "marks", read: true, actionUrl: "/marks", createdAt: "2026-08-30T14:00:00Z" },
  { id: "n-5", title: "Holiday Notice", message: "September 5 is a holiday for Onam.", category: "system", read: true, createdAt: "2026-08-28T10:00:00Z" },
];
