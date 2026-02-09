"use client";

import { Badge } from "@/components/ui";
import { Category } from "@/domains";
import { Product, UnityType } from "@/domains/product";
import { ColumnDef } from "@tanstack/react-table";

export const columns = (categories: Category[]): ColumnDef<Product>[] => [
    {
        accessorKey: "name",
        header: "Nome",
    },
    {
        accessorKey: "unityType",
        header: "Tipo Unidade",
        cell: ({ row }) => {
            const unityType = row.getValue("unityType");
            return <div className="text-left">{UnityType[unityType as keyof typeof UnityType]}</div>;
        },
    },
    {
        accessorKey: "category",
        header: "Categoria",
        cell: ({ row }) => {
            const category = categories.find((c) => c.id === row.original.categoryId);
            if (!category) return null;
            return <div className="text-left">{category.name}</div>;
        },
    },
    {
        accessorKey: "isVariablePrice",
        header: "Preço",
        cell: ({ row }) => {
            const isVariable = row.getValue("isVariablePrice");
            return isVariable ? (
                <Badge variant="secondary">Variável</Badge>
            ) : (
                <span className="text-muted-foreground text-sm">Fixo</span>
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
