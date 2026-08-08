"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useHeaderStore } from "@/stores/header-store";
import { useFetchClient } from "@/lib/fetch-client";
import { Order } from "@/domains";
import { orderEndpoints } from "@/repository/orderRepository";
import { OrderForm } from "../order-form";
import { PrintOrderButton } from "@/components/printer/print-order-button";
import { PrintOrderButtonSerial } from "@/components/printer/print-order-button-serial";
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
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Carregando pedido...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">Pedido não encontrado</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end gap-2">
                <PrintOrderButton order={order} />
                <PrintOrderButtonSerial order={order} />
            </div>
            <OrderForm initialData={order} />
        </div>
    );
}
