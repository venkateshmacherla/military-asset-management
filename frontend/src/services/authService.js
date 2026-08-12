import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const loginUser = async (credentials) => {
  const response = await axios.post(`${API_URL}/auth/login`, credentials, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = response.data;

  const token = data?.token || data?.data?.token;

  if (token) {
    localStorage.setItem("token", token);
  }

  const user = data?.user || data?.data?.user;

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  return data;
};

const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const getStoredUser = () => {
  try {
    const user = localStorage.getItem("user");

    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Failed to read stored user:", error);
    return null;
  }
};

const getCurrentUser = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

const isAuthenticated = () => {
  return Boolean(localStorage.getItem("token"));
};

export {
  loginUser,
  logoutUser,
  getStoredUser,
  getCurrentUser,
  isAuthenticated,
};
