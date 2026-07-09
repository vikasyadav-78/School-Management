import { api } from "./api";

/**
 * STUDENT LEAVES
 */
export const getStudentLeavesList = async () => {
  const response = await api.get("/student/leaves");
  return response.data;
};

export const createStudentLeave = async (leaveData) => {
  const response = await api.post("/student/leaves", leaveData);
  return response.data;
};

/**
 * TEACHER LEAVES
 */
export const getTeacherLeavesList = async () => {
  if (typeof window === "undefined") {
    return { stats: { total: 0, pending: 0, approved: 0, rejected: 0 }, records: [] };
  }
  const stored = localStorage.getItem("school_teacher_leaves");
  const localRecords = stored ? JSON.parse(stored) : [];
  
  const stats = {
    total: localRecords.length,
    pending: localRecords.filter(r => r.status?.toLowerCase() === "pending").length,
    approved: localRecords.filter(r => r.status?.toLowerCase() === "approved").length,
    rejected: localRecords.filter(r => r.status?.toLowerCase() === "rejected").length
  };

  return {
    stats,
    records: localRecords
  };
};

export const createTeacherLeave = async (leaveData) => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("school_teacher_leaves");
  const localRecords = stored ? JSON.parse(stored) : [];

  const newLeave = {
    id: `TCH-LV-${Date.now()}`,
    applied_date: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }),
    from_date: leaveData.from_date,
    to_date: leaveData.to_date,
    total_days: leaveData.total_days,
    reason: leaveData.reason,
    leave_type: "General Leave",
    status: "Pending"
  };

  const updatedRecords = [newLeave, ...localRecords];
  localStorage.setItem("school_teacher_leaves", JSON.stringify(updatedRecords));

  return newLeave;
};
