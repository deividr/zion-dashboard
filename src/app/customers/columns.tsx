"use client";

import { Customer } from "@/domains";
import { formatPhone } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

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
