import { z } from "zod";
import { customerSchema } from "./customer";
import { UnityType } from "./product";
import { addressSchema } from "./address";

export const orderSubproductSchema = z.object({
    id: z.string().uuid().optional(),
    orderId: z.string().uuid(),
    productId: z.string().uuid(),
    name: z.string(),
});

export type OrderSubproduct = z.infer<typeof orderSubproductSchema>;

export const orderProductsSchema = z.object({
    id: z.string().uuid().optional(),
    orderId: z.string().uuid(),
    productId: z.string().uuid(),
    unityType: z.enum(Object.keys(UnityType) as [string, string], {
        message: "Tipo de unidade inválido",
    }),
    quantity: z.number().int(),
    price: z.number().int(),
    name: z.string(),
    subProducts: z.array(orderSubproductSchema).optional(),
});

export type OrderProducts = z.infer<typeof orderProductsSchema>;

export const orderSchema = z.object({
    id: z.string().uuid().optional(),
    number: z.number().int(),
    pickupDate: z
        .string()
        .or(z.date())
        .transform((val) => {
            return typeof val === "string" ? new Date(val) : val;
        }),
    createdAt: z
        .string()
        .or(z.date())
        .transform((val) => {
            return typeof val === "string" ? new Date(val) : val;
        }),
    updatedAt: z
        .string()
        .or(z.date())
        .transform((val) => {
            return typeof val === "string" ? new Date(val) : val;
        }),
    address: addressSchema.optional(),
    customer: customerSchema.optional(),
    employeeId: z.string().uuid(),
    orderLocal: z.string(),
    observations: z.string(),
    isPickedUp: z.boolean(),
    products: z.array(orderProductsSchema),
});

export type Order = z.infer<typeof orderSchema>;
