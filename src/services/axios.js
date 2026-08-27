import axios from "axios";
import { sortClassesNaturally } from "../utils/classUtils";
import { clearAuthCookies } from "@/utils/cookieSync";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const isDriverRoute = config.url && /\/driver(\/|$)/.test(config.url);
      const token = isDriverRoute ? localStorage.getItem("driver_token") : localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const processResponseData = (data) => {
  if (!data || typeof data !== "object") return data;

  if (data.hasOwnProperty("classes") && Array.isArray(data.classes)) {
    data.classes = sortClassesNaturally(data.classes);
  }
  if (data.hasOwnProperty("classesList") && Array.isArray(data.classesList)) {
    data.classesList = sortClassesNaturally(data.classesList);
  }
  if (data.hasOwnProperty("classesMeta") && Array.isArray(data.classesMeta)) {
    data.classesMeta = sortClassesNaturally(data.classesMeta);
  }

  for (const key in data) {
    if (data.hasOwnProperty(key) && data[key] && typeof data[key] === "object") {
      processResponseData(data[key]);
    }
  }
  return data;
};

axiosInstance.interceptors.response.use(
  (response) => {
    if (response && response.data && typeof response.data === "object") {
      processResponseData(response.data);
    }
    return response;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    if (status === 401) {
      if (typeof window !== "undefined") {
        const isDriverRoute = error.config?.url && /\/driver(\/|$)/.test(error.config.url);
        if (isDriverRoute) {
          localStorage.removeItem("driver_token");
          window.location.href = "/driver";
        } else {
          const role = localStorage.getItem("role");
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          clearAuthCookies();
          if (role === "admin" || role === "super_admin") {
            window.location.href = "/admin-login";
          } else {
            window.location.href = "/login";
          }
        }
      }
    }
    return Promise.reject(
      (error.response && error.response.data) || {
        message: "Something went wrong on the network.",
      }
    );
  }
);

export default axiosInstance;
