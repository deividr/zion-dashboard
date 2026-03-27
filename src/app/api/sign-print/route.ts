import { createSign } from "crypto";

export async function POST(req: Request) {
    const { message } = await req.json();
    const privateKey = process.env.PRINT_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!privateKey) {
        return new Response("PRINT_PRIVATE_KEY não configurada", { status: 500 });
    }

    const sign = createSign("SHA512");
    sign.update(message);
    const signature = sign.sign(privateKey, "base64");

    return new Response(signature, {
        headers: { "Content-Type": "text/plain" },
    });
}
