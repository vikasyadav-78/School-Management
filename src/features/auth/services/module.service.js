import { api } from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";
import * as mockService from "./module.mock";
import { USE_MOCK } from "@/constants";

export const login = async (credentials) => {
  if (USE_MOCK && credentials.role !== "student" && credentials.role !== "teacher" && credentials.role !== "admin") {
    return mockService.mockLogin(credentials);
  }

  let body = {
    login_type: credentials.role,
    device_name: "school-management-web",
  };

  if (credentials.role === "student") {
    body.student_id = credentials.username || credentials.student_id;
    body.date_of_birth = credentials.password || credentials.date_of_birth;
  } else if (credentials.role === "teacher") {
    body.email = credentials.username;
    body.password = credentials.password;
  } else if (credentials.role === "admin") {
    body.email = credentials.email || credentials.username;
    body.password = credentials.password;
    body.device_name = credentials.device_name || "admin-android";
    try {
      const response = await api.post("/admin/login", body);
      return response.data;
    } catch (adminError) {
      // Fallback: try Super Admin login
      try {
        const superAdminBody = {
          email: body.email,
          password: body.password,
          device_name: "super-admin-android"
        };
        const response = await api.post("/super-admin/login", superAdminBody);
        return response.data;
      } catch (superAdminError) {
        // If both failed, reject with the super admin error message
        throw superAdminError;
      }
    }
  } else {
    body.email = credentials.email || credentials.username;
    body.password = credentials.password;
  }

  const response = await api.post("/login", body);
  return response.data;
};


export const getMe = async (role) => {
  if (USE_MOCK && role !== "teacher" && role !== "student" && role !== "admin") {
    return mockService.mockGetMe();
  }

  const endpoint =
    role === "teacher"
      ? "/teacher/profile"
      : role === "student"
      ? "/student/profile"
      : "/user";

  console.log("ROLE =>", role);
  console.log("ENDPOINT =>", endpoint);

  const response = await api.get(endpoint);

  console.log("PROFILE RESPONSE =>", response.data);

  return response.data;
};

export const impersonateStudent = async (studentId) => {
  const response = await api.post(`/admin/students/${studentId}/login-as`, {
    device_name: "admin-app"
  });
  return response.data;
};

export const impersonateTeacher = async (teacherId) => {
  const response = await api.post(`/admin/teachers/${teacherId}/login-as`, {
    device_name: "admin-app"
  });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post("/password/forgot", { email });
  return response.data;
};

export const resetPassword = async (payload) => {
  const response = await api.post("/password/reset", payload);
  return response.data;
};