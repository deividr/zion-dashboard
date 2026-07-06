import { Codepage, encodeText, toCodepage } from "./codepage";

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export interface EscPosOptions {
    width?: number;
    codepage?: string;
}

// Comando ESC t n para selecionar a tabela de caracteres na impressora.
const CODEPAGE_COMMAND: Record<Codepage, number> = {
    cp437: 0x00,
    cp850: 0x02,
    cp860: 0x03,
    cp1252: 0x10,
};

export class EscPosEncoder {
    private bytes: number[] = [];
    private width: number;
    private currentCodepage: Codepage;

    constructor(options: EscPosOptions = {}) {
        this.width = options.width || 48;
        this.currentCodepage = toCodepage(options.codepage || "cp850");
    }

    private raw(...values: number[]): this {
        for (const value of values) {
            this.bytes.push(value & 0xff);
        }
        return this;
    }

    initialize(): this {
        return this.raw(ESC, 0x40);
    }

    setCodepage(codepage: string): this {
        const cp = toCodepage(codepage);
        this.currentCodepage = cp;
        return this.raw(ESC, 0x74, CODEPAGE_COMMAND[cp]);
    }

    codepage(codepage: string): this {
        return this.setCodepage(codepage);
    }

    text(text: string): this {
        return this.raw(...encodeText(text, this.currentCodepage));
    }

    newline(): this {
        return this.raw(LF);
    }

    line(text: string): this {
        return this.text(text).newline();
    }

    alignCenter(): this {
        return this.raw(ESC, 0x61, 0x01);
    }

    alignLeft(): this {
        return this.raw(ESC, 0x61, 0x00);
    }

    alignRight(): this {
        return this.raw(ESC, 0x61, 0x02);
    }

    bold(on: boolean = true): this {
        return this.raw(ESC, 0x45, on ? 0x01 : 0x00);
    }

    underline(on: boolean = true): this {
        return this.raw(ESC, 0x2d, on ? 0x01 : 0x00);
    }

    doubleHeight(on: boolean = true): this {
        return this.raw(ESC, 0x21, on ? 0x10 : 0x00);
    }

    doubleWidth(on: boolean = true): this {
        return this.raw(ESC, 0x21, on ? 0x20 : 0x00);
    }

    big(on: boolean = true): this {
        return this.raw(ESC, 0x21, on ? 0x30 : 0x00);
    }

    feed(lines: number = 1): this {
        for (let i = 0; i < lines; i++) {
            this.raw(LF);
        }
        return this;
    }

    cutPartial(): this {
        return this.raw(GS, 0x56, 0x01);
    }

    cutFull(): this {
        return this.raw(GS, 0x56, 0x00);
    }

    cut(): this {
        this.feed(3);
        return this.cutPartial();
    }

    openCashDrawer(): this {
        return this.raw(ESC, 0x70, 0x00, 0x19, 0xfa);
    }

    qrcode(data: string): this {
        const bytes = encodeText(data, this.currentCodepage);
        const len = bytes.length + 3;
        const pL = len % 256;
        const pH = Math.floor(len / 256);
        return this.raw(GS, 0x6b, 0x51, 0x00, pL, pH, ...bytes);
    }

    encode(): string {
        return this.toHex();
    }

    toBytes(): Uint8Array {
        return Uint8Array.from(this.bytes);
    }

    toHex(): string {
        return this.bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
}

export function createReceipt(data: {
    storeName: string;
    address?: string;
    phone?: string;
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
    cutPaper?: boolean;
    openDrawer?: boolean;
    width?: number;
    codepage?: string;
}): string {
    const width = data.width ?? 48;
    const codepage = toCodepage(data.codepage || "cp850");

    // Colunas da tabela de itens dimensionadas pela largura do papel.
    const valueCol = width >= 48 ? 12 : 8;
    const qtyCol = width >= 48 ? 8 : 6;
    const nameCol = width - valueCol - qtyCol;
    // Largura da coluna esquerda dos totais (label) = tudo menos o valor.
    const labelCol = width - valueCol;

    const encoder = new EscPosEncoder({ width, codepage });

    encoder.initialize().codepage(codepage);

    encoder.alignCenter().big(true).line(data.storeName).big(false);

    if (data.address) {
        encoder.line(data.address);
    }
    if (data.phone) {
        encoder.line(data.phone);
    }

    encoder.feed(1).alignLeft();

    encoder.bold(true).line(`Pedido: ${data.orderNumber}`).line(`Data: ${data.date}`).bold(false);

    if (data.customerName) {
        encoder.line(`Cliente: ${data.customerName}`);
    }
    if (data.customerPhone) {
        encoder.line(`Tel: ${data.customerPhone}`);
    }

    encoder.feed(1).line("-".repeat(width));

    encoder.line("PRODUTO".padEnd(nameCol) + "QTD".padStart(qtyCol) + "VALOR".padStart(valueCol));

    encoder.line("-".repeat(width));

    for (const item of data.items) {
        const maxName = nameCol - 2;
        const name = item.name.length > maxName ? item.name.substring(0, maxName) + ".." : item.name;
        const qty = `${item.quantity}${item.unit}`;
        const price = formatCurrency(item.price);
        encoder.line(name.padEnd(nameCol) + qty.padStart(qtyCol) + price.padStart(valueCol));
    }

    encoder.line("-".repeat(width));

    encoder.line("SUBTOTAL:".padEnd(labelCol) + formatCurrency(data.subtotal).padStart(valueCol));

    if (data.deliveryFee && data.deliveryFee > 0) {
        encoder.line("ENTREGA:".padEnd(labelCol) + formatCurrency(data.deliveryFee).padStart(valueCol));
    }

    encoder
        .bold(true)
        .line("TOTAL:".padEnd(labelCol) + formatCurrency(data.total).padStart(valueCol))
        .bold(false);

    if (data.observations) {
        encoder.feed(1).bold(true).line("OBS:").bold(false);
        encoder.line(data.observations);
    }

    if (data.paymentMethod) {
        encoder.line(`Pagamento: ${data.paymentMethod}`);
    }

    encoder.feed(3).alignCenter().line("Obrigado pela preferência!");

    if (data.cutPaper !== false) {
        encoder.cut();
    }

    if (data.openDrawer) {
        encoder.openCashDrawer();
    }

    return encoder.toHex();
}

function formatCurrency(cents: number): string {
    return (cents / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
