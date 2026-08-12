import api from "./api";

// Get all expenditures
export const getExpenditures = async () => {
  const response = await api.get("/expenditures");

  return response.data;
};

// Get expenditure by ID
export const getExpenditureById = async (id) => {
  const response = await api.get(`/expenditures/${id}`);

  return response.data;
};

// Create expenditure
export const createExpenditure = async (expenditureData) => {
  const response = await api.post("/expenditures", expenditureData);

  return response.data;
};

// Update expenditure
export const updateExpenditure = async (id, expenditureData) => {
  const response = await api.patch(`/expenditures/${id}`, expenditureData);

  return response.data;
};

// Delete expenditure
export const deleteExpenditure = async (id) => {
  const response = await api.delete(`/expenditures/${id}`);

  return response.data;
};
