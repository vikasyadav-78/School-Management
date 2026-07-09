import { getMockStudents } from "@/features/students/services/module.mock";
import { getMockTeachers } from "@/features/teachers/services/teacher.mock";

let attendanceDb = [];
let isSeeded = false;

// Dynamically seed past 15 school days (excluding Sundays) for testing
const seedAttendanceData = () => {
  if (isSeeded) return;
  const students = getMockStudents() || [];
  const teachers = getMockTeachers() || [];
  if (students.length === 0 && teachers.length === 0) return;

  let daysFound = 0;
  let daysAgo = 1;

  while (daysFound < 15) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);

    if (d.getDay() !== 0) { // Exclude Sundays
      const dateStr = d.toISOString().split("T")[0];

      // Seed Class 10 Section A
      const c10Students = students.filter((s) => s.className === "10" && s.section === "A");
      if (c10Students.length > 0) {
        attendanceDb.push({
          id: `att-student-10-A-${dateStr}`,
          date: dateStr,
          targetType: "student",
          className: "10",
          section: "A",
          records: c10Students.map((s) => ({
            studentId: s.id,
            status: Math.random() < 0.88 ? "Present" : (Math.random() < 0.6 ? "Absent" : "Leave")
          }))
        });
      }

      // Seed Class 9 Section A
      const c9Students = students.filter((s) => s.className === "9" && s.section === "A");
      if (c9Students.length > 0) {
        attendanceDb.push({
          id: `att-student-9-A-${dateStr}`,
          date: dateStr,
          targetType: "student",
          className: "9",
          section: "A",
          records: c9Students.map((s) => ({
            studentId: s.id,
            status: Math.random() < 0.90 ? "Present" : (Math.random() < 0.5 ? "Absent" : "Leave")
          }))
        });
      }

      // Seed Teachers
      if (teachers.length > 0) {
        attendanceDb.push({
          id: `att-teacher-all-all-${dateStr}`,
          date: dateStr,
          targetType: "teacher",
          className: "",
          section: "",
          records: teachers.map((t) => ({
            studentId: t.id,
            status: Math.random() < 0.93 ? "Present" : (Math.random() < 0.5 ? "Absent" : "Leave")
          }))
        });
      }

      daysFound++;
    }
    daysAgo++;
  }

  isSeeded = true;
};

// 1. Fetch attendance record for marking
export const fetchRecord = async (date, className, section, targetType = "student", stream = "") => {
  seedAttendanceData();
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = attendanceDb.find(
        (a) => a.date === date && 
          a.className === className && 
          a.section === section && 
          a.targetType === targetType &&
          (!stream || a.stream === stream)
      );

      if (found) {
        resolve({
          success: true,
          data: JSON.parse(JSON.stringify(found)),
          isAlreadyMarked: true
        });
      } else {
        if (targetType === "teacher") {
          const teachers = getMockTeachers() || [];
          const newRecord = {
            id: `att-teacher-all-all-${date}`,
            date,
            targetType: "teacher",
            className: "",
            section: "",
            records: teachers.map((t) => ({
              studentId: t.id,
              status: "Present"
            }))
          };
          resolve({
            success: true,
            data: newRecord,
            isAlreadyMarked: false
          });
        } else {
          // Create templates for marking with "Present" defaulted
          const students = getMockStudents() || [];
          const studentsInSec = students.filter(
            (s) => s.className === className && s.section === section && (!stream || s.stream === stream)
          );

          const newRecord = {
            id: `att-student-${className}-${section}-${stream || "all"}-${date}`,
            date,
            targetType: "student",
            className,
            section,
            stream,
            records: studentsInSec.map((s) => ({
              studentId: s.id,
              status: "Present"
            }))
          };

          resolve({
            success: true,
            data: newRecord,
            isAlreadyMarked: false
          });
        }
      }
    }, 200);
  });
};

// 2. Save or update attendance record
export const saveRecord = async (recordData) => {
  seedAttendanceData();
  return new Promise((resolve) => {
    setTimeout(() => {
      const idx = attendanceDb.findIndex(
        (a) => a.date === recordData.date &&
          a.className === recordData.className &&
          a.section === recordData.section &&
          a.targetType === recordData.targetType &&
          (!recordData.stream || a.stream === recordData.stream)
      );

      if (idx !== -1) {
        attendanceDb[idx] = { ...attendanceDb[idx], records: recordData.records };
        resolve({ success: true, data: JSON.parse(JSON.stringify(attendanceDb[idx])) });
      } else {
        const newRecord = {
          ...recordData,
          id: recordData.id || `att-${recordData.targetType}-${recordData.className || "teacher"}-${recordData.section || "all"}-${recordData.stream || "all"}-${recordData.date}`
        };
        attendanceDb.push(newRecord);
        resolve({ success: true, data: JSON.parse(JSON.stringify(newRecord)) });
      }
    }, 300);
  });
};

// 3. Fetch report query
export const fetchReport = async (className, section, startDate, endDate, studentName = "", targetType = "student", stream = "") => {
  seedAttendanceData();
  return new Promise((resolve) => {
    setTimeout(() => {
      if (targetType === "teacher") {
        const teachers = getMockTeachers() || [];
        // Find all records in range
        const rangeRecords = attendanceDb.filter((a) => {
          const matchesType = a.targetType === "teacher";
          const matchesDate = (!startDate || a.date >= startDate) && (!endDate || a.date <= endDate);
          return matchesType && matchesDate;
        });

        const totalDays = rangeRecords.length;

        const stats = teachers.map((t) => {
          let presentDays = 0;
          let absentDays = 0;
          let leaveDays = 0;
          let halfDayDays = 0;

          rangeRecords.forEach((rec) => {
            const tRec = rec.records.find((r) => r.studentId === t.id);
            if (tRec) {
              if (tRec.status === "Present") presentDays++;
              else if (tRec.status === "Absent") absentDays++;
              else if (tRec.status === "Leave" || tRec.status === "Paid Leave" || tRec.status === "Unpaid Leave") leaveDays++;
              else if (tRec.status === "Half Day") halfDayDays++;
            }
          });

          const percent = totalDays > 0 ? ((presentDays + 0.5 * halfDayDays) / totalDays) * 100 : 100;

          return {
            id: t.id,
            name: t.name,
            gender: t.gender || "Male",
            department: t.department || "General",
            mobile: t.mobile || "",
            email: t.email || "",
            presentDays,
            absentDays,
            leaveDays,
            halfDayDays,
            totalDays,
            attendancePercentage: Math.round(percent * 10) / 10
          };
        });

        // Filter by name
        const filteredStats = stats.filter((stat) =>
          stat.name.toLowerCase().includes(studentName.toLowerCase())
        );

        // Calculate aggregates
        let aggTotalTeachers = teachers.length;
        let aggPresent = 0;
        let aggAbsent = 0;
        let aggLeave = 0;
        let aggHalfDay = 0;

        rangeRecords.forEach((rec) => {
          rec.records.forEach((r) => {
            const inSelected = teachers.some(cs => cs.id === r.studentId);
            if (inSelected) {
              if (r.status === "Present") aggPresent++;
              else if (r.status === "Absent") aggAbsent++;
              else if (r.status === "Leave" || r.status === "Paid Leave" || r.status === "Unpaid Leave") aggLeave++;
              else if (r.status === "Half Day") aggHalfDay++;
            }
          });
        });

        const totalEntries = aggPresent + aggAbsent + aggLeave + aggHalfDay;
        const averagePercentage = totalEntries > 0 ? Math.round(((aggPresent + 0.5 * aggHalfDay) / totalEntries) * 1000) / 10 : 100;

        resolve({
          success: true,
          data: {
            teacherStats: filteredStats,
            summary: {
              totalTeachers: aggTotalTeachers,
              presentDays: aggPresent,
              absentDays: aggAbsent,
              leaveDays: aggLeave,
              halfDayDays: aggHalfDay,
              averagePercentage
            }
          }
        });
      } else {
        const students = getMockStudents() || [];
        const classStudents = students.filter(
          (s) => s.className === className && (!section || s.section === section) && (!stream || s.stream === stream)
        );

        // Find all records in range
        const rangeRecords = attendanceDb.filter((a) => {
          const matchesClass = a.className === className;
          const matchesSec = !section || a.section === section;
          const matchesType = a.targetType === "student";
          const matchesStream = !stream || a.stream === stream;
          const matchesDate = (!startDate || a.date >= startDate) && (!endDate || a.date <= endDate);
          return matchesClass && matchesSec && matchesType && matchesStream && matchesDate;
        });

        const totalDays = rangeRecords.length;

        const studentStats = classStudents.map((s) => {
          let presentDays = 0;
          let absentDays = 0;
          let leaveDays = 0;

          rangeRecords.forEach((rec) => {
            const sRec = rec.records.find((r) => r.studentId === s.id);
            if (sRec) {
              if (sRec.status === "Present") presentDays++;
              else if (sRec.status === "Absent") absentDays++;
              else if (sRec.status === "Leave") leaveDays++;
            }
          });

          const percent = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

          return {
            id: s.id,
            name: s.name,
            rollNo: s.id.replace("S", ""),
            gender: s.gender,
            presentDays,
            absentDays,
            leaveDays,
            totalDays,
            attendancePercentage: Math.round(percent * 10) / 10
          };
        });

        // Filter by name
        const filteredStats = studentStats.filter((stat) =>
          stat.name.toLowerCase().includes(studentName.toLowerCase())
        );

        // Calculate aggregates
        let aggTotalStudents = classStudents.length;
        let aggPresent = 0;
        let aggAbsent = 0;
        let aggLeave = 0;

        rangeRecords.forEach((rec) => {
          rec.records.forEach((r) => {
            // Check if this student is in our filtered set (or the original set)
            const inSelected = classStudents.some(cs => cs.id === r.studentId);
            if (inSelected) {
              if (r.status === "Present") aggPresent++;
              else if (r.status === "Absent") aggAbsent++;
              else if (r.status === "Leave") aggLeave++;
            }
          });
        });

        const totalEntries = aggPresent + aggAbsent + aggLeave;
        const averagePercentage = totalEntries > 0 ? Math.round((aggPresent / totalEntries) * 1000) / 10 : 100;

        resolve({
          success: true,
          data: {
            studentStats: filteredStats,
            summary: {
              totalStudents: aggTotalStudents,
              presentDays: aggPresent,
              absentDays: aggAbsent,
              leaveDays: aggLeave,
              averagePercentage
            }
          }
        });
      }
    }, 300);
  });
};

// 4. Fetch single student profile statistics summary
export const fetchStudentSummary = async (studentId) => {
  seedAttendanceData();
  return new Promise((resolve) => {
    setTimeout(() => {
      let presentDays = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let totalDays = 0;

      attendanceDb.forEach((rec) => {
        if (rec.targetType === "student") {
          const sRec = rec.records.find((r) => r.studentId === studentId);
          if (sRec) {
            totalDays++;
            if (sRec.status === "Present") presentDays++;
            else if (sRec.status === "Absent") absentDays++;
            else if (sRec.status === "Leave") leaveDays++;
          }
        }
      });

      const percent = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : 100;

      resolve({
        success: true,
        data: {
          studentId,
          presentDays,
          absentDays,
          leaveDays,
          totalDays,
          attendancePercentage: percent
        }
      });
    }, 200);
  });
};

export const getAttendanceDb = () => {
  seedAttendanceData();
  return attendanceDb;
};

