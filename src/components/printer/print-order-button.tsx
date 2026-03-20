"use client";

import { Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrintTicket, OrderTicketData } from "@/hooks/usePrintTicket";
import { usePrinterStore } from "@/stores/printer-store";
import { Order } from "@/domains";
import { useToast } from "@/hooks/use-toast";

interface PrintOrderButtonProps {
  order: Order;
}

export function PrintOrderButton({ order }: PrintOrderButtonProps) {
  const { printTicket, isPrinting } = usePrintTicket();
  const { config, isConnected } = usePrinterStore();
  const { toast } = useToast();

  const handlePrint = async () => {
    if (!config.name) {
      toast({
        description: "Configure a impressora primeiro",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        description: "Conecte a impressora primeiro",
        variant: "destructive",
      });
      return;
    }

    const ticketData: OrderTicketData = {
      orderNumber: order.number.toString().padStart(4, "0"),
      date: new Date(order.createdAt).toLocaleString("pt-BR"),
      customerName: order.customer?.name,
      customerPhone: order.customer?.phone,
      items: order.products.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        unit: p.unityType === "UN" ? "un" : "g",
        price: p.price,
      })),
      subtotal: order.products.reduce((acc, p) => acc + p.price, 0),
      deliveryFee: order.address?.distance
        ? Math.round(order.address.distance * 500)
        : undefined,
      total:
        order.products.reduce((acc, p) => acc + p.price, 0) +
        (order.address?.distance ? Math.round(order.address.distance * 500) : 0),
      observations: order.observations,
      paymentMethod: "Pendente",
    };

    const success = await printTicket(ticketData);

    if (success) {
      toast({
        description: "Cupom impresso com sucesso!",
      });
    } else {
      toast({
        description: "Erro ao imprimir cupom",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handlePrint}
      disabled={isPrinting || !config.name || !isConnected}
    >
      {isPrinting ? (
        <>
          <FileText className="h-4 w-4 animate-pulse" />
          Imprimindo...
        </>
      ) : (
        <>
          <Printer className="h-4 w-4" />
          Imprimir Cupom
        </>
      )}
    </Button>
  );
}
