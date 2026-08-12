import api from "./api";

// Get dashboard/report summary
export const getReportSummary = async () => {
  const response = await api.get("/reports");

  return response.data;
};

// Get inventory report
export const getInventoryReport = async (params = {}) => {
  const response = await api.get("/reports/inventory", {
    params,
  });

  return response.data;
};

// Get transfer report
export const getTransferReport = async (params = {}) => {
  const response = await api.get("/reports/transfers", {
    params,
  });

  return response.data;
};

// Get assignment report
export const getAssignmentReport = async (params = {}) => {
  const response = await api.get("/reports/assignments", {
    params,
  });

  return response.data;
};

// Get expenditure report
export const getExpenditureReport = async (params = {}) => {
  const response = await api.get("/reports/expenditures", {
    params,
  });

  return response.data;
};
