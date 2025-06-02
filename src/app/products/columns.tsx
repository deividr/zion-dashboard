"use client";

import { Product, UnityType } from "@/domains/product";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "unityType",
    header: "Tipo Unidade",
    cell: ({ row }) => {
      const unityType = row.getValue("unityType");
      return (
        <div className="text-left">
          {UnityType[unityType as keyof typeof UnityType]}
        </div>
      );
    },
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
