import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string) {
  const numbers = value.replace(/\D/g, "");
  const cents = Number(numbers) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents);
}

export function parseNumber(value: string) {
  return value.replace(/\D/g, "");
}

export const formatPhone = (phone: string) => {
  if (!phone) return "";
  const formatted = phone.replace(/\D/g, "");
  return formatted.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
};

export const formatCep = (cep: string) => {
  if (!cep) return "";
  const formatted = cep.replace(/\D/g, "");
  return formatted.replace(/(\d{5})(\d{3})/, "$1-$2");
};

/**
 * Consulta a API ViaCEP e retorna os dados do endereço para o CEP informado.
 * @param cep string (apenas números)
 * @returns Promise<{ street: string; neighborhood: string; city: string; state: string; }>
 * @throws Error se o CEP não for encontrado ou houver erro na consulta
 */
export async function fetchCepData(cep: string) {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) {
    throw new Error("CEP deve conter 8 dígitos.");
  }
  const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
  const data = await res.json();
  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }
  return {
    street: data.logradouro || "",
    neighborhood: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
  };
}

/**
 * Calcula a distância entre um endereço e a loja usando Google Routes API (Compute Route Matrix) - Modo Basic (sem tráfego)
 * @param destinationAddress string - Endereço completo de destino
 * @param storeAddress string - Endereço da loja (origem)
 * @returns Promise<number> - Distância em quilômetros
 * @throws Error se não conseguir calcular a distância
 */
export async function calculateDistanceFromStore(
  destinationAddress: string,
  storeAddress: string = "Avenida Santo Antônio, 2504, Bela Vista, Osasco, SP" // Configure o endereço da sua loja aqui
): Promise<number> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key não configurada");
  }

  const requestBody = {
    origins: [
      {
        waypoint: {
          address: storeAddress,
        },
      },
    ],
    destinations: [
      {
        waypoint: {
          address: destinationAddress,
        },
      },
    ],
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_UNAWARE", // Não considera tráfego, modo Basic
  };

  try {
    const response = await fetch(
      "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "distanceMeters", // Solicita apenas o campo necessário
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na API do Google Routes: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error("Resposta inválida da API do Google Routes");
    }

    const element = data[0];

    if (!element.distanceMeters) {
      throw new Error("Distância não disponível para este endereço");
    }

    // Converte metros para quilômetros e arredonda para cima (inteiro)
    const distanceInKm = Math.ceil(element.distanceMeters / 1000);

    return distanceInKm;
  } catch (error) {
    console.error("Erro ao calcular distância:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Erro ao calcular distância. Tente novamente.");
  }
}
