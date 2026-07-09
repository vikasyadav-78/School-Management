export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    LOGOUT: "/logout",
    ME: "/me",
  },
  TEACHERS: {
    BASE: "/teachers",
    DETAIL: (id) => `/teachers/${id}`,
  },
  STUDENTS: {
    BASE: "/students",
    DETAIL: (id) => `/students/${id}`,
  },
  ATTENDANCE: {
    BASE: "/attendance",
  },
  FINANCE: {
    BASE: "/finance",
  },
};
