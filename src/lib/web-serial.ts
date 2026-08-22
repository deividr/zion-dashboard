/**
 * Web Serial API — conversa direta do navegador com a impressora térmica pela
 * porta COM virtual (USB), sem QZ Tray, sem bridge Java e sem servidor no
 * caminho da impressão.
 *
 * Prova de conceito: convive com o QZ Tray, que segue sendo o caminho padrão.
 *
 * Modelo open-per-print — abrir a porta, escrever, fechar, a cada impressão.
 * Mais robusto que manter um handle aberto: evita porta travada depois que o
 * USB suspende.
 */

export const DEFAULT_BAUD_RATE = 9600;
export const BAUD_RATE_OPTIONS = [9600, 19200, 38400, 115200] as const;

const BAUD_RATE_STORAGE_KEY = "web-serial-baud-rate";

/**
 * Web Serial exige contexto seguro (HTTPS ou localhost) e navegador Chromium.
 * Sempre chame no cliente — no servidor retorna `false`.
 */
export function isWebSerialSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "serial" in navigator && window.isSecureContext;
}

/**
 * Baud rate da PoC, em localStorage próprio para não mexer no `printer-store`
 * (que ainda é do QZ). Na Fase 2 isso migra para o `PrinterConfig`.
 */
export function getBaudRate(): number {
    if (typeof window === "undefined") return DEFAULT_BAUD_RATE;
    const stored = Number(window.localStorage.getItem(BAUD_RATE_STORAGE_KEY));
    return (BAUD_RATE_OPTIONS as readonly number[]).includes(stored) ? stored : DEFAULT_BAUD_RATE;
}

export function setBaudRate(baudRate: number): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BAUD_RATE_STORAGE_KEY, String(baudRate));
}

/**
 * Porta já autorizada anteriormente, recuperada em silêncio (sem diálogo).
 * Como a loja tem uma única impressora, usamos a única porta concedida.
 * Retorna `null` se nenhuma — ou mais de uma — estiver autorizada.
 */
export async function getGrantedPort(): Promise<SerialPort | null> {
    if (!isWebSerialSupported()) return null;
    const ports = await navigator.serial.getPorts();
    return ports.length === 1 ? ports[0] : null;
}

/**
 * Abre o seletor de portas do navegador. Exige gesto do usuário (clique).
 * Sem filtro de VID/PID: quem escolhe a Daruma é o usuário.
 */
export async function requestPrinterPort(): Promise<SerialPort> {
    if (!isWebSerialSupported()) {
        throw new Error("Web Serial indisponível. Use Chrome ou Edge, em HTTPS.");
    }
    return navigator.serial.requestPort();
}

/**
 * Porta pronta para imprimir: reaproveita a autorização anterior se existir,
 * senão pede uma vez. É o que faz o diálogo aparecer só na primeira impressão.
 */
export async function ensurePrinterPort(): Promise<SerialPort> {
    return (await getGrantedPort()) ?? (await requestPrinterPort());
}

/** Identificação USB da porta, para exibir na UI. */
export function describePort(port: SerialPort): string {
    const { usbVendorId, usbProductId } = port.getInfo();
    if (usbVendorId === undefined || usbProductId === undefined) return "Porta serial";
    const hex = (value: number) => value.toString(16).padStart(4, "0").toUpperCase();
    return `USB ${hex(usbVendorId)}:${hex(usbProductId)}`;
}

// Uma porta só aceita um open() por vez. Serializar aqui evita que cliques
// repetidos — ou várias cópias em sequência — estourem InvalidStateError.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Tempo morto entre `port.open()` resolver e a porta COM realmente transmitir.
 * Medido em cupom real: os primeiros 42–90 bytes se perdiam, o equivalente a
 * 44–94 ms a 9600 baud — junto levavam o `ESC @`, a codepage e o cabeçalho.
 */
const PORT_SETTLE_MS = 400;

/**
 * O `ESC @` reinicia a impressora, e durante o reset ela descarta o que chega.
 * Enviado como bloco próprio, com folga depois, para o cabeçalho não cair nessa
 * janela.
 */
const RESET_SETTLE_MS = 300;

/**
 * Latência de teardown entre o último byte sair daqui e chegar na impressora.
 * Sem essa folga, fechar a porta cortava os últimos 33 bytes — que é onde vivem
 * o `feed(3)` e o `GS V` do corte, daí o cupom ficar preso sob a lâmina.
 * É latência fixa, não proporcional ao tamanho: margem constante é o modelo certo.
 */
const DRAIN_MARGIN_MS = 600;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Envia bytes ESC/POS para a impressora: abre a porta, escreve e fecha. */
export function printToPort(port: SerialPort, bytes: Uint8Array, options: { baudRate?: number } = {}): Promise<void> {
    const run = queue.then(
        () => writeToPort(port, bytes, options),
        () => writeToPort(port, bytes, options)
    );
    // A fila nunca rejeita, senão um erro derrubaria as impressões seguintes.
    queue = run.catch(() => undefined);
    return run;
}

function splitAfterInitialize(bytes: Uint8Array): [Uint8Array] | [Uint8Array, Uint8Array] {
    const startsWithInitialize = bytes.length > 2 && bytes[0] === 0x1b && bytes[1] === 0x40;
    return startsWithInitialize ? [bytes.subarray(0, 2), bytes.subarray(2)] : [bytes];
}

async function writeToPort(
    port: SerialPort,
    bytes: Uint8Array,
    { baudRate = getBaudRate() }: { baudRate?: number }
): Promise<void> {
    await port.open({ baudRate });

    try {
        if (!port.writable) {
            throw new Error("Porta serial aberta mas sem canal de escrita");
        }

        await delay(PORT_SETTLE_MS);

        const writer = port.writable.getWriter();
        try {
            const chunks = splitAfterInitialize(bytes);
            for (const [index, chunk] of chunks.entries()) {
                await writer.write(chunk);
                if (index === 0 && chunks.length > 1) {
                    await delay(RESET_SETTLE_MS);
                }
            }
            await writer.close();
            await delay(DRAIN_MARGIN_MS);
        } finally {
            writer.releaseLock();
        }
    } finally {
        await port.close();
    }
}
