"use client";

import { useEffect, useState } from "react";
import { usePrinterStore } from "@/stores/printer-store";
import { usePrintTicket } from "@/hooks/usePrintTicket";
import { useToast } from "@/hooks/use-toast";
import { toBytesLatin1 } from "@/lib/esc-pos";
import {
    BAUD_RATE_OPTIONS,
    describePort,
    ensurePrinterPort,
    getBaudRate,
    isWebSerialSupported,
    printToPort,
    setBaudRate,
} from "@/lib/web-serial";
import { PrinterConnector } from "@/components/printer/printer-connector";
import { OrderTicketPreview } from "@/components/printer/order-ticket-preview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, FileText, Settings2, Usb } from "lucide-react";
import { useHeaderStore } from "@/stores/header-store";

const TEST_COMMANDS =
    "\x1B@\x1B\x61\x01" + "=== TESTE DE IMPRESSAO ===" + "\x0A\x0A" + "LaBuonapasta" + "\x0A\x0A\x0A\x1D\x56\x01";

export default function PrinterSettingsPage() {
    const { config, setConfig, printers, isConnected } = usePrinterStore();
    const { connect, refreshPrinters, printRaw, isPrinting } = usePrintTicket();
    const setTitle = useHeaderStore((state) => state.setTitle);
    const { toast } = useToast();

    const [serialSupported, setSerialSupported] = useState(true);
    const [baudRate, setBaudRateState] = useState<number>(9600);
    const [portLabel, setPortLabel] = useState<string | null>(null);
    const [isSerialPrinting, setIsSerialPrinting] = useState(false);

    useEffect(() => {
        setTitle(["Configurações", "Impressora"]);
    }, [setTitle]);

    useEffect(() => {
        // `navigator` e `localStorage` só existem no cliente.
        setSerialSupported(isWebSerialSupported());
        setBaudRateState(getBaudRate());
    }, []);

    const handleTestPrint = async () => {
        await printRaw(TEST_COMMANDS);
    };

    const handleSerialTestPrint = async () => {
        setIsSerialPrinting(true);

        try {
            const port = await ensurePrinterPort();
            setPortLabel(describePort(port));
            await printToPort(port, toBytesLatin1(TEST_COMMANDS), { baudRate });
            toast({ description: "Teste impresso via Web Serial!" });
        } catch (err) {
            console.error("Web Serial test print error:", err);
            toast({
                variant: "destructive",
                description: err instanceof Error ? err.message : "Erro ao imprimir via Web Serial",
            });
        } finally {
            setIsSerialPrinting(false);
        }
    };

    const handleBaudRateChange = (value: string) => {
        const parsed = parseInt(value);
        setBaudRateState(parsed);
        setBaudRate(parsed);
    };

    return (
        <div className="flex flex-col gap-10">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5" />
                        Configurações da Impressora
                    </CardTitle>
                    <CardDescription>Configure a impressora para imprimir cupons não fiscais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <p className="font-medium">Status da Conexão</p>
                            <p className="text-sm text-muted-foreground">QZ Tray deve estar instalado no computador</p>
                        </div>
                        <PrinterConnector onConnect={connect} onRefresh={refreshPrinters} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="printer-name">Impressora</Label>
                            <Select
                                value={config.name}
                                onValueChange={(value) => setConfig({ name: value })}
                                disabled={!isConnected}
                            >
                                <SelectTrigger id="printer-name">
                                    <SelectValue placeholder="Selecione uma impressora" />
                                </SelectTrigger>
                                <SelectContent>
                                    {printers.map((printer) => (
                                        <SelectItem key={printer} value={printer}>
                                            {printer}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paper-width">Largura do Papel</Label>
                            <Select
                                value={config.paperWidth.toString()}
                                onValueChange={(value) => setConfig({ paperWidth: parseInt(value) as 58 | 80 })}
                            >
                                <SelectTrigger id="paper-width">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="58">58mm</SelectItem>
                                    <SelectItem value="80">80mm</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="copies">Cópias</Label>
                            <Input
                                id="copies"
                                type="number"
                                min={1}
                                max={10}
                                value={config.copies}
                                onChange={(e) => setConfig({ copies: parseInt(e.target.value) || 1 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="codepage">Codificação</Label>
                            <Select value={config.codepage} onValueChange={(value) => setConfig({ codepage: value })}>
                                <SelectTrigger id="codepage">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cp850">CP850 (Latin1)</SelectItem>
                                    <SelectItem value="cp437">CP437 (USA)</SelectItem>
                                    <SelectItem value="cp860">CP860 (Português)</SelectItem>
                                    <SelectItem value="cp1252">Windows-1252</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label>Opções de Impressão</Label>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="cut-paper"
                                    checked={config.cutPaper}
                                    onCheckedChange={(checked) => setConfig({ cutPaper: checked as boolean })}
                                />
                                <Label htmlFor="cut-paper" className="font-normal">
                                    Cortar papel automaticamente
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="open-drawer"
                                    checked={config.openDrawer}
                                    onCheckedChange={(checked) => setConfig({ openDrawer: checked as boolean })}
                                />
                                <Label htmlFor="open-drawer" className="font-normal">
                                    Abrir gaveta de dinheiro
                                </Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Teste de Impressão
                    </CardTitle>
                    <CardDescription>Imprima um ticket de teste para verificar as configurações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Button onClick={handleTestPrint} disabled={!config.name || isPrinting} className="w-full">
                        {isPrinting ? "Imprimindo..." : "Imprimir Ticket de Teste"}
                    </Button>

                    <div className="space-y-4 rounded-lg border border-dashed p-4">
                        <div className="flex items-center gap-2">
                            <Usb className="h-4 w-4" />
                            <p className="font-medium">Web Serial (beta)</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Imprime direto na porta COM da impressora, sem QZ Tray. Requer Chrome ou Edge. O navegador
                            pede autorização só na primeira vez.
                        </p>

                        <div className="space-y-2">
                            <Label htmlFor="baud-rate">Baud rate</Label>
                            <Select
                                value={baudRate.toString()}
                                onValueChange={handleBaudRateChange}
                                disabled={!serialSupported}
                            >
                                <SelectTrigger id="baud-rate">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {BAUD_RATE_OPTIONS.map((rate) => (
                                        <SelectItem key={rate} value={rate.toString()}>
                                            {rate}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            variant="outline"
                            onClick={handleSerialTestPrint}
                            disabled={!serialSupported || isSerialPrinting}
                            className="w-full"
                        >
                            {isSerialPrinting ? "Imprimindo..." : "Imprimir teste via Web Serial (beta)"}
                        </Button>

                        {!serialSupported && (
                            <p className="text-sm text-destructive">
                                Web Serial indisponível neste navegador. Use Chrome ou Edge, em HTTPS.
                            </p>
                        )}
                        {portLabel && <p className="text-sm text-muted-foreground">Porta autorizada: {portLabel}</p>}
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="mb-4 flex items-center gap-2 font-medium">
                            <Settings2 className="h-4 w-4" />
                            Preview do Cupom
                        </h3>
                        <OrderTicketPreview
                            data={{
                                orderNumber: "001",
                                date: new Date().toLocaleString("pt-BR"),
                                customerName: "João Silva",
                                customerPhone: "(11) 99999-9999",
                                items: [
                                    { name: "Pasta ao Pesto", quantity: 1, unit: "un", price: 3500 },
                                    { name: "Nhoque", quantity: 500, unit: "g", price: 2500 },
                                ],
                                subtotal: 6000,
                                deliveryFee: 500,
                                total: 6500,
                                observations: "Sem cebola",
                                paymentMethod: "PIX",
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Instalação do QZ Tray</CardTitle>
                    <CardDescription>Como configurar o QZ Tray no seu computador</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <ol className="list-inside list-decimal space-y-2">
                        <li>
                            Baixe o QZ Tray em{" "}
                            <a
                                href="https://qz.io"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                qz.io
                            </a>
                        </li>
                        <li>Instale o aplicativo no seu computador</li>
                        <li>Execute o QZ Tray (ícone na bandeja do sistema)</li>
                        <li>Na primeira impressão, permita o acesso quando solicitado</li>
                        <li>Marque &quot;Remember&quot; para não pedir permissão novamente</li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}
