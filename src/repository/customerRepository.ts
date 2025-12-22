import { API_URL } from "@/env";

export const customerEndpoints = {
    get: (id: string) => `${API_URL}/customers/${id}`,
    list: (page: number, search: string) => `${API_URL}/customers?limit=10&page=${page}&name=${search}`,
    listAll: () => `${API_URL}/customers?limit=1000`,
    findByPhone: (phone: string) => `${API_URL}/customers?phone=${phone}&limit=1&page=1`,
    create: () => `${API_URL}/customers`,
    update: (id: string) => `${API_URL}/customers/${id}`,
    delete: (id: string) => `${API_URL}/customers/${id}`,
};
