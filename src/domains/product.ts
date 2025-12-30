import { z } from "zod";

export const UnityType = {
    UN: "Unidade",
    KG: "Quilograma",
    LT: "Litro",
} as const;

export const productSchema = z.object({
    id: z.string().uuid().optional(),
    value: z.number().int().min(1, { message: "Valor deve ser maior que 0" }),
    name: z.string().min(4, { message: "Nome deve ter no mínimo 5 caracteres" }),
    unityType: z.enum(Object.keys(UnityType) as [string, string], {
        message: "Tipo de unidade inválido",
    }),
    categoryId: z.string().uuid(),
    imageUrl: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.string().optional()),
});

export type Product = z.infer<typeof productSchema>;
