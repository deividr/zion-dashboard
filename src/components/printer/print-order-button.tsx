"use client";

import { Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrintTicket } from "@/hooks/usePrintTicket";
import { usePrinterStore } from "@/stores/printer-store";
import { Order } from "@/domains";
import { useToast } from "@/hooks/use-toast";
import { orderToTicketData } from "@/lib/order-ticket";

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

        const success = await printTicket(orderToTicketData(order));

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
        <Button variant="outline" onClick={handlePrint} disabled={isPrinting || !config.name || !isConnected}>
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
