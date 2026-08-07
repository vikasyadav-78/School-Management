import { api } from "@/services/api";

export const getMarksExams = async () => {
  const response = await api.get("/admin/marks/exams");
  return response.data;
};

export const getClassMarksRoster = async (examId, classId, sectionId) => {
  const response = await api.get(`/admin/marks/${examId}/class`, {
    params: { class_id: classId, section_id: sectionId }
  });
  return response.data;
};

export const saveClassMarks = async (examId, payload) => {
  const response = await api.post(`/admin/marks/${examId}/class`, payload);
  return response.data;
};

export const getStudentMarksDetail = async (examId, studentId) => {
  const response = await api.get(`/admin/marks/${examId}/student/${studentId}`);
  return response.data;
};

export const saveStudentMarks = async (examId, studentId, payload) => {
  const response = await api.post(`/admin/marks/${examId}/student/${studentId}`, payload);
  return response.data;
};
