import api from "./api";

// Get all assignments
export const getAssignments = async () => {
  const response = await api.get("/assignments");

  return response.data;
};

// Get assignment by ID
export const getAssignmentById = async (id) => {
  const response = await api.get(`/assignments/${id}`);

  return response.data;
};

// Create assignment
export const createAssignment = async (assignmentData) => {
  const response = await api.post("/assignments", assignmentData);

  return response.data;
};

// Update assignment
export const updateAssignment = async (id, assignmentData) => {
  const response = await api.patch(`/assignments/${id}`, assignmentData);

  return response.data;
};

// Delete assignment
export const deleteAssignment = async (id) => {
  const response = await api.delete(`/assignments/${id}`);

  return response.data;
};
