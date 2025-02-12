"use client";

import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const productSchema = z.object({
  id: z.string().uuid(),
  value: z.number().int(),
  name: z.string(),
  unityType: z.enum(["UN", "KG"]),
});

export type Product = z.infer<typeof productSchema>;

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "unityType",
    header: "Tipo Unidade",
  },
  {
    accessorKey: "value",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("value")) / 100;
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
];
