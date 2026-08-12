import api from "./api";

// Get all assets
export const getAssets = async (params = {}) => {
  const response = await api.get("/assets", {
    params,
  });

  return response.data;
};

// Get asset by ID
export const getAssetById = async (id) => {
  const response = await api.get(`/assets/${id}`);

  return response.data;
};

// Get asset dashboard
export const getAssetDashboard = async () => {
  const response = await api.get("/assets/dashboard");

  return response.data;
};

// Create asset
export const createAsset = async (assetData) => {
  const response = await api.post("/assets", assetData);

  return response.data;
};

// Update asset
export const updateAsset = async (id, assetData) => {
  const response = await api.patch(`/assets/${id}`, assetData);

  return response.data;
};

// Delete asset
export const deleteAsset = async (id) => {
  const response = await api.delete(`/assets/${id}`);

  return response.data;
};
