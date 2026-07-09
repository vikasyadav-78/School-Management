import { api } from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";
import * as mockService from "./module.mock";
import { USE_MOCK } from "@/constants";

export const login = async (credentials) => {
  if (USE_MOCK && credentials.role !== "student" && credentials.role !== "teacher") {
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
  } else {
    body.email = credentials.email || credentials.username;
    body.password = credentials.password;
  }

  const response = await api.post("/login", body);
  return response.data;
};


// export const getMe = async (role) => {
//   if (USE_MOCK) {
//     return mockService.mockGetMe();
//   }

//   const endpoint = role === "teacher" ? "/teacher/profile" : "/student/profile";
//   const response = await api.get(endpoint);
//   return response.data;
// };

export const getMe = async (role) => {
  if (USE_MOCK && role !== "teacher" && role !== "student") {
    return mockService.mockGetMe();
  }

  const endpoint =
    role === "teacher"
      ? "/teacher/profile"
      : "/student/profile";

  console.log("ROLE =>", role);
  console.log("ENDPOINT =>", endpoint);

  const response = await api.get(endpoint);

  console.log("PROFILE RESPONSE =>", response.data);

  return response.data;
};