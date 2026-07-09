export const mockStats = [
  { id: 1, title: "Total Students", value: "3,250", progress: 76, growthText: "+15% vs last month", color: "violet", trend: "up", percentage: "15" },
  { id: 2, title: "New Admissions", value: "480", progress: 42, growthText: "+8% vs last week", color: "emerald", trend: "up", percentage: "8" },
  { id: 3, title: "Total Teachers", value: "148", progress: 60, growthText: "Optimal ratio", color: "amber", trend: "up", percentage: "0" },
  { id: 4, title: "Fees Collection", value: "₹45,280", progress: 88, growthText: "+24% vs last term", color: "sky", trend: "up", percentage: "24" }
];

export const mockChartData = {
  // Chart 1: Student Performance Overview (Class-wise academic performance and progress)
  barChart: [
    { name: "Grade 6", Math: 85, Science: 78, English: 90 },
    { name: "Grade 7", Math: 88, Science: 82, English: 92 },
    { name: "Grade 8", Math: 82, Science: 80, English: 88 },
    { name: "Grade 9", Math: 90, Science: 85, English: 94 },
    { name: "Grade 10", Math: 94, Science: 90, English: 96 }
  ],
  // Chart 2: School Population (Students, Teachers and Staff distribution)
  donutChart: [
    { name: "Teachers", value: 148 },
    { name: "Students", value: 3250 },
    { name: "Staff", value: 65 }
  ],
  // Chart 3: Attendance Overview (Weekly student attendance trends)
  areaChart: [
    { name: "Mon", Present: 95, Late: 3 },
    { name: "Tue", Present: 98, Late: 1 },
    { name: "Wed", Present: 97, Late: 2 },
    { name: "Thu", Present: 96, Late: 4 },
    { name: "Fri", Present: 94, Late: 5 },
    { name: "Sat", Present: 92, Late: 6 },
    { name: "Sun", Present: 99, Late: 0 }
  ]
};

export const mockStudentList = [
  { id: 1, no: "01", name: "Alice Johnson", teacher: "Dr. Sarah Jenkins", admissionDate: "2026-05-10", status: "Checkin", grade: "Grade 10-A", fees: "₹1200" },
  { id: 2, no: "02", name: "Bob Smith", teacher: "Prof. David Miller", admissionDate: "2026-05-12", status: "Pending", grade: "Grade 9-B", fees: "₹1500" },
  { id: 3, no: "03", name: "Charlie Davis", teacher: "Dr. Emily Taylor", admissionDate: "2026-05-14", status: "Canceled", grade: "Grade 8-A", fees: "₹1000" },
  { id: 4, no: "04", name: "Diana Ross", teacher: "Prof. James Wilson", admissionDate: "2026-05-15", status: "Checkin", grade: "Grade 10-C", fees: "₹1400" },
  { id: 5, no: "05", name: "Ethan Hunt", teacher: "Dr. Sarah Jenkins", admissionDate: "2026-05-18", status: "Pending", grade: "Grade 10-A", fees: "₹1200" }
];
