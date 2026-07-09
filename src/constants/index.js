export const USE_MOCK = true;

export const ADMIN_NAVIGATION_ITEMS = [
  { title: "Dashboard", path: "/admin/dashboard", icon: "MdDashboard" },
  {
    title: "Teachers", path: "/admin/teachers", icon: "FaChalkboardTeacher",
    submenu: [
      { title: "All Teachers", path: "/admin/teachers" },
      { title: "Add Teacher", path: "/admin/teachers/add" }
    ]
  },
  {
    title: "Students", path: "/admin/students", icon: "FaUserGraduate",
    submenu: [
      { title: "All Students", path: "/admin/students" },
      { title: "Add Student", path: "/admin/students/add" }
    ]
  },
  {
    title: "Attendance", path: "/admin/attendance", icon: "FaCalendarTimes",
    submenu: [
      { title: "Mark Attendance", path: "/admin/attendance" },
      { title: "Attendance Reports", path: "/admin/attendance/reports" }
    ]
  },
  {
    title: "Finance Management", path: "/admin/finance", icon: "FaMoneyBillWave",
    submenu: [
      { title: "Student Fees", path: "/admin/finance/student-fees" },
      { title: "Teacher Salaries", path: "/admin/finance/teacher-salaries" },
      { title: "Finance Reports", path: "/admin/finance/reports" }
    ]
  },
  { title: "Email", path: "/admin/email", icon: "MdEmail" },
  { title: "Profile", path: "/admin/profile", icon: "FaUser" }
];

export const NAVIGATION_ITEMS = ADMIN_NAVIGATION_ITEMS; // for backward compatibility

export const TEACHER_NAVIGATION_ITEMS = [
  { title: "Dashboard", path: "/teacher/dashboard", icon: "MdDashboard" },
  { title: "Attendance", path: "/teacher/attendance", icon: "FaCalendarTimes" },
  { title: "Leaves", path: "/teacher/leaves", icon: "FaFileAlt" },
  { title: "My Salary", path: "/teacher/salary", icon: "FaMoneyBillWave" },
  { title: "Timetable", path: "/teacher/timetable", icon: "FaCalendarAlt" },
  { title: "My Profile", path: "/teacher/profile", icon: "FaUser" }
];

export const STUDENT_NAVIGATION_ITEMS = [
  { title: "Dashboard", path: "/student/dashboard", icon: "MdDashboard" },
  { title: "Attendance", path: "/student/attendance", icon: "FaCalendarTimes" },
  { title: "Leaves", path: "/student/leaves", icon: "FaFileAlt" },
  { title: "My Fees", path: "/student/fees", icon: "FaMoneyBillWave" },
  { title: "Timetable", path: "/student/timetable", icon: "FaCalendarAlt" },
  { title: "Holidays", path: "/student/holidays", icon: "FaUmbrellaBeach" },
  { title: "Homework", path: "/student/homework", icon: "FaBook" },
  { title: "Class Notes", path: "/student/class-notes", icon: "FaFileAlt" },
  {
    title: "Examinations",
    icon: "FaGraduationCap",
    path: "/student/examinations",
    submenu: [
      { title: "Exam Schedule", path: "/student/examinations/schedule" },
      { title: "Results", path: "/student/examinations/results" },
      { title: "Report Cards", path: "/student/examinations/report-cards" },
      { title: "Admit Cards", path: "/student/examinations/admit-cards" }
    ]
  },
  { title: "My Profile", path: "/student/profile", icon: "FaUser" }
];
