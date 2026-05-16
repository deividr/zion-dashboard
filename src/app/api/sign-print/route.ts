import { createSign } from "crypto";

export async function POST(req: Request) {
    try {
        const { message } = await req.json();
        const privateKey = process.env.PRINT_PRIVATE_KEY?.replace(/\\n/g, "\n");

        if (!privateKey) {
            console.error("[sign-print] PRINT_PRIVATE_KEY não configurada");
            return new Response("PRINT_PRIVATE_KEY não configurada", { status: 500 });
        }

        const sign = createSign("SHA512");
        sign.update(message);
        const signature = sign.sign(privateKey, "base64");

        return new Response(signature, {
            headers: { "Content-Type": "text/plain" },
        });
    } catch (err) {
        const error = err as NodeJS.ErrnoException;
        console.error(`[sign-print] Falha ao assinar: ${error.code ?? "UNKNOWN"} - ${error.message}`);
        return new Response(`Falha ao assinar: ${error.code ?? "erro desconhecido"}`, { status: 500 });
    }
}
