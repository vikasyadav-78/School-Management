import { api } from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";
import * as mockService from "@/features/teachers/services/teacher.mock";
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
  const response = await api.get("/admin/profile");
  return response.data;
};

export const getAttendanceClasses = async () => {
  const response = await api.get("/admin/attendance/classes");
  return response.data;
};

export const getMyAttendance = async () => {
  const response = await api.get("/admin/my-attendance");
  return response.data;
};

export const changeTeacherPassword = async (payload) => {
  const response = await api.post("/admin/change-password", payload);
  return response.data;
};

export const getAttendanceRoster = async (params) => {
  const response = await api.get("/admin/attendance", { params });
  return response.data;
};

export const saveAttendanceRoster = async (data) => {
  const response = await api.post("/admin/attendance", data);
  return response.data;
};

export const getAttendanceHistory = async (params) => {
  const response = await api.get("/admin/attendance/history", { params });
  return response.data;
};

export const qrLookup = async (data) => {
  const response = await api.post("/admin/attendance/qr-lookup", data);
  return response.data; 
};

export const qrMark = async (data) => {
  const response = await api.post("/admin/attendance/qr-mark", data);
  return response.data;
};

export const quickQrScan = async (data) => {
  const response = await api.post("/attendance/qr-scan", data);
  return response.data;
};

export const getTeacherTimetable = async () => {
  const response = await api.get("/admin/timetable");
  return response.data;
};

// Homework API calls
export const getHomeworkClasses = async () => {
  const response = await api.get("/admin/homework/classes");
  return response.data;
};

export const getHomeworkList = async (params) => {
  const response = await api.get("/admin/homework", { params });
  return response.data;
};

export const getHomeworkDetail = async (id) => {
  const response = await api.get(`/admin/homework/${id}`);
  return response.data;
};

export const createHomework = async (formData) => {
  const response = await api.post("/admin/homework", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const gradeHomeworkSubmission = async (homeworkId, submissionId, gradeData) => {
  const response = await api.post(`/admin/homework/${homeworkId}/submissions/${submissionId}/grade`, gradeData);
  return response.data;
};

// Class Notes API calls
export const getClassNotesClasses = async () => {
  const response = await api.get("/admin/class-notes/meta");
  return response.data;
};

export const getClassNotesList = async (params) => {
  const response = await api.get("/admin/class-notes", { params });
  return response.data;
};

export const getClassNotesDetail = async (id) => {
  const response = await api.get(`/admin/class-notes/${id}`);
  return response.data;
};

export const createClassNotes = async (formData) => {
  const response = await api.post("/admin/class-notes", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const deleteClassNotes = async (id) => {
  const response = await api.delete(`/admin/class-notes/${id}`);
  return response.data;
};

export const getClassNotesReportsTeacher = async (params) => {
  const response = await api.get("/admin/class-notes/reports/teacher", { params });
  return response.data;
};

export const getClassNotesReportsClass = async (params) => {
  const response = await api.get("/admin/class-notes/reports/class", { params });
  return response.data;
};

export const getClassNotesReportsSubject = async (params) => {
  const response = await api.get("/admin/class-notes/reports/subject", { params });
  return response.data;
};

// Distributed Shared Notes & Papers Content API calls
export const getPlatformContentMeta = async () => {
  const response = await api.get("/admin/platform-content/meta");
  return response.data;
};

export const getPlatformContentList = async (params) => {
  const response = await api.get("/admin/platform-content", { params });
  return response.data;
};

export const getPlatformContentDetail = async (id) => {
  const response = await api.get(`/admin/platform-content/${id}`);
  return response.data;
};

export const getPlatformContentDownload = async (id) => {
  const response = await api.get(`/admin/platform-content/${id}/download`);
  return response.data;
};

// Question Bank APIs
export const getAdminQuestionBankMeta = async () => {
  const response = await api.get("/admin/question-bank/meta");
  return response.data;
};

export const getAdminQuestionBank = async (params = {}) => {
  const response = await api.get("/admin/question-bank", { params });
  return response.data;
};

export const addAdminQuestionBankQuestion = async (payload) => {
  const response = await api.post("/admin/question-bank", payload);
  return response.data;
};

export const importAdminQuestionBank = async (formData) => {
  const response = await api.post("/admin/question-bank/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const aiGenerateAdminQuestionBank = async (payload) => {
  const response = await api.post("/admin/question-bank/ai-generate", payload);
  return response.data;
};

export const deleteAdminQuestionBankQuestion = async (questionId) => {
  const response = await api.delete(`/admin/question-bank/${questionId}`);
  return response.data;
};

export const getTeacherQuestionBankMeta = getAdminQuestionBankMeta;
export const getTeacherQuestionBank = getAdminQuestionBank;
export const addTeacherQuestionBankQuestion = addAdminQuestionBankQuestion;
export const importTeacherQuestionBank = importAdminQuestionBank;
export const aiGenerateTeacherQuestionBank = aiGenerateAdminQuestionBank;
export const deleteTeacherQuestionBankQuestion = deleteAdminQuestionBankQuestion;

export const getTeacherHolidays = async () => {
  const response = await api.get("/admin/holidays");
  return response.data;
};

export const getTeacherHolidayDetail = async (id) => {
  const response = await api.get(`/admin/holidays/${id}`);
  return response.data;
};

// Teacher Marks Entry API calls
export const getTeacherExams = async () => {
  const response = await api.get("/admin/marks/exams");
  return response.data;
};

export const getTeacherClassRoster = async (examId, classId, sectionId) => {
  const response = await api.get(`/admin/marks/${examId}/class`, {
    params: { class_id: classId, section_id: sectionId }
  });
  return response.data;
};

export const saveTeacherClassMarks = async (examId, payload) => {
  const response = await api.post(`/admin/marks/${examId}/class`, payload);
  return response.data;
};

export const getTeacherStudentMarks = async (examId, studentId) => {
  const response = await api.get(`/admin/marks/${examId}/student/${studentId}`);
  return response.data;
};

export const saveTeacherStudentMarks = async (examId, studentId, payload) => {
  const response = await api.post(`/admin/marks/${examId}/student/${studentId}`, payload);
  return response.data;
};

// Teacher Student management endpoints
export const getTeacherStudentsMeta = async () => {
  const response = await api.get("/admin/students/meta");
  return response.data;
};

export const getTeacherStudents = async (params) => {
  const response = await api.get("/admin/students", { params });
  return response.data;
};

export const addTeacherStudent = async (payload) => {
  const response = await api.post("/admin/students", payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const getTeacherStudentDetail = async (studentId) => {
  const response = await api.get(`/admin/students/${studentId}`);
  return response.data;
};

export const updateTeacherStudent = async (studentId, payload) => {
  const response = await api.post(`/admin/students/${studentId}`, payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const toggleTeacherStudentStatus = async (studentId) => {
  const response = await api.post(`/admin/students/${studentId}/toggle-status`);
  return response.data;
};

export const getTeacherStudentIdCard = async (studentId) => {
  const response = await api.get(`/admin/students/${studentId}/id-card`);
  return response.data;
};

// Staff APIs
export const getTeacherStaffMeta = async () => {
  const response = await api.get("/admin/staff/meta");
  return response.data;
};

export const getTeacherStaff = async (params = {}) => {
  const response = await api.get("/admin/staff", { params });
  return response.data;
};

export const getTeacherStaffDetail = async (staffId) => {
  const response = await api.get(`/admin/staff/${staffId}`);
  return response.data;
};

export const addTeacherStaff = async (payload) => {
  const response = await api.post("/admin/staff", payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const updateTeacherStaff = async (staffId, payload) => {
  const response = await api.post(`/admin/staff/${staffId}`, payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const toggleTeacherStaffStatus = async (staffId) => {
  const response = await api.post(`/admin/staff/${staffId}/toggle-status`);
  return response.data;
};

export const getTeacherStaffIdCard = async (staffId, params = {}) => {
  const response = await api.get(`/admin/staff/${staffId}/id-card`, { params });
  return response.data;
};

export const printTeacherStaffIdCard = async (staffId, params = {}) => {
  const response = await api.get(`/admin/staff/${staffId}/id-card`, {
    params: { ...params, format: "print" },
    responseType: "text"
  });
  return response.data;
};

// Subjects APIs
export const getTeacherSubjects = async (params = {}) => {
  const response = await api.get("/admin/subjects", { params });
  return response.data;
};

export const addTeacherSubject = async (payload) => {
  const response = await api.post("/admin/subjects", payload);
  return response.data;
};

export const updateTeacherSubject = async (subjectId, payload) => {
  const response = await api.post(`/admin/subjects/${subjectId}`, payload);
  return response.data;
};

export const toggleTeacherSubjectStatus = async (subjectId) => {
  const response = await api.post(`/admin/subjects/${subjectId}/toggle-status`);
  return response.data;
};

// Academic Years APIs
export const getTeacherAcademicYears = async () => {
  const response = await api.get("/admin/academic-years");
  return response.data;
};

export const addTeacherAcademicYear = async (payload) => {
  const response = await api.post("/admin/academic-years", payload);
  return response.data;
};

export const updateTeacherAcademicYear = async (yearId, payload) => {
  const response = await api.post(`/admin/academic-years/${yearId}`, payload);
  return response.data;
};

export const setTeacherCurrentAcademicYear = async (yearId) => {
  const response = await api.post(`/admin/academic-years/${yearId}/set-current`);
  return response.data;
};

export const deleteTeacherAcademicYear = async (yearId) => {
  const response = await api.delete(`/admin/academic-years/${yearId}`);
  return response.data;
};

// Manage Notices APIs
export const getTeacherManageNoticesMeta = async () => {
  const response = await api.get("/admin/notices/meta");
  return response.data;
};

export const getTeacherManageNotices = async (params = {}) => {
  const response = await api.get("/admin/notices", { params });
  return response.data;
};

export const addTeacherManageNotice = async (payload) => {
  const response = await api.post("/admin/notices", payload);
  return response.data;
};

export const deleteTeacherManageNotice = async (noticeId) => {
  const response = await api.delete(`/admin/notices/${noticeId}`);
  return response.data;
};

// Manage Holidays APIs
export const getTeacherManageHolidays = async (params = {}) => {
  const response = await api.get("/admin/holidays", { params });
  return response.data;
};

export const addTeacherManageHoliday = async (payload) => {
  const response = await api.post("/admin/holidays", payload);
  return response.data;
};

export const deleteTeacherManageHoliday = async (holidayId) => {
  const response = await api.delete(`/admin/holidays/${holidayId}`);
  return response.data;
};

// Manage Leave APIs
export const getAdminManageLeavesMeta = async (params = {}) => {
  const response = await api.get("/admin/leaves/meta", { params });
  return response.data;
};

export const getAdminManageLeaves = async (params = {}) => {
  const response = await api.get("/admin/leaves", { params });
  return response.data;
};

export const getAdminManageLeaveDetail = async (leaveId) => {
  const response = await api.get(`/admin/leaves/${leaveId}`);
  return response.data;
};

export const approveAdminManageLeave = async (leaveId, payload = {}) => {
  const response = await api.post(`/admin/leaves/${leaveId}/approve`, payload);
  return response.data;
};

export const rejectAdminManageLeave = async (leaveId, payload = {}) => {
  const response = await api.post(`/admin/leaves/${leaveId}/reject`, payload);
  return response.data;
};

export const getTeacherManageLeaves = getAdminManageLeaves;
export const approveTeacherManageLeave = approveAdminManageLeave;
export const rejectTeacherManageLeave = rejectAdminManageLeave;

// Classes & Sections APIs
export const getTeacherClassesMeta = async () => {
  const response = await api.get("/admin/classes/meta");
  return response.data;
};

export const getTeacherClasses = async (params = {}) => {
  const response = await api.get("/admin/classes", { params });
  return response.data;
};

export const addTeacherClass = async (payload) => {
  const response = await api.post("/admin/classes", payload);
  return response.data;
};

export const getTeacherClassDetail = async (classId) => {
  const response = await api.get(`/admin/classes/${classId}`);
  return response.data;
};

export const updateTeacherClass = async (classId, payload) => {
  const response = await api.post(`/admin/classes/${classId}`, payload);
  return response.data;
};

export const toggleTeacherClassStatus = async (classId) => {
  const response = await api.post(`/admin/classes/${classId}/toggle-status`);
  return response.data;
};

export const deleteTeacherClass = async (classId) => {
  const response = await api.delete(`/admin/classes/${classId}`);
  return response.data;
};

export const addTeacherClassSection = async (classId, payload) => {
  const response = await api.post(`/admin/classes/${classId}/sections`, payload);
  return response.data;
};

export const assignTeacherClassSubject = async (classId, payload) => {
  const response = await api.post(`/admin/classes/${classId}/subjects`, payload);
  return response.data;
};

export const getTeacherSectionDetail = async (sectionId) => {
  const response = await api.get(`/admin/sections/${sectionId}`);
  return response.data;
};

export const updateTeacherSection = async (sectionId, payload) => {
  const response = await api.post(`/admin/sections/${sectionId}`, payload);
  return response.data;
};

export const deleteTeacherSection = async (sectionId) => {
  const response = await api.delete(`/admin/sections/${sectionId}`);
  return response.data;
};

export const generateTeacherSectionRollNumbers = async (sectionId) => {
  const response = await api.post(`/admin/sections/${sectionId}/generate-roll-numbers`);
  return response.data;
};

export const updateTeacherClassSubject = async (classSubjectId, payload) => {
  const response = await api.post(`/admin/class-subjects/${classSubjectId}`, payload);
  return response.data;
};

export const deleteTeacherClassSubject = async (classSubjectId) => {
  const response = await api.delete(`/admin/class-subjects/${classSubjectId}`);
  return response.data;
};

// Fees APIs
export const getTeacherFeesMeta = async () => {
  const response = await api.get("/admin/fees/meta");
  return response.data;
};

export const getTeacherFees = async (params = {}) => {
  const response = await api.get("/admin/fees", { params });
  return response.data;
};

export const getTeacherFeeStructures = async (params = {}) => {
  const response = await api.get("/admin/fees/structures", { params });
  return response.data;
};

export const addTeacherFeeStructure = async (payload) => {
  const response = await api.post("/admin/fees/structures", payload);
  return response.data;
};

export const deleteTeacherFeeStructure = async (structureId) => {
  const response = await api.delete(`/admin/fees/structures/${structureId}`);
  return response.data;
};

export const assignTeacherFee = async (payload) => {
  const response = await api.post("/admin/fees/assign", payload);
  return response.data;
};

export const bulkAssignTeacherFee = async (payload) => {
  const response = await api.post("/admin/fees/assign-bulk", payload);
  return response.data;
};

export const recordTeacherFeePayment = async (paymentId, payload) => {
  const response = await api.post(`/admin/fees/payments/${paymentId}/record`, payload);
  return response.data;
};

export const deleteTeacherFeePayment = async (paymentId) => {
  const response = await api.delete(`/admin/fees/payments/${paymentId}`);
  return response.data;
};

export const remindTeacherFee = async (payload = {}) => {
  const response = await api.post("/admin/fees/remind", payload);
  return response.data;
};

export const getTeacherLateFeeRules = async (params = {}) => {
  const response = await api.get("/admin/fees/late-fee-rules", { params });
  return response.data;
};

export const saveTeacherLateFeeRule = async (payload) => {
  const response = await api.post("/admin/fees/late-fee-rules", payload);
  return response.data;
};

export const clearTeacherLateFeeRule = async (payload) => {
  const response = await api.delete("/admin/fees/late-fee-rules", { data: payload });
  return response.data;
};

export const deleteTeacherLateFeeRuleHistory = async (ruleId) => {
  const response = await api.delete(`/admin/fees/late-fee-rules/${ruleId}`);
  return response.data;
};

// Certificates APIs
export const getTeacherCertificatesMeta = async () => {
  const response = await api.get("/admin/certificates/meta");
  return response.data;
};

export const getTeacherCertificates = async (params = {}) => {
  const response = await api.get("/admin/certificates", { params });
  return response.data;
};

export const addTeacherCertificate = async (payload) => {
  const response = await api.post("/admin/certificates", payload);
  return response.data;
};

export const downloadTeacherCertificate = async (certOrId) => {
  const certId = typeof certOrId === "object" ? certOrId.id : certOrId;
  const certNo = typeof certOrId === "object" ? (certOrId.certificate_no || certOrId.type_label || "Certificate") : `Certificate_${String(certId).slice(0, 8)}`;
  const endpoint = `/admin/certificates/${certId}/download`;

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
export const getAdminManageLiveClassesMeta = async () => {
  const response = await api.get("/admin/live-classes/meta");
  return response.data;
};

export const getAdminManageLiveClasses = async (params = {}) => {
  const response = await api.get("/admin/live-classes", { params });
  return response.data;
};

export const addAdminManageLiveClass = async (payload) => {
  const response = await api.post("/admin/live-classes", payload);
  return response.data;
};

export const getAdminManageLiveClassDetail = async (liveClassId) => {
  const response = await api.get(`/admin/live-classes/${liveClassId}`);
  return response.data;
};

export const updateAdminManageLiveClassRecording = async (liveClassId, payload) => {
  const response = await api.post(`/admin/live-classes/${liveClassId}/recording`, payload);
  return response.data;
};

export const deleteAdminManageLiveClass = async (liveClassId) => {
  const response = await api.delete(`/admin/live-classes/${liveClassId}`);
  return response.data;
};

// Teacher Live Class Reports APIs
export const getAdminLiveClassReports = async (params = {}) => {
  const response = await api.get("/admin/live-classes/reports", { params });
  return response.data;
};

export const getAdminLiveClassReportDetail = async (liveClassId) => {
  const response = await api.get(`/admin/live-classes/reports/${liveClassId}`);
  return response.data;
};

export const getTeacherManageLiveClassesMeta = getAdminManageLiveClassesMeta;
export const getTeacherManageLiveClasses = getAdminManageLiveClasses;
export const addTeacherManageLiveClass = addAdminManageLiveClass;
export const getTeacherManageLiveClassDetail = getAdminManageLiveClassDetail;
export const updateTeacherManageLiveClassRecording = updateAdminManageLiveClassRecording;
export const deleteTeacherManageLiveClass = deleteAdminManageLiveClass;
export const getTeacherLiveClassReports = getAdminLiveClassReports;
export const getTeacherLiveClassReportDetail = getAdminLiveClassReportDetail;

// Manage Timetable APIs
export const getTeacherManageTimetableMeta = async () => {
  const response = await api.get("/admin/timetable/meta");
  return response.data;
};

export const getTeacherManageTimetable = async (params = {}) => {
  const response = await api.get("/admin/timetable", { params });
  return response.data;
};

export const getTeacherManageTimetableTeacherSchedule = async (params = {}) => {
  const response = await api.get("/admin/timetable/teacher", { params });
  return response.data;
};

export const saveTeacherManageTimetableSlot = async (payload) => {
  const response = await api.post("/admin/timetable", payload);
  return response.data;
};

export const updateTeacherManageTimetableSlot = async (slotId, payload) => {
  const response = await api.post(`/admin/timetable/${slotId}`, payload);
  return response.data;
};

export const deleteTeacherManageTimetableSlot = async (slotId) => {
  const response = await api.delete(`/admin/timetable/${slotId}`);
  return response.data;
};

export const autoGenerateTeacherManageTimetable = async (payload = {}) => {
  const response = await api.post("/admin/timetable/auto-generate", payload);
  return response.data;
};

// Online MCQ APIs
export const getAdminOnlineMcqMeta = async () => {
  const response = await api.get("/admin/online-mcq/meta");
  return response.data;
};

export const getAdminOnlineMcq = async (params = {}) => {
  const response = await api.get("/admin/online-mcq", { params });
  return response.data;
};

export const addAdminOnlineMcqExam = async (payload) => {
  const response = await api.post("/admin/online-mcq", payload);
  return response.data;
};

export const getAdminOnlineMcqExamDetail = async (examId) => {
  const response = await api.get(`/admin/online-mcq/${examId}`);
  return response.data;
};

export const addAdminOnlineMcqQuestion = async (examId, payload) => {
  const response = await api.post(`/admin/online-mcq/${examId}/questions`, payload);
  return response.data;
};

export const deleteAdminOnlineMcqQuestion = async (examId, questionId) => {
  const response = await api.delete(`/admin/online-mcq/${examId}/questions/${questionId}`);
  return response.data;
};

export const publishAdminOnlineMcqExam = async (examId) => {
  const response = await api.post(`/admin/online-mcq/${examId}/publish`);
  return response.data;
};

export const deleteAdminOnlineMcqExam = async (examId) => {
  const response = await api.delete(`/admin/online-mcq/${examId}`);
  return response.data;
};

export const getAdminOnlineMcqReports = async (params = {}) => {
  const response = await api.get("/admin/online-mcq/reports", { params });
  return response.data;
};

export const getAdminOnlineMcqPassFailReports = async (params = {}) => {
  const response = await api.get("/admin/online-mcq/reports/pass-fail", { params });
  return response.data;
};

export const getAdminOnlineMcqReportDetail = async (examId) => {
  const response = await api.get(`/admin/online-mcq/reports/${examId}`);
  return response.data;
};

export const getAdminOnlineMcqAttemptDetail = async (examId, attemptId) => {
  const response = await api.get(`/admin/online-mcq/reports/${examId}/attempts/${attemptId}`);
  return response.data;
};

export const downloadAdminOnlineMcqAttemptPdf = async (examId, attemptId) => {
  const response = await api.get(`/admin/online-mcq/reports/${examId}/attempts/${attemptId}/pdf`, {
    responseType: "blob"
  });
  return response.data;
};

// Back-compat aliases reused by the existing teacher/admin UI pattern
export const getTeacherOnlineMcqMeta = getAdminOnlineMcqMeta;
export const getTeacherOnlineMcq = getAdminOnlineMcq;
export const addTeacherOnlineMcqExam = addAdminOnlineMcqExam;
export const getTeacherOnlineMcqExamDetail = getAdminOnlineMcqExamDetail;
export const addTeacherOnlineMcqQuestion = addAdminOnlineMcqQuestion;
export const deleteTeacherOnlineMcqQuestion = deleteAdminOnlineMcqQuestion;
export const publishTeacherOnlineMcqExam = publishAdminOnlineMcqExam;
export const deleteTeacherOnlineMcqExam = deleteAdminOnlineMcqExam;

// Teacher Teachers (Create/Manage) APIs
export const getTeacherTeachersMeta = async () => {
  const response = await api.get("/admin/teachers/meta");
  return response.data;
};

export const getTeacherTeachers = async (params = {}) => {
  const response = await api.get("/admin/teachers", { params });
  return response.data;
};

export const addTeacherTeacher = async (payload) => {
  const isMultipart = payload instanceof FormData;
  const config = isMultipart ? { headers: { "Content-Type": undefined } } : {};
  const response = await api.post("/admin/teachers", payload, config);
  return response.data;
};

export const getTeacherTeacherDetail = async (teacherId) => {
  const response = await api.get(`/admin/teachers/${teacherId}`);
  return response.data;
};

export const updateTeacherTeacher = async (teacherId, payload) => {
  const isMultipart = payload instanceof FormData;
  const config = isMultipart ? { headers: { "Content-Type": undefined } } : {};
  const response = await api.post(`/admin/teachers/${teacherId}`, payload, config);
  return response.data;
};

export const toggleTeacherTeacherStatus = async (teacherId) => {
  const response = await api.post(`/admin/teachers/${teacherId}/toggle-status`);
  return response.data;
};

// Teacher Manage Teacher Attendance APIs
export const getTeacherManageTeacherAttendanceRoster = async (params = {}) => {
  const response = await api.get("/admin/teacher-attendance", { params });
  return response.data;
};

export const saveTeacherManageTeacherAttendance = async (payload) => {
  const response = await api.post("/admin/teacher-attendance", payload);
  return response.data;
};

export const getTeacherManageTeacherAttendanceHistory = async (params = {}) => {
  const response = await api.get("/admin/teacher-attendance/history", { params });
  return response.data;
};

export const getStaffAttendanceRoster = async (params = {}) => {
  const response = await api.get("/admin/staff-attendance", { params });
  return response.data;
};

export const saveStaffAttendance = async (payload) => {
  const response = await api.post("/admin/staff-attendance", payload);
  return response.data;
};

export const getStaffAttendanceHistory = async (params = {}) => {
  const response = await api.get("/admin/staff-attendance/history", { params });
  return response.data;
};

// Teacher Payroll APIs
export const getTeacherPayrollPending = async (params = {}) => {
  const response = await api.get("/admin/payroll", { params });
  return response.data;
};

export const getTeacherPayrollHistory = async (params = {}) => {
  const response = await api.get("/admin/payroll/history", { params });
  return response.data;
};

export const generateTeacherPayroll = async (payload) => {
  const response = await api.post("/admin/payroll/generate", payload);
  return response.data;
};

export const getTeacherPayrollDetail = async (payrollId) => {
  const response = await api.get(`/admin/payroll/${payrollId}`);
  return response.data;
};

export const saveTeacherPayrollDeductions = async (payrollId, payload) => {
  const response = await api.post(`/admin/payroll/${payrollId}/deductions`, payload);
  return response.data;
};

export const markTeacherPayrollPaid = async (payrollId, payload) => {
  const response = await api.post(`/admin/payroll/${payrollId}/mark-paid`, payload);
  return response.data;
};

export const getTeacherPayrollReceipt = async (payrollId) => {
  const response = await api.get(`/admin/payroll/${payrollId}/receipt`);
  return response.data;
};

export const getTeacherFeatures = async (teacherId) => {
  const response = await api.get(`/admin/teachers/${teacherId}/features`);
  return response.data;
};

export const updateTeacherFeatures = async (teacherId, payload) => {
  const response = await api.post(`/admin/teachers/${teacherId}/features`, payload);
  return response.data;
};

// School Posts APIs
export const getSchoolPostsMeta = async () => {
  const response = await api.get("/admin/posts/meta");
  return response.data;
};

export const getSchoolPostsList = async (params = {}) => {
  const response = await api.get("/admin/posts", { params });
  return response.data;
};

export const addSchoolPost = async (formData) => {
  const response = await api.post("/admin/posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const getSchoolPostDetail = async (id) => {
  const response = await api.get(`/admin/posts/${id}`);
  return response.data;
};

export const deleteSchoolPost = async (id) => {
  const response = await api.delete(`/admin/posts/${id}`);
  return response.data;
};

// School Admin Staff APIs
export const getAdminStaffMeta = async () => {
  const response = await api.get("/admin/staff/meta");
  return response.data;
};

export const getAdminStaff = async (params = {}) => {
  const response = await api.get("/admin/staff", { params });
  return response.data;
};

export const addAdminStaff = async (data) => {
  // If data is an instance of FormData, use multipart headers
  const isFormData = data instanceof FormData;
  const response = await api.post("/admin/staff", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
  });
  return response.data;
};

export const getAdminStaffDetail = async (staffId) => {
  const response = await api.get(`/admin/staff/${staffId}`);
  return response.data;
};

export const updateAdminStaff = async (staffId, data) => {
  const isFormData = data instanceof FormData;
  const response = await api.post(`/admin/staff/${staffId}`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
  });
  return response.data;
};

export const deleteAdminStaff = async (staffId) => {
  const response = await api.delete(`/admin/staff/${staffId}`);
  return response.data;
};

export const toggleAdminStaffStatus = async (staffId) => {
  const response = await api.post(`/admin/staff/${staffId}/toggle-status`);
  return response.data;
};

export const getAdminStaffIdCard = async (staffId, params = {}) => {
  const response = await api.get(`/admin/staff/${staffId}/id-card`, { params });
  return response.data;
};



