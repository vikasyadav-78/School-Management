import { api } from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";
import * as mockService from "./teacher.mock";
import { USE_MOCK } from "@/constants";

export const getList = async (params) => {
  if (USE_MOCK) {
    return mockService.fetchAll(params);
  }
  const response = await api.get(ENDPOINTS.TEACHERS.BASE, { params });
  return response.data;
};

export const getById = async (id) => {
  if (USE_MOCK) {
    return mockService.fetchById(id);
  }
  const response = await api.get(ENDPOINTS.TEACHERS.DETAIL(id));
  return response.data;
};

export const createItem = async (data) => {
  if (USE_MOCK) {
    return mockService.create(data);
  }
  const response = await api.post(ENDPOINTS.TEACHERS.BASE, data);
  return response.data;
};

export const updateItem = async (id, data) => {
  if (USE_MOCK) {
    return mockService.update(id, data);
  }
  const response = await api.put(ENDPOINTS.TEACHERS.DETAIL(id), data);
  return response.data;
};

export const deleteItem = async (id) => {
  if (USE_MOCK) {
    return mockService.remove(id);
  }
  const response = await api.delete(ENDPOINTS.TEACHERS.DETAIL(id));
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/teacher/profile");
  return response.data;
};

export const getAttendanceClasses = async () => {
  const response = await api.get("/teacher/attendance/classes");
  return response.data;
};

export const getMyAttendance = async () => {
  const response = await api.get("/teacher/my-attendance");
  return response.data;
};

export const changeTeacherPassword = async (payload) => {
  const response = await api.post("/teacher/change-password", payload);
  return response.data;
};

export const getAttendanceRoster = async (params) => {
  const response = await api.get("/teacher/attendance", { params });
  return response.data;
};

export const saveAttendanceRoster = async (data) => {
  const response = await api.post("/teacher/attendance", data);
  return response.data;
};

export const getAttendanceHistory = async (params) => {
  const response = await api.get("/teacher/attendance/history", { params });
  return response.data;
};

export const qrLookup = async (data) => {
  const response = await api.post("/teacher/attendance/qr-lookup", data);
  return response.data; 
};

export const qrMark = async (data) => {
  const response = await api.post("/teacher/attendance/qr-mark", data);
  return response.data;
};

export const quickQrScan = async (data) => {
  const response = await api.post("/attendance/qr-scan", data);
  return response.data;
};

export const getTeacherTimetable = async () => {
  const response = await api.get("/teacher/timetable");
  return response.data;
};

// Homework API calls
export const getHomeworkClasses = async () => {
  const response = await api.get("/teacher/homework/classes");
  return response.data;
};

export const getHomeworkList = async (params) => {
  const response = await api.get("/teacher/homework", { params });
  return response.data;
};

export const getHomeworkDetail = async (id) => {
  const response = await api.get(`/teacher/homework/${id}`);
  return response.data;
};

export const createHomework = async (formData) => {
  const response = await api.post("/teacher/homework", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const gradeHomeworkSubmission = async (homeworkId, submissionId, gradeData) => {
  const response = await api.post(`/teacher/homework/${homeworkId}/submissions/${submissionId}/grade`, gradeData);
  return response.data;
};

// Class Notes API calls
export const getClassNotesClasses = async () => {
  const response = await api.get("/teacher/class-notes/classes");
  return response.data;
};

export const getClassNotesList = async (params) => {
  const response = await api.get("/teacher/class-notes", { params });
  return response.data;
};

export const getClassNotesDetail = async (id) => {
  const response = await api.get(`/teacher/class-notes/${id}`);
  return response.data;
};

export const createClassNotes = async (formData) => {
  const response = await api.post("/teacher/class-notes", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const deleteClassNotes = async (id) => {
  const response = await api.delete(`/teacher/class-notes/${id}`);
  return response.data;
};

export const getTeacherHolidays = async () => {
  const response = await api.get("/teacher/holidays");
  return response.data;
};

export const getTeacherHolidayDetail = async (id) => {
  const response = await api.get(`/teacher/holidays/${id}`);
  return response.data;
};

// Teacher Marks Entry API calls
export const getTeacherExams = async () => {
  const response = await api.get("/teacher/marks/exams");
  return response.data;
};

export const getTeacherClassRoster = async (examId, classId, sectionId) => {
  const response = await api.get(`/teacher/marks/${examId}/class`, {
    params: { class_id: classId, section_id: sectionId }
  });
  return response.data;
};

export const saveTeacherClassMarks = async (examId, payload) => {
  const response = await api.post(`/teacher/marks/${examId}/class`, payload);
  return response.data;
};

export const getTeacherStudentMarks = async (examId, studentId) => {
  const response = await api.get(`/teacher/marks/${examId}/student/${studentId}`);
  return response.data;
};

export const saveTeacherStudentMarks = async (examId, studentId, payload) => {
  const response = await api.post(`/teacher/marks/${examId}/student/${studentId}`, payload);
  return response.data;
};

// Teacher Student management endpoints
export const getTeacherStudentsMeta = async () => {
  const response = await api.get("/teacher/students/meta");
  return response.data;
};

export const getTeacherStudents = async (params) => {
  const response = await api.get("/teacher/students", { params });
  return response.data;
};

export const addTeacherStudent = async (payload) => {
  const response = await api.post("/teacher/students", payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const getTeacherStudentDetail = async (studentId) => {
  const response = await api.get(`/teacher/students/${studentId}`);
  return response.data;
};

export const updateTeacherStudent = async (studentId, payload) => {
  const response = await api.post(`/teacher/students/${studentId}`, payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const toggleTeacherStudentStatus = async (studentId) => {
  const response = await api.post(`/teacher/students/${studentId}/toggle-status`);
  return response.data;
};

export const getTeacherStudentIdCard = async (studentId) => {
  const response = await api.get(`/teacher/students/${studentId}/id-card`);
  return response.data;
};

// Staff APIs
export const getTeacherStaffMeta = async () => {
  const response = await api.get("/teacher/staff/meta");
  return response.data;
};

export const getTeacherStaff = async (params = {}) => {
  const response = await api.get("/teacher/staff", { params });
  return response.data;
};

export const getTeacherStaffDetail = async (staffId) => {
  const response = await api.get(`/teacher/staff/${staffId}`);
  return response.data;
};

export const addTeacherStaff = async (payload) => {
  const response = await api.post("/teacher/staff", payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const updateTeacherStaff = async (staffId, payload) => {
  const response = await api.post(`/teacher/staff/${staffId}`, payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const toggleTeacherStaffStatus = async (staffId) => {
  const response = await api.post(`/teacher/staff/${staffId}/toggle-status`);
  return response.data;
};

export const getTeacherStaffIdCard = async (staffId, params = {}) => {
  const response = await api.get(`/teacher/staff/${staffId}/id-card`, { params });
  return response.data;
};

export const printTeacherStaffIdCard = async (staffId, params = {}) => {
  const response = await api.get(`/teacher/staff/${staffId}/id-card`, {
    params: { ...params, format: "print" },
    responseType: "text"
  });
  return response.data;
};

// Subjects APIs
export const getTeacherSubjects = async (params = {}) => {
  const response = await api.get("/teacher/subjects", { params });
  return response.data;
};

export const addTeacherSubject = async (payload) => {
  const response = await api.post("/teacher/subjects", payload);
  return response.data;
};

export const updateTeacherSubject = async (subjectId, payload) => {
  const response = await api.post(`/teacher/subjects/${subjectId}`, payload);
  return response.data;
};

export const toggleTeacherSubjectStatus = async (subjectId) => {
  const response = await api.post(`/teacher/subjects/${subjectId}/toggle-status`);
  return response.data;
};

// Academic Years APIs
export const getTeacherAcademicYears = async () => {
  const response = await api.get("/teacher/academic-years");
  return response.data;
};

export const addTeacherAcademicYear = async (payload) => {
  const response = await api.post("/teacher/academic-years", payload);
  return response.data;
};

export const updateTeacherAcademicYear = async (yearId, payload) => {
  const response = await api.post(`/teacher/academic-years/${yearId}`, payload);
  return response.data;
};

export const setTeacherCurrentAcademicYear = async (yearId) => {
  const response = await api.post(`/teacher/academic-years/${yearId}/set-current`);
  return response.data;
};

// Manage Notices APIs
export const getTeacherManageNoticesMeta = async () => {
  const response = await api.get("/teacher/manage/notices/meta");
  return response.data;
};

export const getTeacherManageNotices = async (params = {}) => {
  const response = await api.get("/teacher/manage/notices", { params });
  return response.data;
};

export const addTeacherManageNotice = async (payload) => {
  const response = await api.post("/teacher/manage/notices", payload);
  return response.data;
};

export const deleteTeacherManageNotice = async (noticeId) => {
  const response = await api.delete(`/teacher/manage/notices/${noticeId}`);
  return response.data;
};

// Manage Holidays APIs
export const getTeacherManageHolidays = async () => {
  const response = await api.get("/teacher/manage/holidays");
  return response.data;
};

export const addTeacherManageHoliday = async (payload) => {
  const response = await api.post("/teacher/manage/holidays", payload);
  return response.data;
};

export const deleteTeacherManageHoliday = async (holidayId) => {
  const response = await api.delete(`/teacher/manage/holidays/${holidayId}`);
  return response.data;
};

// Manage Leave APIs
export const getTeacherManageLeaves = async (params = {}) => {
  const response = await api.get("/teacher/manage/leaves", { params });
  return response.data;
};

export const approveTeacherManageLeave = async (leaveId, payload = {}) => {
  const response = await api.post(`/teacher/manage/leaves/${leaveId}/approve`, payload);
  return response.data;
};

export const rejectTeacherManageLeave = async (leaveId, payload = {}) => {
  const response = await api.post(`/teacher/manage/leaves/${leaveId}/reject`, payload);
  return response.data;
};

// Classes & Sections APIs
export const getTeacherClassesMeta = async () => {
  const response = await api.get("/teacher/classes/meta");
  return response.data;
};

export const getTeacherClasses = async (params = {}) => {
  const response = await api.get("/teacher/classes", { params });
  return response.data;
};

export const addTeacherClass = async (payload) => {
  const response = await api.post("/teacher/classes", payload);
  return response.data;
};

export const getTeacherClassDetail = async (classId) => {
  const response = await api.get(`/teacher/classes/${classId}`);
  return response.data;
};

export const updateTeacherClass = async (classId, payload) => {
  const response = await api.post(`/teacher/classes/${classId}`, payload);
  return response.data;
};

export const toggleTeacherClassStatus = async (classId) => {
  const response = await api.post(`/teacher/classes/${classId}/toggle-status`);
  return response.data;
};

export const deleteTeacherClass = async (classId) => {
  const response = await api.delete(`/teacher/classes/${classId}`);
  return response.data;
};

export const addTeacherClassSection = async (classId, payload) => {
  const response = await api.post(`/teacher/classes/${classId}/sections`, payload);
  return response.data;
};

export const assignTeacherClassSubject = async (classId, payload) => {
  const response = await api.post(`/teacher/classes/${classId}/subjects`, payload);
  return response.data;
};

export const getTeacherSectionDetail = async (sectionId) => {
  const response = await api.get(`/teacher/sections/${sectionId}`);
  return response.data;
};

export const updateTeacherSection = async (sectionId, payload) => {
  const response = await api.post(`/teacher/sections/${sectionId}`, payload);
  return response.data;
};

export const deleteTeacherSection = async (sectionId) => {
  const response = await api.delete(`/teacher/sections/${sectionId}`);
  return response.data;
};

export const generateTeacherSectionRollNumbers = async (sectionId) => {
  const response = await api.post(`/teacher/sections/${sectionId}/generate-roll-numbers`);
  return response.data;
};

export const updateTeacherClassSubject = async (classSubjectId, payload) => {
  const response = await api.post(`/teacher/class-subjects/${classSubjectId}`, payload);
  return response.data;
};

export const deleteTeacherClassSubject = async (classSubjectId) => {
  const response = await api.delete(`/teacher/class-subjects/${classSubjectId}`);
  return response.data;
};

// Fees APIs
export const getTeacherFeesMeta = async () => {
  const response = await api.get("/teacher/fees/meta");
  return response.data;
};

export const getTeacherFees = async (params = {}) => {
  const response = await api.get("/teacher/fees", { params });
  return response.data;
};

export const getTeacherFeeStructures = async (params = {}) => {
  const response = await api.get("/teacher/fees/structures", { params });
  return response.data;
};

export const addTeacherFeeStructure = async (payload) => {
  const response = await api.post("/teacher/fees/structures", payload);
  return response.data;
};

export const deleteTeacherFeeStructure = async (structureId) => {
  const response = await api.delete(`/teacher/fees/structures/${structureId}`);
  return response.data;
};

export const assignTeacherFee = async (payload) => {
  const response = await api.post("/teacher/fees/assign", payload);
  return response.data;
};

export const bulkAssignTeacherFee = async (payload) => {
  const response = await api.post("/teacher/fees/assign-bulk", payload);
  return response.data;
};

export const recordTeacherFeePayment = async (paymentId, payload) => {
  const response = await api.post(`/teacher/fees/payments/${paymentId}/record`, payload);
  return response.data;
};

export const deleteTeacherFeePayment = async (paymentId) => {
  const response = await api.delete(`/teacher/fees/payments/${paymentId}`);
  return response.data;
};

export const remindTeacherFee = async (payload = {}) => {
  const response = await api.post("/teacher/fees/remind", payload);
  return response.data;
};

export const getTeacherLateFeeRules = async (params = {}) => {
  const response = await api.get("/teacher/fees/late-fee-rules", { params });
  return response.data;
};

export const saveTeacherLateFeeRule = async (payload) => {
  const response = await api.post("/teacher/fees/late-fee-rules", payload);
  return response.data;
};

export const clearTeacherLateFeeRule = async (payload) => {
  const response = await api.delete("/teacher/fees/late-fee-rules", { data: payload });
  return response.data;
};

export const deleteTeacherLateFeeRuleHistory = async (ruleId) => {
  const response = await api.delete(`/teacher/fees/late-fee-rules/${ruleId}`);
  return response.data;
};

// Certificates APIs
export const getTeacherCertificatesMeta = async () => {
  const response = await api.get("/teacher/certificates/meta");
  return response.data;
};

export const getTeacherCertificates = async (params = {}) => {
  const response = await api.get("/teacher/certificates", { params });
  return response.data;
};

export const addTeacherCertificate = async (payload) => {
  const response = await api.post("/teacher/certificates", payload);
  return response.data;
};

export const downloadTeacherCertificate = async (certOrId) => {
  const certId = typeof certOrId === "object" ? certOrId.id : certOrId;
  const certNo = typeof certOrId === "object" ? (certOrId.certificate_no || certOrId.type_label || "Certificate") : `Certificate_${String(certId).slice(0, 8)}`;
  const endpoint = `/teacher/certificates/${certId}/download`;

  try {
    // Authenticated blob request (passes Authorization Bearer token header)
    const response = await api.get(endpoint, { responseType: "blob" });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${certNo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    return { success: true };
  } catch (err) {
    // Fallback attempt: HTML print window
    const textRes = await api.get(endpoint, { params: { format: "print" }, responseType: "text" });
    const printWindow = window.open("", "_blank");
    printWindow.document.write(textRes.data);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
    return { success: true };
  }
};

// Manage Live Classes APIs
export const getTeacherManageLiveClassesMeta = async () => {
  const response = await api.get("/teacher/manage/live-classes/meta");
  return response.data;
};

export const getTeacherManageLiveClasses = async (params = {}) => {
  const response = await api.get("/teacher/manage/live-classes", { params });
  return response.data;
};

export const addTeacherManageLiveClass = async (payload) => {
  const response = await api.post("/teacher/manage/live-classes", payload);
  return response.data;
};

export const getTeacherManageLiveClassDetail = async (liveClassId) => {
  const response = await api.get(`/teacher/manage/live-classes/${liveClassId}`);
  return response.data;
};

export const deleteTeacherManageLiveClass = async (liveClassId) => {
  const response = await api.delete(`/teacher/manage/live-classes/${liveClassId}`);
  return response.data;
};

// Teacher Live Class Reports APIs
export const getTeacherLiveClassReports = async (params = {}) => {
  const response = await api.get("/teacher/live-classes/reports", { params });
  return response.data;
};

export const getTeacherLiveClassReportDetail = async (liveClassId) => {
  const response = await api.get(`/teacher/live-classes/reports/${liveClassId}`);
  return response.data;
};

// Manage Timetable APIs
export const getTeacherManageTimetableMeta = async () => {
  const response = await api.get("/teacher/manage/timetable/meta");
  return response.data;
};

export const getTeacherManageTimetable = async (params = {}) => {
  const response = await api.get("/teacher/manage/timetable", { params });
  return response.data;
};

export const getTeacherManageTimetableTeacherSchedule = async (params = {}) => {
  const response = await api.get("/teacher/manage/timetable/teacher", { params });
  return response.data;
};

export const saveTeacherManageTimetableSlot = async (payload) => {
  const response = await api.post("/teacher/manage/timetable", payload);
  return response.data;
};

export const updateTeacherManageTimetableSlot = async (slotId, payload) => {
  const response = await api.post(`/teacher/manage/timetable/${slotId}`, payload);
  return response.data;
};

export const deleteTeacherManageTimetableSlot = async (slotId) => {
  const response = await api.delete(`/teacher/manage/timetable/${slotId}`);
  return response.data;
};

export const autoGenerateTeacherManageTimetable = async (payload = {}) => {
  const response = await api.post("/teacher/manage/timetable/auto-generate", payload);
  return response.data;
};

// Online MCQ APIs
export const getTeacherOnlineMcqMeta = async () => {
  const response = await api.get("/teacher/online-mcq/meta");
  return response.data;
};

export const getTeacherOnlineMcq = async (params = {}) => {
  const response = await api.get("/teacher/online-mcq", { params });
  return response.data;
};

export const addTeacherOnlineMcqExam = async (payload) => {
  const response = await api.post("/teacher/online-mcq", payload);
  return response.data;
};

export const getTeacherOnlineMcqExamDetail = async (examId) => {
  const response = await api.get(`/teacher/online-mcq/${examId}`);
  return response.data;
};

export const addTeacherOnlineMcqQuestion = async (examId, payload) => {
  const response = await api.post(`/teacher/online-mcq/${examId}/questions`, payload);
  return response.data;
};

export const deleteTeacherOnlineMcqQuestion = async (examId, questionId) => {
  const response = await api.delete(`/teacher/online-mcq/${examId}/questions/${questionId}`);
  return response.data;
};

export const publishTeacherOnlineMcqExam = async (examId) => {
  const response = await api.post(`/teacher/online-mcq/${examId}/publish`);
  return response.data;
};

export const deleteTeacherOnlineMcqExam = async (examId) => {
  const response = await api.delete(`/teacher/online-mcq/${examId}`);
  return response.data;
};

// Teacher Teachers (Create/Manage) APIs
export const getTeacherTeachersMeta = async () => {
  const response = await api.get("/teacher/teachers/meta");
  return response.data;
};

export const getTeacherTeachers = async (params = {}) => {
  const response = await api.get("/teacher/teachers", { params });
  return response.data;
};

export const addTeacherTeacher = async (payload) => {
  const isMultipart = payload instanceof FormData;
  const config = isMultipart ? { headers: { "Content-Type": undefined } } : {};
  const response = await api.post("/teacher/teachers", payload, config);
  return response.data;
};

export const getTeacherTeacherDetail = async (teacherId) => {
  const response = await api.get(`/teacher/teachers/${teacherId}`);
  return response.data;
};

export const updateTeacherTeacher = async (teacherId, payload) => {
  const isMultipart = payload instanceof FormData;
  const config = isMultipart ? { headers: { "Content-Type": undefined } } : {};
  const response = await api.post(`/teacher/teachers/${teacherId}`, payload, config);
  return response.data;
};

export const toggleTeacherTeacherStatus = async (teacherId) => {
  const response = await api.post(`/teacher/teachers/${teacherId}/toggle-status`);
  return response.data;
};

// Teacher Manage Teacher Attendance APIs
export const getTeacherManageTeacherAttendanceRoster = async (params = {}) => {
  const response = await api.get("/teacher/manage/teacher-attendance", { params });
  return response.data;
};

export const saveTeacherManageTeacherAttendance = async (payload) => {
  const response = await api.post("/teacher/manage/teacher-attendance", payload);
  return response.data;
};

export const getTeacherManageTeacherAttendanceHistory = async (params = {}) => {
  const response = await api.get("/teacher/manage/teacher-attendance/history", { params });
  return response.data;
};

// Teacher Payroll APIs
export const getTeacherPayrollPending = async (params = {}) => {
  const response = await api.get("/teacher/payroll", { params });
  return response.data;
};

export const getTeacherPayrollHistory = async (params = {}) => {
  const response = await api.get("/teacher/payroll/history", { params });
  return response.data;
};

export const generateTeacherPayroll = async (payload) => {
  const response = await api.post("/teacher/payroll/generate", payload);
  return response.data;
};

export const getTeacherPayrollDetail = async (payrollId) => {
  const response = await api.get(`/teacher/payroll/${payrollId}`);
  return response.data;
};

export const saveTeacherPayrollDeductions = async (payrollId, payload) => {
  const response = await api.post(`/teacher/payroll/${payrollId}/deductions`, payload);
  return response.data;
};

export const markTeacherPayrollPaid = async (payrollId, payload) => {
  const response = await api.post(`/teacher/payroll/${payrollId}/mark-paid`, payload);
  return response.data;
};

export const getTeacherPayrollReceipt = async (payrollId) => {
  const response = await api.get(`/teacher/payroll/${payrollId}/receipt`);
  return response.data;
};


