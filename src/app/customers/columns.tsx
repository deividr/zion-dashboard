"use client";

import { formatPhone } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const addressSchema = z.object({
  id: z.string().optional(),
  street: z.string().min(3, { message: "Rua deve ter no mínimo 3 caracteres" }),
  number: z.string(),
  neighborhood: z.string().min(2, { message: "Bairro deve ter no mínimo 2 caracteres" }),
  city: z.string().min(2, { message: "Cidade deve ter no mínimo 2 caracteres" }),
  state: z.string().length(2, { message: "Estado deve ter 2 caracteres" }),
  cep: z.string().length(8, { message: "CEP deve ter 8 dígitos" }),
  aditionalDetails: z.string().optional(),
  distance: z.number().default(0),
  isDefault: z.boolean().default(false),
});

export const customerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string().transform(formatPhone),
  phone2: z.string().transform(formatPhone),
  email: z.string(),
});

export type Customer = z.infer<typeof customerSchema>;
export type Address = z.infer<typeof addressSchema>;

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "phone",
    header: "Telefone principal",
    cell: ({ row }) => formatPhone(row.getValue("phone")),
  },
  {
    accessorKey: "phone2",
    header: "Telefone secundário",
    cell: ({ row }) => formatPhone(row.getValue("phone2")),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
];
