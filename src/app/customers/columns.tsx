"use client";

import { formatPhone } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const customerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string().transform(formatPhone),
  phone2: z.string().transform(formatPhone),
  email: z.string(),
});

export type Customer = z.infer<typeof customerSchema>;

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
