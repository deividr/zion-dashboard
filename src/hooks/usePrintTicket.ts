"use client";

import { useToast } from "@/hooks/use-toast";
import { createReceipt } from "@/lib/esc-pos";
import { usePrinterStore } from "@/stores/printer-store";
import { useCallback, useEffect, useState } from "react";
// @ts-expect-error qz-tray não possui tipos TypeScript
import qzModule from "qz-tray";
const qz = qzModule as QZTray;

interface QZTray {
    websocket: {
        connect: (options?: { host?: string; port?: number }) => Promise<void>;
        disconnect: () => Promise<void>;
        isActive: () => boolean;
    };
    printers: {
        find: () => Promise<string[]>;
    };
    configs: {
        create: (printer: string, options?: object) => Promise<object>;
    };
    print: (config: object, data: Array<string | Record<string, unknown>>) => Promise<void>;
    security: {
        setCertificatePromise: (fn: (resolve: (cert: string) => void, reject: (err: unknown) => void) => void) => void;
        setSignatureAlgorithm: (algorithm: string) => void;
        setSignaturePromise: (
            fn: (toSign: string) => (resolve: (sig: string) => void, reject: (err: unknown) => void) => void
        ) => void;
    };
}

export interface OrderTicketData {
    orderNumber: string;
    date: string;
    customerName?: string;
    customerPhone?: string;
    items: Array<{
        name: string;
        quantity: number;
        unit: string;
        price: number;
    }>;
    subtotal: number;
    deliveryFee?: number;
    total: number;
    observations?: string;
    paymentMethod?: string;
}

// Coordenação da conexão em escopo de módulo — o QZ Tray é um singleton global,
// então o estado de conexão é compartilhado entre todas as instâncias do hook.
let securityConfigured = false;
let connectInFlight: Promise<void> | null = null;

function configureSecurity() {
    if (securityConfigured) return;
    securityConfigured = true;

    qz.security.setCertificatePromise((resolve, reject) => {
        fetch("/certificate.pem")
            .then((r) => r.text())
            .then(resolve)
            .catch(reject);
    });

    qz.security.setSignatureAlgorithm("SHA512");

    qz.security.setSignaturePromise((toSign) => (resolve, reject) => {
        fetch("/api/sign-print", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: toSign }),
        })
            .then((r) => r.text())
            .then(resolve)
            .catch(reject);
    });
}

export function usePrintTicket() {
    const [isPrinting, setIsPrinting] = useState(false);
    const { config, setConnected, setConnecting, setPrinters, setError } = usePrinterStore();
    const { toast } = useToast();

    const syncPrinters = useCallback(async () => {
        const printers = await qz.printers.find();
        setPrinters(printers);

        const savedName = usePrinterStore.getState().config.name;
        if (savedName && !printers.includes(savedName)) {
            usePrinterStore.getState().setConfig({ name: "" });
            toast({
                variant: "destructive",
                description: `A impressora salva "${savedName}" não foi encontrada. Selecione outra em Configurações.`,
            });
        }
    }, [setPrinters, toast]);

    const connect = useCallback(async () => {
        if (typeof window === "undefined") return;

        // Já conectado: apenas sincroniza o estado local, não reconecta.
        if (qz.websocket.isActive()) {
            setConnected(true);
            return;
        }
        // Deduplica tentativas concorrentes (múltiplas montagens / StrictMode).
        if (connectInFlight) {
            return connectInFlight;
        }

        connectInFlight = (async () => {
            setConnecting(true);
            setError(null);
            try {
                configureSecurity();
                await qz.websocket.connect();
                setConnected(true);
                await syncPrinters();
            } catch (err) {
                console.error("QZ Tray connection error:", err);
                setError(err instanceof Error ? err.message : "Erro ao conectar");
                setConnected(false);
            } finally {
                setConnecting(false);
            }
        })();

        try {
            await connectInFlight;
        } finally {
            connectInFlight = null;
        }
    }, [setConnected, setConnecting, setError, syncPrinters]);

    const disconnect = useCallback(async () => {
        try {
            if (qz.websocket.isActive()) {
                await qz.websocket.disconnect();
            }
        } catch (err) {
            console.error("QZ Tray disconnect error:", err);
        } finally {
            setConnected(false);
        }
    }, [setConnected]);

    const refreshPrinters = useCallback(async () => {
        setError(null);
        await syncPrinters();
    }, [syncPrinters, setError]);

    const printTicket = useCallback(
        async (data: OrderTicketData) => {
            if (!config.name) {
                setError("Impressora não configurada");
                return false;
            }

            setIsPrinting(true);
            setError(null);

            try {
                const receiptCommands = createReceipt({
                    storeName: "LaBuonapasta",
                    orderNumber: data.orderNumber,
                    date: data.date,
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    items: data.items,
                    subtotal: data.subtotal,
                    deliveryFee: data.deliveryFee,
                    total: data.total,
                    observations: data.observations,
                    paymentMethod: data.paymentMethod,
                    cutPaper: config.cutPaper,
                    openDrawer: config.openDrawer,
                    width: config.paperWidth === 58 ? 32 : 48,
                    codepage: config.codepage,
                });

                const configObj = await qz.configs.create(config.name);
                const printData = [{ type: "raw", format: "command", flavor: "hex", data: receiptCommands }];

                for (let i = 0; i < config.copies; i++) {
                    await qz.print(configObj, printData);
                }

                return true;
            } catch (err) {
                console.error("Print error:", err);
                setError(err instanceof Error ? err.message : "Erro ao imprimir");
                return false;
            } finally {
                setIsPrinting(false);
            }
        },
        [config, setError]
    );

    const printRaw = useCallback(
        async (commands: string) => {
            if (!config.name) {
                setError("Impressora não configurada");
                return false;
            }

            setIsPrinting(true);
            setError(null);

            try {
                const configObj = await qz.configs.create(config.name);

                for (let i = 0; i < config.copies; i++) {
                    await qz.print(configObj, [commands]);
                }

                return true;
            } catch (err) {
                console.error("Print error:", err);
                setError(err instanceof Error ? err.message : "Erro ao imprimir");
                return false;
            } finally {
                setIsPrinting(false);
            }
        },
        [config, setError]
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        usePrinterStore.persist.rehydrate();
        connect();
        // Sem cleanup de disconnect: a conexão do QZ Tray é um recurso global
        // compartilhado e não deve ser derrubada ao desmontar um componente que
        // apenas a consome (ex.: sair da página de um pedido).
        // biome-ignore lint/correctness/useExhaustiveDependencies: connect é estável
    }, []);

    return {
        connect,
        disconnect,
        refreshPrinters,
        printTicket,
        printRaw,
        isPrinting,
    };
}
