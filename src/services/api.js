import axiosInstance from "./axios";

const isDev = process.env.NODE_ENV === "development";

export const api = {
  get: (url, config = {}) => { if (isDev) console.log("GET URL =", url); return axiosInstance.get(url, config); },
  post: (url, data = {}, config = {}) => { if (isDev) console.log("POST URL =", url); return axiosInstance.post(url, data, config); },
  put: (url, data = {}, config = {}) => { if (isDev) console.log("PUT URL =", url); return axiosInstance.put(url, data, config); },
  delete: (url, config = {}) => { if (isDev) console.log("DELETE URL =", url); return axiosInstance.delete(url, config); },
};
