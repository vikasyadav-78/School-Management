import axiosInstance from "./axios";

export const getStudentTransport = async () => {
  const response = await axiosInstance.get("/student/transport");
  return response.data;
};

export const getStudentTransportLive = async () => {
  const response = await axiosInstance.get("/student/transport/live");
  return response.data;
};
