export const USE_MOCK = false;

export const ADMIN_NAVIGATION_ITEMS = [
  { title: "Dashboard", path: "/admin/dashboard", icon: "MdDashboard" },
  {
    title: "Students",
    path: "/admin/students",
    icon: "FaUserGraduate",
    submenu: [
      { title: "All Students", path: "/admin/students" },
      { title: "Add Student", path: "/admin/students/add" },
      { title: "Allocation & Transfer", path: "/admin/students/allocation" },
      { title: "Subjects", path: "/admin/subjects" }
    ]
  },
  {
    title: "Staff",
    path: "/admin/teachers",
    icon: "FaUsers",
    submenu: [
      { title: "Teachers", path: "/admin/teachers" },
      { title: "Staff Management", path: "/admin/staff" },
      { title: "Payroll", path: "/admin/finance/teacher-salaries" }
    ]
  },
  {
    title: "Academics",
    path: "/admin/classes",
    icon: "FaGraduationCap",
    submenu: [
      { title: "Classes & Sections", path: "/admin/classes" },
      {
        title: "Attendance",
        path: "/admin/attendance",
        submenu: [
          { title: "Mark Attendance", path: "/admin/attendance" },
          { title: "Attendance Reports", path: "/admin/attendance/reports" }
        ]
      },
      {
        title: "Homework",
        path: "/admin/homework",
        submenu: [
          { title: "Homework List", path: "/admin/homework" },
          { title: "Reports", path: "/admin/homework/reports" }
        ]
      },
      { title: "Class Notes", path: "/admin/class-notes" },
      {
        title: "Examinations",
        path: "/admin/exams",
        submenu: [
          { title: "Exams", path: "/admin/exams" },
          { title: "Reports", path: "/admin/exams/reports" }
        ]
      },
      {
        title: "Online MCQ Exams",
        path: "/admin/online-mcq",
        submenu: [
          { title: "Exams", path: "/admin/online-mcq" },
          { title: "Reports", path: "/admin/online-mcq/reports" }
        ]
      },
      {
        title: "Live Classes",
        path: "/admin/live-classes",
        submenu: [
          { title: "Live Classes", path: "/admin/live-classes" },
          { title: "Reports", path: "/admin/live-classes/reports" }
        ]
      },
      { title: "Timetable Management", path: "/admin/timetable" },
      { title: "Academic Sessions", path: "/admin/academic-years" }
    ]
  },
  {
    title: "Finance",
    path: "/admin/finance/student-fees",
    icon: "FaMoneyBillWave",
    submenu: [
      { title: "Student Fees", path: "/admin/finance/student-fees" },
      { title: "Finance Reports", path: "/admin/finance/reports" }
    ]
  },
  {
    title: "Resources",
    path: "/admin/shared-notes",
    icon: "FaBook",
    submenu: [
      { title: "Shared Notes & Papers", path: "/admin/shared-notes" },
      { title: "Notices Board", path: "/admin/notices" },
      { title: "School Posts", path: "/admin/posts" },
      { title: "Certificates", path: "/admin/certificates" }
    ]
  },
  {
    title: "Operations",
    path: "/admin/inventory",
    icon: "FaBoxes",
    submenu: [
      {
        title: "Inventory",
        path: "/admin/inventory",
        submenu: [
          { title: "Dashboard", path: "/admin/inventory" },
          { title: "Stock Items", path: "/admin/inventory/stock" },
          { title: "Purchase Orders", path: "/admin/inventory/purchases" },
          { title: "Student Sales", path: "/admin/inventory/sales" },
          { title: "Reports", path: "/admin/inventory/reports" }
        ]
      },
      { title: "Leave Applications", path: "/admin/leaves" },
      { title: "Holidays", path: "/admin/holidays" },
      { title: "Transport", path: "/admin/transport" }
    ]
  }
];

export const NAVIGATION_ITEMS = ADMIN_NAVIGATION_ITEMS; // for backward compatibility

export const SUPER_ADMIN_NAVIGATION_ITEMS = [
  { title: "Dashboard", path: "/super-admin/dashboard", icon: "MdDashboard" },
  { title: "Colleges/Schools", path: "/super-admin/schools", icon: "FaBuilding" },
  { title: "Notes & Question Papers", path: "/super-admin/content", icon: "FaCloudUploadAlt" },
  { title: "Subscription Plans", path: "/super-admin/plans", icon: "FaFileContract" },
  { title: "Global Reports", path: "/super-admin/reports", icon: "FaChartBar" },
  { title: "Online Payments", path: "/super-admin/payments", icon: "FaCoins" },
  { title: "Inventory Management", path: "/super-admin/inventory", icon: "FaShoppingCart" },
  { title: "Roles & Permissions", path: "/super-admin/roles", icon: "FaLock" },
  { title: "Settings & Integrations", path: "/super-admin/settings", icon: "FaCog" },
  { title: "Login Reports", path: "/super-admin/login-logs", icon: "FaClipboardList" }
];


export const TEACHER_NAVIGATION_ITEMS = [
  { title: "Dashboard", path: "/teacher/dashboard", icon: "MdDashboard" },
  {
    title: "Attendance",
    path: "/teacher/attendance",
    icon: "FaCalendarTimes",
    submenu: [
      { title: "Student Attendance", path: "/teacher/student-attendance" },
      { title: "My Attendance", path: "/teacher/my-attendance" }
    ]
  },
  { title: "Leaves", path: "/teacher/leaves", icon: "FaFileAlt" },
  { title: "My Students", path: "/teacher/students", icon: "FaUserGraduate" },
  { title: "Homework", path: "/teacher/homework", icon: "FaBook" },
  { title: "Class Notes", path: "/teacher/class-notes", icon: "FaFileAlt" },
  { title: "Holidays", path: "/teacher/holidays", icon: "FaUmbrellaBeach" },
  { title: "Marks Entry", path: "/teacher/marks", icon: "FaGraduationCap" },
  { title: "My Salary", path: "/teacher/salary", icon: "FaMoneyBillWave" },
  { title: "Timetable", path: "/teacher/timetable", icon: "FaCalendarAlt" },
  {
    title: "Online MCQ",
    path: "/teacher/online-mcq",
    icon: "FaLaptopCode",
    submenu: [
      { title: "My Online MCQ", path: "/teacher/online-mcq" },
      { title: "Reports", path: "/teacher/online-mcq/reports" }
    ]
  },
  {
    title: "Live Classes",
    path: "/teacher/live-classes",
    icon: "FaVideo",
    submenu: [
      { title: "My Live Classes", path: "/teacher/live-classes" },
      { title: "Reports", path: "/teacher/live-classes/reports" }
    ]
  },
  { title: "My Profile", path: "/teacher/profile", icon: "FaUser" },
  
  // Administrative Operations expandable submenu
  {
    title: "Admin Access",
    path: "/teacher/admin",
    icon: "FaLock",
    submenu: [
      {
        title: "Students",
        submenu: [
          { title: "All Students", path: "/teacher/admin/students" },
          { title: "Add Student", path: "/teacher/admin/students/add" },
          { title: "Allocation & Transfer", path: "/teacher/admin/classes/allocation" },
          { title: "Subjects", path: "/teacher/admin/subjects" }
        ]
      },
      {
        title: "Staff",
        submenu: [
          { title: "Teachers", path: "/teacher/admin/teachers" },
          { title: "Staff Management", path: "/teacher/admin/staff" },
          { title: "Payroll", path: "/teacher/admin/payroll" }
        ]
      },
      {
        title: "Academics",
        submenu: [
          { title: "Classes & Sections", path: "/teacher/admin/classes" },
          {
            title: "Attendance",
            path: "/teacher/admin/attendance",
            submenu: [
              { title: "Mark Attendance", path: "/teacher/admin/attendance" },
              { title: "Attendance Reports", path: "/teacher/admin/attendance/reports" }
            ]
          },
          { title: "Homework Reports", path: "/teacher/admin/homework/reports" },
          { title: "Class Notes", path: "/teacher/class-notes" },
          {
            title: "Examinations",
            submenu: [
              { title: "Exams", path: "/teacher/marks" },
              { title: "Reports", path: "/teacher/admin/exams/reports" }
            ]
          },
          {
            title: "Online MCQ Exams",
            submenu: [
              { title: "MCQ Exams", path: "/teacher/admin/online-mcq" },
              { title: "Reports", path: "/teacher/admin/online-mcq/reports" }
            ]
          },
          {
            title: "Live Classes",
            submenu: [
              { title: "Live Classes", path: "/teacher/admin/live-classes" },
              { title: "Reports", path: "/teacher/admin/live-classes/reports" }
            ]
          },
          { title: "Timetable Management", path: "/teacher/admin/manage-timetable" },
          { title: "Academic Sessions", path: "/teacher/admin/academic-years" }
        ]
      },
      {
        title: "Finance",
        submenu: [
          { title: "Student Fees", path: "/teacher/admin/fees" },
          { title: "Finance Reports", path: "/teacher/admin/finance/reports" }
        ]
      },
      {
        title: "Resources",
        submenu: [
          { title: "Notices Board", path: "/teacher/admin/notices" },
          { title: "Certificates", path: "/teacher/admin/certificates" }
        ]
      },
      {
        title: "Operations",
        submenu: [
          { title: "Leave Applications", path: "/teacher/admin/leaves" },
          { title: "Holidays", path: "/teacher/admin/holidays" },
          { title: "Transport", path: "/teacher/admin/transport" },
          { title: "Admin Reports Hub", path: "/teacher/admin/reports" }
        ]
      }
    ]
  }
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
  { title: "Online MCQ Exams", path: "/student/online-mcq", icon: "FaFileAlt" },
  { title: "Live Classes", path: "/student/live-classes", icon: "FaBuilding" },
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
  { title: "My Bus Location", path: "/student/transport", icon: "FaBuilding" },
  { title: "My Profile", path: "/student/profile", icon: "FaUser" }
];
