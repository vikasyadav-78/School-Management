import axios from "axios";

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
      const token = localStorage.getItem("token");
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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    if (status === 401) {
      if (typeof window !== "undefined") {
        const role = localStorage.getItem("role");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        if (role === "admin") {
          window.location.href = "/admin-login";
        } else {
          window.location.href = "/login";
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
