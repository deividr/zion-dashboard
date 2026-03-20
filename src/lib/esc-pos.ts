const ESC = "\x1B";
const GS = "\x1D";
const LF = "\x0A";

export interface EscPosOptions {
  width?: number;
  codepage?: string;
}

export class EscPosEncoder {
  private commands: string[] = [];
  private width: number;
  private currentCodepage: string;

  constructor(options: EscPosOptions = {}) {
    this.width = options.width || 48;
    this.currentCodepage = options.codepage || "cp850";
  }

  initialize(): this {
    this.commands.push(ESC + "@");
    return this;
  }

  setCodepage(codepage: string): this {
    const codepages: Record<string, string> = {
      cp437: "\x00",
      cp850: "\x02",
      cp860: "\x03",
      cp863: "\x04",
      cp865: "\x05",
      cp1252: "\x10",
      cp866: "\x11",
      cp852: "\x12",
      cp858: "\x13",
      "windows-1252": "\x10",
    };
    if (codepages[codepage]) {
      this.commands.push(ESC + "t" + codepages[codepage]);
      this.currentCodepage = codepage;
    }
    return this;
  }

  codepage(codepage: string): this {
    return this.setCodepage(codepage);
  }

  text(text: string): this {
    this.commands.push(text);
    return this;
  }

  newline(): this {
    this.commands.push(LF);
    return this;
  }

  line(text: string): this {
    this.commands.push(text + LF);
    return this;
  }

  alignCenter(): this {
    this.commands.push(ESC + "a" + "\x01");
    return this;
  }

  alignLeft(): this {
    this.commands.push(ESC + "a" + "\x00");
    return this;
  }

  alignRight(): this {
    this.commands.push(ESC + "a" + "\x02");
    return this;
  }

  bold(on: boolean = true): this {
    this.commands.push(ESC + "E" + (on ? "\x01" : "\x00"));
    return this;
  }

  underline(on: boolean = true): this {
    this.commands.push(ESC + "-" + (on ? "\x01" : "\x00"));
    return this;
  }

  doubleHeight(on: boolean = true): this {
    this.commands.push(ESC + "!" + (on ? "\x10" : "\x00"));
    return this;
  }

  doubleWidth(on: boolean = true): this {
    this.commands.push(ESC + "!" + (on ? "\x20" : "\x00"));
    return this;
  }

  big(on: boolean = true): this {
    this.commands.push(ESC + "!" + (on ? "\x30" : "\x00"));
    return this;
  }

  feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.commands.push(LF);
    }
    return this;
  }

  cutPartial(): this {
    this.commands.push(GS + "V" + "\x01");
    return this;
  }

  cutFull(): this {
    this.commands.push(GS + "V" + "\x00");
    return this;
  }

  cut(): this {
    this.feed(3);
    this.cutPartial();
    return this;
  }

  openCashDrawer(): this {
    this.commands.push(ESC + "p" + "\x00" + "\x19" + "\xFA");
    return this;
  }

  qrcode(data: string, size = 6): this {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void size;
    const len = data.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    this.commands.push(GS + "k" + "Q" + "\x00" + String.fromCharCode(pL) + String.fromCharCode(pH) + data);
    return this;
  }

  barcode(
    data: string,
    type: "EAN13" | "EAN8" | "CODE39" | "CODE128" | "ITF" | "CODABAR" = "CODE128",
    height: number = 50
  ): this {
    const types: Record<string, string> = {
      EAN13: "\x00",
      EAN8: "\x02",
      CODE39: "\x04",
      ITF: "\x05",
      CODABAR: "\x06",
      CODE128: "\x00",
    };

    const barcodeType = type === "CODE128" ? "A" : types[type];
    const barcodeCmd = type === "CODE128" ? "k" : "f";

    this.commands.push(GS + "h" + String.fromCharCode(height));
    this.commands.push(GS + "w" + "\x02");
    this.commands.push(GS + barcodeCmd + barcodeType + data + "\x00");

    return this;
  }

  encode(): string {
    return this.commands.join("");
  }

  toBytes(): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(this.encode());
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
}): string {
  const encoder = new EscPosEncoder({ width: 48 });

  encoder.initialize().codepage("cp850");

  encoder.alignCenter().big(true).line(data.storeName).big(false);

  if (data.address) {
    encoder.line(data.address);
  }
  if (data.phone) {
    encoder.line(data.phone);
  }

  encoder.feed(1).alignLeft();

  encoder
    .bold(true)
    .line(`Pedido: ${data.orderNumber}`)
    .line(`Data: ${data.date}`)
    .bold(false);

  if (data.customerName) {
    encoder.line(`Cliente: ${data.customerName}`);
  }
  if (data.customerPhone) {
    encoder.line(`Tel: ${data.customerPhone}`);
  }

  encoder.feed(1).line("-".repeat(48));

  encoder.line(
    "PRODUTO".padEnd(28) +
      "QTD".padStart(8) +
      "VALOR".padStart(12)
  );

  encoder.line("-".repeat(48));

  for (const item of data.items) {
    const name = item.name.length > 26 ? item.name.substring(0, 26) + ".." : item.name;
    const qty = `${item.quantity}${item.unit}`;
    const price = formatCurrency(item.price);
    encoder.line(name.padEnd(28) + qty.padStart(8) + price.padStart(12));
  }

  encoder.line("-".repeat(48));

  encoder.line(
    "SUBTOTAL:".padEnd(36) + formatCurrency(data.subtotal).padStart(12)
  );

  if (data.deliveryFee && data.deliveryFee > 0) {
    encoder.line(
      "ENTREGA:".padEnd(36) + formatCurrency(data.deliveryFee).padStart(12)
    );
  }

  encoder.bold(true).line(
    "TOTAL:".padEnd(36) + formatCurrency(data.total).padStart(12)
  ).bold(false);

  if (data.observations) {
    encoder.feed(1).bold(true).line("OBS:").bold(false);
    encoder.line(data.observations);
  }

  if (data.paymentMethod) {
    encoder.line(`Pagamento: ${data.paymentMethod}`);
  }

  encoder.feed(3).alignCenter().line("Obrigado pela preferencia!");

  if (data.cutPaper !== false) {
    encoder.cut();
  }

  if (data.openDrawer) {
    encoder.openCashDrawer();
  }

  return encoder.encode();
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
