"use client";

import { useEffect, useState } from "react";
import { FileText, Usb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/domains";
import { useToast } from "@/hooks/use-toast";
import { createReceipt, hexToBytes } from "@/lib/esc-pos";
import { orderToTicketData } from "@/lib/order-ticket";
import { ensurePrinterPort, isWebSerialSupported, printToPort } from "@/lib/web-serial";
import { usePrinterStore } from "@/stores/printer-store";

interface PrintOrderButtonSerialProps {
    order: Order;
}

/**
 * Botão da PoC de Web Serial — imprime o mesmo cupom do botão QZ, mas falando
 * direto com a porta COM. Temporário: na Fase 2 essa lógica se funde ao
 * `print-order-button.tsx` e este componente deixa de existir.
 */
export function PrintOrderButtonSerial({ order }: PrintOrderButtonSerialProps) {
    const { config } = usePrinterStore();
    const { toast } = useToast();
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        // `navigator` só existe no cliente: checar depois da montagem evita
        // divergência de hidratação no primeiro render.
        setIsSupported(isWebSerialSupported());
        usePrinterStore.persist.rehydrate();
    }, []);

    const handlePrint = async () => {
        setIsPrinting(true);

        try {
            const port = await ensurePrinterPort();

            const receipt = createReceipt({
                storeName: "LaBuonapasta",
                ...orderToTicketData(order),
                cutPaper: config.cutPaper,
                openDrawer: config.openDrawer,
                width: config.paperWidth === 58 ? 32 : 48,
                codepage: config.codepage,
            });
            const bytes = hexToBytes(receipt);

            for (let i = 0; i < config.copies; i++) {
                await printToPort(port, bytes);
            }

            toast({ description: "Cupom impresso via Web Serial!" });
        } catch (err) {
            console.error("Web Serial print error:", err);
            toast({
                variant: "destructive",
                description: err instanceof Error ? err.message : "Erro ao imprimir via Web Serial",
            });
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <Button variant="outline" onClick={handlePrint} disabled={isPrinting || !isSupported}>
            {isPrinting ? (
                <>
                    <FileText className="h-4 w-4 animate-pulse" />
                    Imprimindo...
                </>
            ) : (
                <>
                    <Usb className="h-4 w-4" />
                    Imprimir via Web Serial (beta)
                </>
            )}
        </Button>
    );
}
