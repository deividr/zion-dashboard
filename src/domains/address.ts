import { z } from "zod";

export const addressSchema = z.object({
  id: z.string().uuid().optional(),
  street: z.string().min(3, { message: "Rua deve ter no mínimo 3 caracteres" }),
  number: z.string(),
  neighborhood: z
    .string()
    .min(2, { message: "Bairro deve ter no mínimo 2 caracteres" }),
  city: z
    .string()
    .min(2, { message: "Cidade deve ter no mínimo 2 caracteres" }),
  state: z.string().length(2, { message: "Estado deve ter 2 caracteres" }),
  cep: z.string().length(8, { message: "CEP deve ter 8 dígitos" }),
  aditionalDetails: z.string().default(""),
  distance: z.number().default(0),
  isDefault: z.boolean(),
});

export type Address = z.infer<typeof addressSchema>;
