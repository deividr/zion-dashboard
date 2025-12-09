"use client";

import { useEffect } from "react";
import { useHeaderStore } from "@/stores/header-store";
import { OrderForm } from "../order-form";

export default function NewOrder() {
    const setTitle = useHeaderStore((state) => state.setTitle);

    useEffect(() => {
        setTitle(["Pedidos", "Novo Pedido"]);
    }, [setTitle]);

    return <OrderForm />;
}
