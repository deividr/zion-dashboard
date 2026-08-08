import type { Order } from "@/domains";
import type { OrderTicketData } from "@/hooks/usePrintTicket";

// Taxa de entrega: R$ 5,00 por km percorrido (valores em centavos).
const DELIVERY_FEE_PER_KM = 500;

/** Converte um pedido no formato que o cupom ESC/POS espera. */
export function orderToTicketData(order: Order): OrderTicketData {
    const subtotal = order.products.reduce((acc, p) => acc + p.price, 0);
    const deliveryFee = order.address?.distance ? Math.round(order.address.distance * DELIVERY_FEE_PER_KM) : undefined;

    return {
        orderNumber: order.number.toString().padStart(4, "0"),
        date: new Date(order.createdAt).toLocaleString("pt-BR"),
        customerName: order.customer?.name,
        customerPhone: order.customer?.phone,
        items: order.products.map((p) => ({
            name: p.name,
            quantity: p.quantity,
            unit: p.unityType === "UN" ? "un" : p.unityType === "LT" ? "ml" : "g",
            price: p.price,
        })),
        subtotal,
        deliveryFee,
        total: subtotal + (deliveryFee ?? 0),
        observations: order.observations,
        // Fixo por ora: o pedido ainda não tem forma de pagamento no backend.
        // Serve de lembrete para o entregador cobrar na entrega.
        paymentMethod: "Pendente",
    };
}
