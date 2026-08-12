import api from "./api";

// Get all audit logs
export const getAuditLogs = async (params = {}) => {
  const response = await api.get("/audit-logs", {
    params,
  });

  return response.data;
};

// Get audit log by ID
export const getAuditLogById = async (id) => {
  const response = await api.get(`/audit-logs/${id}`);

  return response.data;
};
