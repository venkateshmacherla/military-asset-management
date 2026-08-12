import api from "./api";

// Get all bases
export const getBases = async () => {
  const response = await api.get("/bases");

  return response.data;
};

// Get base by ID
export const getBaseById = async (id) => {
  const response = await api.get(`/bases/${id}`);

  return response.data;
};

// Create base
export const createBase = async (baseData) => {
  const response = await api.post("/bases", baseData);

  return response.data;
};

// Update base
export const updateBase = async (id, baseData) => {
  const response = await api.patch(`/bases/${id}`, baseData);

  return response.data;
};

// Delete base
export const deleteBase = async (id) => {
  const response = await api.delete(`/bases/${id}`);

  return response.data;
};
