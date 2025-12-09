"use client";

import { Button, Form } from "@/components/ui";
import { Address, Customer, Order, Product } from "@/domains";
import { useToast } from "@/hooks/use-toast";
import { useFetchClient } from "@/lib/fetch-client";
import { orderEndpoints } from "@/repository/orderRepository";
import { productEndpoints } from "@/repository/productRepository";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OrderCustomerSection } from "./order-customer-section";
import { OrderDetailsSection } from "./order-details-section";
import { OrderProductsSection } from "./order-products-section";

// Schema de validação do formulário
const orderFormSchema = z.object({
    customerId: z.string().uuid("Selecione um cliente"),
    pickupDate: z.date({
        required_error: "Selecione a data de retirada",
    }),
    orderLocal: z.string().min(1, "Informe o local/geladeira"),
    observations: z.string().optional(),
    addressId: z.string().optional(),
    products: z
        .array(
            z.object({
                productId: z.string().uuid(),
                name: z.string(),
                unityType: z.string(),
                quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
                price: z.number().min(1, "Preço deve ser maior que 0"),
            })
        )
        .min(1, "Adicione pelo menos um produto"),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
    initialData?: Order;
}

export function OrderForm({ initialData }: OrderFormProps) {
    const { fetch } = useFetchClient();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const isEditMode = !!initialData?.id;

    const form = useForm<OrderFormData>({
        resolver: zodResolver(orderFormSchema),
        defaultValues: {
            customerId: initialData?.customer?.id ?? "",
            pickupDate: new Date(),
            orderLocal: initialData?.orderLocal ?? "",
            observations: initialData?.observations ?? "",
            addressId: initialData?.address?.id ?? "",
            products:
                initialData?.products?.map((p) => ({
                    productId: p.productId,
                    name: p.name,
                    unityType: p.unityType,
                    quantity: p.unityType === "UN" ? p.quantity : p.quantity / 1000,
                    price: p.price,
                })) ?? [],
        },
    });

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const productsData = await fetch<{ products: Product[] }>(productEndpoints.list(1, ""));
                setProducts(productsData?.products || []);
            } catch (error) {
                console.error("Erro ao carregar produtos:", error);
                toast({
                    variant: "destructive",
                    description: "Erro ao carregar produtos",
                });
            }
        };

        loadProducts();
    }, [fetch, toast]);

    // Submit do formulário
    const onSubmit = async (data: OrderFormData) => {
        try {
            setIsLoading(true);

            const orderData = {
                customerId: data.customerId,
                pickupDate: data.pickupDate.toISOString(),
                orderLocal: data.orderLocal,
                observations: data.observations || "",
                addressId: data.addressId || null,
                products: data.products.map((p) => ({
                    productId: p.productId,
                    quantity: p.unityType === "UN" ? p.quantity : p.quantity * 1000,
                    price: p.price,
                })),
            };

            const endpoint = initialData?.id ? orderEndpoints.update(initialData?.id) : orderEndpoints.create();
            const method = initialData?.id ? "PUT" : "POST";

            const result = await fetch<{ id: string }>(endpoint, {
                method,
                body: JSON.stringify(orderData),
            });

            toast({
                variant: "success",
                description: `Pedido ${initialData?.id ? "atualizado" : "criado"} com sucesso!`,
            });

            if (result?.id) {
                router.push(`/orders/${result.id}`);
            }
        } catch (error) {
            console.error("Erro ao salvar pedido:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <OrderCustomerSection
                    form={form}
                    selectedCustomer={selectedCustomer}
                    onSelectedCustomerAction={setSelectedCustomer}
                    addresses={addresses}
                    onAddressesAction={setAddresses}
                    isEditMode={isEditMode}
                />

                <OrderDetailsSection form={form} />

                <OrderProductsSection form={form} products={products} />

                {/* Form Actions */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isLoading}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                    <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Package className="mr-2 h-4 w-4" />
                                {initialData?.id ? "Atualizar Pedido" : "Criar Pedido"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
