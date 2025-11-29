import { API_URL } from "@/env";

export const orderEndpoints = {
    get: (id: string) => `${API_URL}/orders/${id}`,
    list: (params: string) => `${API_URL}/orders?${params}`,
    create: () => `${API_URL}/orders`,
    update: (id: string) => `${API_URL}/orders/${id}`,
    delete: (id: string) => `${API_URL}/orders/${id}`,
    pickup: (id: string) => `${API_URL}/orders/${id}/pickup`,
};

