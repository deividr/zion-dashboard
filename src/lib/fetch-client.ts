import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/nextjs";

export function useFetchClient() {
  const { getToken } = useAuth();
  const { toast } = useToast();

  const fetchClient = useCallback(
    async <T>(url: string, options: RequestInit = {}) => {
      const token = await getToken();

      if (!token) {
        return null;
      }

      const defaultOptions: RequestInit = {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        const data = await response.json();
        toast({
          variant: "destructive",
          description: data.message || response.statusText,
        });
        throw new Error(response.statusText);
      }

      return response.json() as T;
    },
    [getToken, toast]
  );

  return { fetch: fetchClient };
}
