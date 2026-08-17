import { api } from "@/services/api";

export const loginDriver = async (phone, pin) => {
  const response = await api.post("/driver/login", {
    phone,
    pin,
    device_name: "driver-android"
  });
  return response.data;
};

export const getDriverMe = async () => {
  const response = await api.get("/driver/me");
  return response.data;
};

export const updateDriverLocation = async (latitude, longitude) => {
  const response = await api.post("/driver/location", {
    latitude,
    longitude
  });
  return response.data;
};

export const logoutDriver = async () => {
  const response = await api.post("/driver/logout");
  return response.data;
};
