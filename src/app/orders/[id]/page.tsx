"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useHeaderStore } from "@/stores/header-store";
import { useFetchClient } from "@/lib/fetch-client";
import { Order } from "@/domains";
import { orderEndpoints } from "@/repository/orderRepository";
import { OrderForm } from "../order-form";
import { Loader2 } from "lucide-react";

export default function EditOrder() {
    const { id } = useParams();
    const setTitle = useHeaderStore((state) => state.setTitle);
    const { fetch } = useFetchClient();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setIsLoading(true);
                const result = await fetch<Order>(orderEndpoints.get(id as string));
                if (result) {
                    setOrder(result);
                    setTitle(["Pedidos", `Editar Pedido #${result.number}`]);
                }
            } catch (error) {
                console.error("Erro ao carregar pedido:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchOrder();
        }
    }, [id, fetch, setTitle]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando pedido...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Pedido não encontrado</p>
            </div>
        );
    }

    return <OrderForm initialData={order} />;
}
