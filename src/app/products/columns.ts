"use client";

import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const productSchema = z.object({
  id: z.string().uuid(),
  value: z.number().int(),
  name: z.string(),
  unityType: z.enum(["unity", "kilogram"]),
});

export type Product = z.infer<typeof productSchema>;

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "value",
    header: "Value",
  },
  {
    accessorKey: "unityType",
    header: "Unity Type",
  },
];
