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
  if (!phone) return;
  const formatted = phone.replace(/\D/g, "");
  return formatted.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
};
