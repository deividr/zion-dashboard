import { z } from "zod";

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(5, { message: "Nome deve ter no mínimo 5 caracteres" }),
  description: z.string().optional(),
});

export type Category = z.infer<typeof categorySchema>;
