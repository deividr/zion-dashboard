"use client";

import { Address, Category, Customer, Order, Product } from "@/domains";
import { useToast } from "@/hooks/use-toast";
import { useFetchClient } from "@/lib/fetch-client";
import { orderEndpoints } from "@/repository/orderRepository";
import { productEndpoints } from "@/repository/productRepository";
import { categoryEndpoints } from "@/repository/categoryRepository";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OrderCustomerSection } from "./order-customer-section";
import { OrderMenuSection } from "./order-menu-section";
import { OrderSummarySection } from "./order-summary-section";
import { Form } from "@/components/ui";

const orderFormSchema = z.object({
    customerId: z.string().uuid("Selecione um cliente"),
    pickupDate: z.date({
        required_error: "Selecione a data de retirada",
    }),
    orderLocal: z.string().optional(),
    observations: z.string().optional(),
    addressId: z.string().optional(),
    products: z
        .array(
            z.object({
                productId: z.string().uuid(),
                name: z.string(),
                unityType: z.string(),
                quantity: z.number().min(0.25, "Quantidade deve ser maior que 0"),
                price: z.number().min(1, "Preço deve ser maior que 0"),
                isVariablePrice: z.boolean().optional(),
                subProducts: z.array(z.object({ productId: z.string().uuid() })).optional(),
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
    const [categories, setCategories] = useState<Category[]>([]);
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
                    subProducts: p.subProducts ?? [],
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

    // Atualizar isVariablePrice nos produtos do pedido ao carregar catálogo (modo edição)
    useEffect(() => {
        if (!initialData?.products || products.length === 0) return;

        const currentProducts = form.getValues("products");
        if (currentProducts.length === 0) return;

        const updatedProducts = currentProducts.map((p) => {
            const catalogProduct = products.find((prod) => prod.id === p.productId);
            return {
                ...p,
                isVariablePrice: catalogProduct?.isVariablePrice ?? false,
            };
        });

        form.setValue("products", updatedProducts);
    }, [products, initialData, form]);

    useEffect(() => {
        const fetchCategories = async () => {
            const dataCategories = await fetch<Category[]>(categoryEndpoints.list());
            setCategories(dataCategories || []);
        };
        fetchCategories();
    }, [fetch]);

    const subProducts = useMemo(() => {
        const molhos = categories?.find((c) => c.name === "Molhos" || c.name === "Molho");
        return products
            .filter((p) => p.categoryId === molhos?.id)
            .map((p) => ({ productId: p.id as string, name: p.name }));
    }, [products, categories]);

    const isMassasProduct = useCallback(
        (product: Product) => {
            const massasCategory = categories?.find((c) => c.name === "Massas" || c.name === "Massa");
            return product.categoryId === massasCategory?.id;
        },
        [categories]
    );

    const onSubmit = async (data: OrderFormData) => {
        try {
            setIsLoading(true);

            const orderData = {
                id: initialData?.id,
                customerId: data.customerId,
                pickupDate: data.pickupDate.toISOString(),
                orderLocal: data.orderLocal,
                observations: data.observations || "",
                addressId: data.addressId || null,
                products: data.products.map((p) => ({
                    productId: p.productId,
                    name: p.name,
                    unityType: p.unityType,
                    quantity: p.unityType === "UN" ? p.quantity : p.quantity * 1000,
                    price: p.price,
                    subProducts: p.subProducts,
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
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-4 h-full">
                    {/* Coluna Esquerda: Identificação do Cliente */}
                    <OrderCustomerSection
                        form={form}
                        selectedCustomer={selectedCustomer}
                        onSelectedCustomerAction={setSelectedCustomer}
                        addresses={addresses}
                        onAddressesAction={setAddresses}
                        isEditMode={isEditMode}
                    />

                    {/* Coluna Central: Cardápio */}
                    <OrderMenuSection
                        form={form}
                        products={products}
                        categories={categories}
                        subProducts={subProducts}
                        isMassasProductAction={isMassasProduct}
                    />

                    {/* Coluna Direita: Resumo do Pedido */}
                    <OrderSummarySection
                        form={form}
                        products={products}
                        addresses={addresses}
                        isLoading={isLoading}
                        isEditingMode
                    />
                </div>
            </form>
        </Form>
    );
}
