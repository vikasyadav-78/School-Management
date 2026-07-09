import { getMockStudents } from "@/features/students/services/module.mock";
import { getMockTeachers } from "@/features/teachers/services/teacher.mock";
import { getAttendanceDb } from "@/features/attendance/services/attendance.mock";

let feesDb = [];
let paymentsDb = [];
let salariesDb = [];
let expensesDb = [];
let isSeeded = false;

// Helper to seed data
export const seedFinanceData = () => {
  if (isSeeded) return;

  // 1. Seed Student Fees (Migrated from fee.mock.js)
  const students = getMockStudents() || [];
  students.forEach((student, idx) => {
    const admissionFee = 1000;
    const monthlyFee = 200 * 10; // ₹2000 total monthly fees
    const transportFee = idx % 3 === 0 ? 150 : 0;
    const examFee = 100;
    const otherCharges = idx % 5 === 0 ? 50 : 0;
    const totalFee = admissionFee + monthlyFee + transportFee + examFee + otherCharges;

    let paidAmount = 0;
    const rand = Math.random();
    let status = "Pending";
    let studentPayments = [];

    const lastPaymentDate = idx % 3 === 0 ? "2026-05-10" : idx % 3 === 1 ? "2026-04-15" : "";

    if (rand < 0.45) {
      // Fully Paid
      paidAmount = totalFee;
      status = "Paid";
      
      const receiptNo1 = `REC-2026-${String(idx * 2 + 1).padStart(4, "0")}`;
      const receiptNo2 = `REC-2026-${String(idx * 2 + 2).padStart(4, "0")}`;
      
      const p1 = {
        receiptNo: receiptNo1,
        studentId: student.id,
        studentName: student.name,
        className: student.className,
        amount: admissionFee + examFee + otherCharges + transportFee,
        paymentDate: "2026-01-15",
        paymentMethod: "Bank Transfer",
        remarks: "Admission Fees & Charges"
      };

      const p2 = {
        receiptNo: receiptNo2,
        studentId: student.id,
        studentName: student.name,
        className: student.className,
        amount: monthlyFee,
        paymentDate: lastPaymentDate || "2026-05-02",
        paymentMethod: "UPI",
        remarks: "Monthly Fees Settlement"
      };

      studentPayments = [p1, p2];
      paymentsDb.push(p1, p2);
    } else if (rand < 0.8) {
      // Partially Paid
      paidAmount = admissionFee + examFee + 400;
      status = "Partial";
      
      const receiptNo = `REC-2026-${String(idx * 2 + 1).padStart(4, "0")}`;
      const p = {
        receiptNo,
        studentId: student.id,
        studentName: student.name,
        className: student.className,
        amount: paidAmount,
        paymentDate: lastPaymentDate || "2026-03-12",
        paymentMethod: "Cash",
        remarks: "Partial Deposit"
      };
      studentPayments = [p];
      paymentsDb.push(p);
    } else {
      paidAmount = 0;
      status = "Pending";
    }

    const remainingAmount = totalFee - paidAmount;

    feesDb.push({
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      section: student.section || "A",
      stream: student.stream || null,
      parentName: student.parentName,
      phone: student.phone,
      admissionFee,
      monthlyFee,
      transportFee,
      examFee,
      otherCharges,
      totalFee,
      paidAmount,
      remainingAmount,
      status,
      dueDate: "2026-06-15",
      lastPaymentDate: lastPaymentDate || (paidAmount > 0 ? "2026-03-12" : "N/A"),
      payments: studentPayments
    });
  });

  // 2. Seed Teacher Salaries
  const teachers = getMockTeachers() || [];
  const baseSalaries = {
    T001: 4500,
    T002: 4200,
    T003: 3800,
    T004: 3600
  };

  teachers.forEach((teacher, idx) => {
    const monthlySalary = baseSalaries[teacher.id] || 3500;
    const perDaySalary = Math.round((monthlySalary / 30) * 100) / 100;

    // Seed March 2026 (Paid)
    salariesDb.push({
      id: `SAL-2026-${String(idx * 4 + 1).padStart(4, "0")}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      department: teacher.department,
      email: teacher.email,
      phone: teacher.mobile || teacher.phone || "9876543210",
      month: "2026-03",
      monthlySalary,
      perDaySalary,
      totalWorkingDays: 22,
      presentDays: 22,
      absentDays: 0,
      leaveDays: 1,
      unpaidLeaveDays: 0,
      halfDayDays: 0,
      deductions: 0,
      finalSalary: monthlySalary,
      status: "Paid",
      paymentDate: "2026-03-28",
      paymentMethod: "Bank Transfer"
    });

    // Seed April 2026 (Paid)
    const aprilAbsents = 1;
    const aprilDeductions = Math.round((aprilAbsents * perDaySalary) * 100) / 100;
    salariesDb.push({
      id: `SAL-2026-${String(idx * 4 + 2).padStart(4, "0")}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      department: teacher.department,
      email: teacher.email,
      phone: teacher.mobile || teacher.phone || "9876543210",
      month: "2026-04",
      monthlySalary,
      perDaySalary,
      totalWorkingDays: 22,
      presentDays: 21,
      absentDays: aprilAbsents,
      leaveDays: 0,
      unpaidLeaveDays: 0,
      halfDayDays: 0,
      deductions: aprilDeductions,
      finalSalary: monthlySalary - aprilDeductions,
      status: "Paid",
      paymentDate: "2026-04-29",
      paymentMethod: "Bank Transfer"
    });

    // Seed May 2026 (Paid)
    salariesDb.push({
      id: `SAL-2026-${String(idx * 4 + 3).padStart(4, "0")}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      department: teacher.department,
      email: teacher.email,
      phone: teacher.mobile || teacher.phone || "9876543210",
      month: "2026-05",
      monthlySalary,
      perDaySalary,
      totalWorkingDays: 22,
      presentDays: 23,
      absentDays: 0,
      leaveDays: 0,
      unpaidLeaveDays: 0,
      halfDayDays: 0,
      deductions: 0,
      finalSalary: monthlySalary,
      status: "Paid",
      paymentDate: "2026-05-30",
      paymentMethod: "Bank Transfer"
    });

    // Seed June 2026 (Pending)
    const juneAbsents = idx % 2 === 0 ? 1 : 0;
    const juneLeaves = idx % 3 === 0 ? 1 : 0;
    const junePresents = 22 - juneAbsents - juneLeaves;
    const juneDeductions = Math.round((juneAbsents * perDaySalary) * 100) / 100;
    salariesDb.push({
      id: `SAL-2026-${String(idx * 4 + 4).padStart(4, "0")}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      department: teacher.department,
      email: teacher.email,
      phone: teacher.mobile || teacher.phone || "9876543210",
      month: "2026-06",
      monthlySalary,
      perDaySalary,
      totalWorkingDays: 22,
      presentDays: junePresents,
      absentDays: juneAbsents,
      leaveDays: juneLeaves,
      unpaidLeaveDays: 0,
      halfDayDays: 0,
      deductions: juneDeductions,
      finalSalary: monthlySalary - juneDeductions,
      status: "Pending",
      paymentDate: "",
      paymentMethod: ""
    });
  });

  // 3. Seed General School Expenses
  expensesDb = [
    {
      id: "EXP-001",
      title: "School Bus Diesel & Service",
      category: "Transport Expenses",
      amount: 1200,
      date: "2026-05-18",
      remarks: "Monthly fleet fueling and maintenance checks"
    },
    {
      id: "EXP-002",
      title: "Monthly Campus Power Bill",
      category: "Electricity Expenses",
      amount: 450,
      date: "2026-05-15",
      remarks: "Main blocks power usage"
    },
    {
      id: "EXP-003",
      title: "Administrative Staff Salaries",
      category: "Staff Salaries",
      amount: 3500,
      date: "2026-05-28",
      remarks: "Admissions, accounting, and security salaries"
    },
    {
      id: "EXP-004",
      title: "Science Lab Desk Repair",
      category: "Maintenance Expenses",
      amount: 350,
      date: "2026-06-02",
      remarks: "Replaced tabletops and cabinet hinges"
    },
    {
      id: "EXP-005",
      title: "Monthly Campus Power Bill",
      category: "Electricity Expenses",
      amount: 420,
      date: "2026-06-04",
      remarks: "Main blocks power usage"
    }
  ];

  isSeeded = true;
};

export const syncSalariesWithAttendance = () => {
  const attDb = getAttendanceDb() || [];
  
  salariesDb.forEach((record) => {
    const yearMonth = record.month; // e.g. "2026-06"
    
    // Filter attendance records matching the target month and targetType === "teacher"
    const monthAttRecords = attDb.filter(
      (a) => a.targetType === "teacher" && a.date.startsWith(yearMonth)
    );
    
    if (monthAttRecords.length === 0) {
      return;
    }
    
    let totalWorkingDays = monthAttRecords.length;
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let unpaidLeaveDays = 0;
    let halfDayDays = 0;
    
    monthAttRecords.forEach((att) => {
      const teacherRec = att.records.find((r) => r.studentId === record.teacherId);
      if (teacherRec) {
        if (teacherRec.status === "Present") {
          presentDays++;
        } else if (teacherRec.status === "Absent") {
          absentDays++;
        } else if (teacherRec.status === "Leave" || teacherRec.status === "Paid Leave") {
          leaveDays++;
        } else if (teacherRec.status === "Unpaid Leave") {
          leaveDays++;
          unpaidLeaveDays++;
        } else if (teacherRec.status === "Half Day") {
          halfDayDays++;
        }
      }
    });
    
    // Update the record fields dynamically!
    record.totalWorkingDays = totalWorkingDays || 22; // default fallback to 22 if no attendance records exist for this month
    record.presentDays = presentDays;
    record.absentDays = absentDays;
    record.leaveDays = leaveDays;
    record.unpaidLeaveDays = unpaidLeaveDays;
    record.halfDayDays = halfDayDays;
    
    // Calculate deductions: absentDays + unpaidLeaveDays + 0.5 * halfDayDays
    const dedDays = absentDays + unpaidLeaveDays + 0.5 * halfDayDays;
    const deductions = Math.round((dedDays * record.perDaySalary) * 100) / 100;
    
    // If the salary is already Paid, the deductions were saved at the time of payment.
    // However, if the requirement is that modifying attendance for previous dates should recalculate Paid salaries too:
    record.deductions = deductions;
    record.finalSalary = record.monthlySalary - deductions;
  });
};


// ================= STUDENTS FEES SERVICES =================

export const fetchStudentFeeDetails = async (studentId) => {
  seedFinanceData();
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const found = feesDb.find((f) => f.studentId === studentId);
      if (found) {
        resolve({ success: true, data: JSON.parse(JSON.stringify(found)) });
      } else {
        reject(new Error("Fee record not found for student " + studentId));
      }
    }, 200);
  });
};

export const fetchClassStudentsFees = async (className) => {
  seedFinanceData();
  return new Promise((resolve) => {
    setTimeout(() => {
      const classRecords = feesDb.filter((f) => f.className === className);
      resolve({ success: true, data: JSON.parse(JSON.stringify(classRecords)) });
    }, 200);
  });
};

export const fetchPendingFeesList = async (className = "") => {
  seedFinanceData();
  return new Promise((resolve) => {
    setTimeout(() => {
      const pendingRecords = feesDb.filter(
        (f) => f.remainingAmount > 0 && (!className || f.className === className)
      );
      resolve({ success: true, data: JSON.parse(JSON.stringify(pendingRecords)) });
    }, 200);
  });
};

export const collectPayment = async (studentId, paymentData) => {
  seedFinanceData();
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = feesDb.findIndex((f) => f.studentId === studentId);
      if (idx !== -1) {
        const record = feesDb[idx];
        const amountPaidNow = Number(paymentData.amount);

        if (amountPaidNow <= 0) {
          reject(new Error("Payment amount must be greater than zero"));
          return;
        }

        if (amountPaidNow > record.remainingAmount) {
          reject(new Error(`Payment amount exceeds remaining due of ₹${record.remainingAmount}`));
          return;
        }

        const receiptNo = `REC-2026-${String(paymentsDb.length + 1).padStart(4, "0")}`;
        const newPayment = {
          receiptNo,
          studentId: record.studentId,
          studentName: record.studentName,
          className: record.className,
          amount: amountPaidNow,
          paymentDate: paymentData.paymentDate || new Date().toISOString().split("T")[0],
          paymentMethod: paymentData.paymentMethod,
          remarks: paymentData.remarks || ""
        };

        record.paidAmount += amountPaidNow;
        record.remainingAmount = record.totalFee - record.paidAmount;
        record.status = record.remainingAmount === 0 ? "Paid" : "Partial";
        record.lastPaymentDate = newPayment.paymentDate;
        record.payments.push(newPayment);

        paymentsDb.push(newPayment);

        resolve({
          success: true,
          data: JSON.parse(JSON.stringify(record)),
          receipt: newPayment
        });
      } else {
        reject(new Error("Fee record not found for student " + studentId));
      }
    }, 300);
  });
};

export const fetchReports = async (filters = {}) => {
  seedFinanceData();
  return new Promise((resolve) => {
    setTimeout(() => {
      const { className, studentId, startDate, endDate, status } = filters;
      let filteredRecords = feesDb;

      if (className) {
        filteredRecords = filteredRecords.filter((f) => f.className === className);
      }
      if (studentId) {
        filteredRecords = filteredRecords.filter((f) => f.studentId === studentId);
      }
      if (status) {
        filteredRecords = filteredRecords.filter((f) => f.status === status);
      }

      const totalPending = filteredRecords.reduce((acc, f) => acc + f.remainingAmount, 0);
      const totalPaid = filteredRecords.reduce((acc, f) => acc + f.paidAmount, 0);

      const studentsPaid = filteredRecords.filter((f) => f.status === "Paid").length;
      const studentsPending = filteredRecords.filter((f) => f.remainingAmount > 0).length;

      let filteredPayments = paymentsDb;
      if (className) {
        filteredPayments = filteredPayments.filter((p) => p.className === className);
      }
      if (studentId) {
        filteredPayments = filteredPayments.filter((p) => p.studentId === studentId);
      }
      if (startDate) {
        filteredPayments = filteredPayments.filter((p) => p.paymentDate >= startDate);
      }
      if (endDate) {
        filteredPayments = filteredPayments.filter((p) => p.paymentDate <= endDate);
      }

      const totalCollection = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

      resolve({
        success: true,
        data: {
          records: JSON.parse(JSON.stringify(filteredRecords)),
          payments: JSON.parse(JSON.stringify(filteredPayments)),
          summary: {
            totalCollection,
            totalPending,
            totalPaid,
            studentsPaid,
            studentsPending
          }
        }
      });
    }, 300);
  });
};

export const fetchTotalCollection = async () => {
  seedFinanceData();
  return new Promise((resolve) => {
    setTimeout(() => {
      const totalCollection = paymentsDb.reduce((acc, p) => acc + p.amount, 0);
      resolve({ success: true, data: totalCollection });
    }, 100);
  });
};

// ================= TEACHER SALARIES SERVICES =================

export const fetchTeacherSalaries = async (month = "") => {
  seedFinanceData();
  syncSalariesWithAttendance();
  return new Promise((resolve) => {
    setTimeout(() => {
      const targetMonth = month || "2026-06";
      let records = salariesDb.filter((s) => s.month === targetMonth);
      
      // Auto-generate records as Pending if they don't exist yet for the selected month
      if (records.length === 0) {
        const teachers = getMockTeachers() || [];
        const baseSalaries = { T001: 4500, T002: 4200, T003: 3800, T004: 3600 };
        
        teachers.forEach((t, idx) => {
          const monthlySalary = baseSalaries[t.id] || 3500;
          const perDaySalary = Math.round((monthlySalary / 30) * 100) / 100;
          const newRecord = {
            id: `SAL-${targetMonth.replace("-", "")}-${String(idx + 1).padStart(4, "0")}`,
            teacherId: t.id,
            teacherName: t.name,
            department: t.department,
            email: t.email,
            phone: t.mobile || t.phone || "9876543210",
            month: targetMonth,
            monthlySalary,
            perDaySalary,
            totalWorkingDays: 22,
            presentDays: 22,
            absentDays: 0,
            leaveDays: 0,
            unpaidLeaveDays: 0,
            halfDayDays: 0,
            deductions: 0,
            finalSalary: monthlySalary,
            status: "Pending",
            paymentDate: "",
            paymentMethod: ""
          };
          salariesDb.push(newRecord);
        });
        syncSalariesWithAttendance();
        records = salariesDb.filter((s) => s.month === targetMonth);
      }
      
      resolve({ success: true, data: JSON.parse(JSON.stringify(records)) });
    }, 200);
  });
};

export const paySalary = async (recordId, paymentData) => {
  seedFinanceData();
  syncSalariesWithAttendance();
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = salariesDb.findIndex((s) => s.id === recordId);
      if (idx !== -1) {
        const record = salariesDb[idx];
        if (record.status === "Paid") {
          reject(new Error("Salary has already been processed for this record."));
          return;
        }

        record.status = "Paid";
        record.paymentDate = paymentData.paymentDate || new Date().toISOString().split("T")[0];
        record.paymentMethod = paymentData.paymentMethod || "Bank Transfer";
        record.deductions = Number(paymentData.deductions || 0);
        record.finalSalary = record.monthlySalary - record.deductions;

        resolve({
          success: true,
          data: JSON.parse(JSON.stringify(record))
        });
      } else {
        reject(new Error("Salary record not found."));
      }
    }, 300);
  });
};

export const fetchSalaryHistory = async () => {
  seedFinanceData();
  syncSalariesWithAttendance();
  return new Promise((resolve) => {
    setTimeout(() => {
      const history = salariesDb.filter((s) => s.status === "Paid");
      resolve({ success: true, data: JSON.parse(JSON.stringify(history)) });
    }, 200);
  });
};

// ================= GENERAL FINANCE REPORTS =================

export const fetchFinanceReportSummary = async (filters = {}) => {
  seedFinanceData();
  syncSalariesWithAttendance();
  return new Promise((resolve) => {
    setTimeout(() => {
      const { startDate, endDate } = filters;

      // Filter collections
      let filteredPayments = paymentsDb;
      if (startDate) {
        filteredPayments = filteredPayments.filter((p) => p.paymentDate >= startDate);
      }
      if (endDate) {
        filteredPayments = filteredPayments.filter((p) => p.paymentDate <= endDate);
      }
      const totalCollection = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

      // Filter paid salaries
      let filteredSalaries = salariesDb.filter((s) => s.status === "Paid");
      if (startDate) {
        filteredSalaries = filteredSalaries.filter((s) => s.paymentDate >= startDate);
      }
      if (endDate) {
        filteredSalaries = filteredSalaries.filter((s) => s.paymentDate <= endDate);
      }
      const totalSalaries = filteredSalaries.reduce((acc, s) => acc + s.finalSalary, 0);

      // Filter general expenses
      let filteredExpenses = expensesDb;
      if (startDate) {
        filteredExpenses = filteredExpenses.filter((e) => e.date >= startDate);
      }
      if (endDate) {
        filteredExpenses = filteredExpenses.filter((e) => e.date <= endDate);
      }
      const totalGeneralExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

      const totalExpenses = totalSalaries + totalGeneralExpenses;
      const netBalance = totalCollection - totalExpenses;

      // Compile expense breakdown
      const expenseBreakdown = {
        "Teacher Salaries": totalSalaries,
        "Staff Salaries": filteredExpenses
          .filter((e) => e.category === "Staff Salaries")
          .reduce((acc, e) => acc + e.amount, 0),
        "Transport Expenses": filteredExpenses
          .filter((e) => e.category === "Transport Expenses")
          .reduce((acc, e) => acc + e.amount, 0),
        "Electricity Expenses": filteredExpenses
          .filter((e) => e.category === "Electricity Expenses")
          .reduce((acc, e) => acc + e.amount, 0),
        "Maintenance Expenses": filteredExpenses
          .filter((e) => e.category === "Maintenance Expenses")
          .reduce((acc, e) => acc + e.amount, 0),
        "Other Expenses": filteredExpenses
          .filter(
            (e) =>
              ![
                "Staff Salaries",
                "Transport Expenses",
                "Electricity Expenses",
                "Maintenance Expenses"
              ].includes(e.category)
          )
          .reduce((acc, e) => acc + e.amount, 0)
      };

      // Compile all ledger transactions
      const transactions = [];

      // Add collections (incomes)
      filteredPayments.forEach((p) => {
        transactions.push({
          id: p.receiptNo,
          type: "Income",
          category: "Student Fees",
          description: `Fee Collection - ${p.studentName} (${p.studentId})`,
          amount: p.amount,
          date: p.paymentDate,
          method: p.paymentMethod
        });
      });

      // Add salaries (outgoings)
      filteredSalaries.forEach((s) => {
        transactions.push({
          id: s.id,
          type: "Outgoing",
          category: "Teacher Salaries",
          description: `Salary Paid - ${s.teacherName} (${s.teacherId})`,
          amount: s.finalSalary,
          date: s.paymentDate,
          method: s.paymentMethod
        });
      });

      // Add general expenses (outgoings)
      filteredExpenses.forEach((e) => {
        transactions.push({
          id: e.id,
          type: "Outgoing",
          category: e.category,
          description: e.title + (e.remarks ? ` - ${e.remarks}` : ""),
          amount: e.amount,
          date: e.date,
          method: "Bank Transfer" // Standard for bills
        });
      });

      // Sort transactions by date descending
      transactions.sort((a, b) => b.date.localeCompare(a.date));

      resolve({
        success: true,
        data: {
          summary: {
            totalCollection,
            totalSalaries,
            totalExpenses,
            netBalance
          },
          expensesList: JSON.parse(JSON.stringify(filteredExpenses)),
          expenseBreakdown,
          transactions
        }
      });
    }, 300);
  });
};

export const addExpense = async (expenseData) => {
  seedFinanceData();
  return new Promise((resolve) => {
    setTimeout(() => {
      const newExpense = {
        id: `EXP-${String(expensesDb.length + 1).padStart(3, "0")}`,
        title: expenseData.title,
        category: expenseData.category || "Other Expenses",
        amount: Number(expenseData.amount),
        date: expenseData.date || new Date().toISOString().split("T")[0],
        remarks: expenseData.remarks || ""
      };
      expensesDb.push(newExpense);
      resolve({ success: true, data: newExpense });
    }, 200);
  });
};
