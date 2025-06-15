import { API_URL } from "@/env";

export const productEndpoints = {
  get: (id: string) => `${API_URL}/products/${id}`,
  list: (page: number, search: string) =>
    `${API_URL}/products?limit=10&page=${page}&name=${search}`,
  create: () => `${API_URL}/products`,
  update: (id: string) => `${API_URL}/products/${id}`,
  delete: (id: string) => `${API_URL}/products/${id}`,
};
