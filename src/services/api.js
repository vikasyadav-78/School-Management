import axiosInstance from "./axios";

export const api = {
  get: (url, config = {}) => { console.log("GET URL =", url); return axiosInstance.get(url, config); },
  post: (url, data = {}, config = {}) => { console.log("POST URL =", url); return axiosInstance.post(url, data, config); },
  put: (url, data = {}, config = {}) => { console.log("PUT URL =", url); return axiosInstance.put(url, data, config); },
  delete: (url, config = {}) => { console.log("DELETE URL =", url); return axiosInstance.delete(url, config); },
};
