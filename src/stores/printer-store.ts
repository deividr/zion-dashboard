import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PrinterConfig {
  name: string;
  paperWidth: 58 | 80;
  copies: number;
  cutPaper: boolean;
  openDrawer: boolean;
  codepage: string;
}

interface PrinterState {
  isConnected: boolean;
  isConnecting: boolean;
  printers: string[];
  config: PrinterConfig;
  error: string | null;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setPrinters: (printers: string[]) => void;
  setConfig: (config: Partial<PrinterConfig>) => void;
  setError: (error: string | null) => void;
}

const defaultConfig: PrinterConfig = {
  name: "",
  paperWidth: 80,
  copies: 1,
  cutPaper: true,
  openDrawer: false,
  codepage: "cp850",
};

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set) => ({
      isConnected: false,
      isConnecting: false,
      printers: [],
      config: defaultConfig,
      error: null,
      setConnected: (connected) => set({ isConnected: connected }),
      setConnecting: (connecting) => set({ isConnecting: connecting }),
      setPrinters: (printers) => set({ printers }),
      setConfig: (config) =>
        set((state) => ({ config: { ...state.config, ...config } })),
      setError: (error) => set({ error }),
    }),
    {
      name: "printer-storage",
    }
  )
);
