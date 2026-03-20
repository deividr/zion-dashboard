"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePrinterStore } from "@/stores/printer-store";
import { createReceipt } from "@/lib/esc-pos";

declare global {
  interface Window {
    qz: QZTray;
  }
}

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
  print: (config: object, data: string[]) => Promise<void>;
}

let qzLoaded = false;

async function loadQZTray(): Promise<QZTray | null> {
  if (typeof window === "undefined") return null;
  if (qzLoaded && window.qz) return window.qz as unknown as QZTray;

  return new Promise((resolve) => {
    if (document.getElementById("qz-tray-script")) {
      const checkQz = setInterval(() => {
        if (window.qz) {
          clearInterval(checkQz);
          qzLoaded = true;
          resolve(window.qz as unknown as QZTray);
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = "qz-tray-script";
    script.src = "https://qz.io/download/qz-tray";
    script.async = true;
    script.onload = () => {
      qzLoaded = true;
      resolve(window.qz as unknown as QZTray);
    };
    script.onerror = () => {
      console.error("Failed to load QZ Tray");
      resolve(null);
    };
    document.head.appendChild(script);
  });
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

export function usePrintTicket() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [qz, setQz] = useState<QZTray | null>(null);
  const { config, setConnected, setConnecting, setPrinters, setError } =
    usePrinterStore();
  const initialized = useRef(false);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (initialized.current) return;

    initialized.current = true;
    setConnecting(true);

    try {
      const qzInstance = await loadQZTray();
      if (!qzInstance) {
        setError("Falha ao carregar QZ Tray");
        setConnecting(false);
        return;
      }

      setQz(qzInstance);

      await qzInstance.websocket.connect();
      setConnected(true);

      const printers = await qzInstance.printers.find();
      setPrinters(printers);
    } catch (err) {
      console.error("QZ Tray connection error:", err);
      setError(err instanceof Error ? err.message : "Erro ao conectar");
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  }, [setConnected, setConnecting, setPrinters, setError]);

  const disconnect = useCallback(async () => {
    if (qz) {
      await qz.websocket.disconnect();
      setConnected(false);
    }
  }, [qz, setConnected]);

  const refreshPrinters = useCallback(async () => {
    if (qz) {
      const printers = await qz.printers.find();
      setPrinters(printers);
    }
  }, [qz, setPrinters]);

  const printTicket = useCallback(
    async (data: OrderTicketData) => {
      if (!qz || !config.name) {
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
        });

        const configObj = await qz.configs.create(config.name);

        for (let i = 0; i < config.copies; i++) {
          await qz.print(configObj, [receiptCommands]);
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
    [qz, config, setError]
  );

  const printRaw = useCallback(
    async (commands: string) => {
      if (!qz || !config.name) {
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
    [qz, config, setError]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  // biome-ignore lint/correctness/useExhaustiveDependencies: connect/disconnect são estabilidadeis e não devem mudar
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
