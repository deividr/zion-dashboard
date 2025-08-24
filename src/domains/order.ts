import { z } from "zod";
import { customerSchema } from "./customer";

export const orderSchema = z.object({
  id: z.string().uuid().optional(),
  number: z.number().int(),
  pickupDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  customerId: z.string().uuid(),
  customer: customerSchema.optional(),
  employeeId: z.string().uuid(),
  orderLocal: z.string(),
  observations: z.string(),
  isPickedUp: z.boolean(),
});

export type Order = z.infer<typeof orderSchema>;
