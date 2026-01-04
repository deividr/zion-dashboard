"use client";

import { Order } from "@/domains";
import { formatPhone } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Order>[] = [
    {
        accessorKey: "number",
        header: "Número",
    },
    {
        accessorKey: "customer.name",
        header: "Cliente",
    },
    {
        accessorKey: "customer.phone",
        header: "Telefone",
        cell: ({ row }) => {
            return formatPhone(row.original.customer?.phone || "");
        },
    },
    {
        accessorKey: "pickupDate",
        header: "Data Retirada",
        cell: ({ row }) => new Date(row.getValue("pickupDate")).toLocaleDateString("pt-BR"),
    },
    {
        accessorKey: "orderLocal",
        header: "Geladeira",
    },
];
