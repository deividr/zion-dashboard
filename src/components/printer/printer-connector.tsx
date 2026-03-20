"use client";

import { Printer, RefreshCw, AlertCircle } from "lucide-react";
import { usePrinterStore } from "@/stores/printer-store";
import { Button } from "@/components/ui/button";

interface PrinterConnectorProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefresh?: () => void;
}

export function PrinterConnector({
  onConnect,
  onDisconnect,
  onRefresh,
}: PrinterConnectorProps) {
  const { isConnected, isConnecting, error, config } = usePrinterStore();

  const handleConnect = async () => {
    if (onConnect) {
      onConnect();
    }
  };

  const handleDisconnect = async () => {
    if (onDisconnect) {
      onDisconnect();
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Printer className="h-4 w-4" />
        <span className="text-sm font-medium">
          {config.name || "Nenhuma impressora"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <span className="flex h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-600">Conectado</span>
          </>
        ) : (
          <>
            <span className="flex h-2 w-2 rounded-full bg-red-500" />
            <span className="text-xs text-red-600">Desconectado</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isConnecting}
          >
            Desconectar
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              "Conectar"
            )}
          </Button>
        )}

        {isConnected && (
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-destructive text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
