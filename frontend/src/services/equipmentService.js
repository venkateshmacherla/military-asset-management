import api from "./api";

// Get all equipment types
export const getEquipmentTypes = async () => {
  const response = await api.get("/equipment-types");

  return response.data;
};

// Get equipment type by ID
export const getEquipmentTypeById = async (id) => {
  const response = await api.get(`/equipment-types/${id}`);

  return response.data;
};

// Create equipment type
export const createEquipmentType = async (equipmentData) => {
  const response = await api.post("/equipment-types", equipmentData);

  return response.data;
};

// Update equipment type
export const updateEquipmentType = async (id, equipmentData) => {
  const response = await api.patch(`/equipment-types/${id}`, equipmentData);

  return response.data;
};

// Delete equipment type
export const deleteEquipmentType = async (id) => {
  const response = await api.delete(`/equipment-types/${id}`);

  return response.data;
};
