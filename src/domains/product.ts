import { z } from "zod";

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  value: z.number().int().min(1, { message: "Valor deve ser maior que 0" }),
  name: z.string().min(5, { message: "Nome deve ter no mínimo 5 caracteres" }),
  unityType: z.enum(["UN", "KG", "LT"], {
    message: "Tipo de unidade inválido",
  }),
});

export type Product = z.infer<typeof productSchema>;
