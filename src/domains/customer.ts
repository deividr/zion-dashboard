import { z } from "zod";

const phoneSchema = z.string().max(11, { message: "Telefone inválido" });

export const customerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(5, { message: "Nome deve ter no mínimo 5 caracteres" }),
  email: z.string().email("Email inválido").or(z.literal("")),
  phone: phoneSchema.min(10, { message: "Telefone inválido" }),
  phone2: phoneSchema,
});

export type Customer = z.infer<typeof customerSchema>;
