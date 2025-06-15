import { API_URL } from "@/env";

export const categoryEndpoints = {
  get: (id: string) => `${API_URL}/categories/${id}`,
  list: () => `${API_URL}/categories`,
  create: () => `${API_URL}/categories`,
  update: (id: string) => `${API_URL}/categories/${id}`,
  delete: (id: string) => `${API_URL}/categories/${id}`,
};
