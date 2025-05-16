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
