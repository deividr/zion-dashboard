import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/nextjs";

export function useFetchClient() {
  const { getToken } = useAuth();
  const { toast } = useToast();

  const fetchClient = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();

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
      toast({
        variant: "destructive",
        description: response.statusText,
      });
    }

    return response.json();
  };

  return { fetch: fetchClient };
}
