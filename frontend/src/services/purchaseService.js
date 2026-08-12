import api from "./api";

export const getPurchases = async (params = {}) => {
  const response = await api.get("/purchases", {
    params,
  });

  return response.data;
};

export const createPurchase = async (purchaseData) => {
  const response = await api.post("/purchases", purchaseData);

  return response.data;
};
