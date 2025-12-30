import { API_URL } from "@/env";

export interface PreSignedUrlResponse {
    signedUrl: string; // URL pré-assinada para upload
    publicUrl: string; // URL pública do arquivo no bucket
    key?: string; // Chave do arquivo no bucket (opcional)
}

/**
 * Busca uma URL pré-assinada do backend para upload de imagem
 * @param filename Nome do arquivo
 * @param contentType Tipo MIME do arquivo (ex: "image/jpeg")
 * @param getToken Função para obter o token de autenticação
 * @returns Promise<PreSignedUrlResponse>
 */
export async function getPreSignedUrl(
    filename: string,
    contentType: string,
    getToken: () => Promise<string | null>
): Promise<PreSignedUrlResponse> {
    const token = await getToken();

    if (!token) {
        throw new Error("Token de autenticação não encontrado");
    }

    // Enviar filename e contentType como query params
    const params = new URLSearchParams({
        filename,
        contentType,
    });

    const response = await fetch(`${API_URL}/pre-signed-url?${params.toString()}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || "Erro ao obter URL pré-assinada");
    }

    return data;
}

/**
 * Faz upload direto de um arquivo para o bucket usando URL pré-assinada
 *
 * IMPORTANTE: Requer CORS configurado no bucket do Tigris.
 *
 * Para configurar CORS no Tigris, você precisa:
 * 1. Acessar as configurações do bucket no Tigris
 * 2. Adicionar regra CORS que permita:
 *    - Origins: ["http://localhost:3001", "https://seu-dominio.com"]
 *    - Methods: ["PUT", "OPTIONS"]
 *    - Headers: ["Content-Type"]
 *    - MaxAge: 3600
 *
 * @param preSignedUrl URL pré-assinada retornada pelo backend
 * @param file Arquivo a ser enviado
 * @returns Promise<void>
 */
export async function uploadToBucket(preSignedUrl: string, file: File): Promise<void> {
    try {
        const response = await fetch(preSignedUrl, {
            method: "PUT",
            headers: {
                "Content-Type": file.type,
            },
            body: file,
            mode: "cors",
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao fazer upload: ${response.status} ${response.statusText}. ${errorText}`);
        }
    } catch (error) {
        // Tratar erros de CORS especificamente
        if (error instanceof TypeError) {
            if (error.message.includes("CORS") || error.message.includes("Failed to fetch")) {
                throw new Error(
                    "Erro de CORS: O bucket do Tigris precisa ter CORS configurado para aceitar requisições do navegador. " +
                        "Configure CORS no bucket permitindo PUT requests da origem do seu frontend."
                );
            }
        }
        throw error;
    }
}

/**
 * Função helper que combina busca de pré-signed URL e upload direto para o bucket
 *
 * IMPORTANTE: Requer CORS configurado no bucket do Tigris.
 * O backend deve retornar a publicUrl na resposta do GET /pre-signed-url
 *
 * @param file Arquivo a ser enviado
 * @param getToken Função para obter o token de autenticação
 * @returns Promise<string> URL pública do arquivo no bucket
 */
export async function uploadImageToBucket(file: File, getToken: () => Promise<string | null>): Promise<string> {
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `products/${timestamp}-${randomString}.${extension}`;

    // Buscar URL pré-assinada
    const { signedUrl, publicUrl } = await getPreSignedUrl(filename, file.type, getToken);

    // Fazer upload direto para o bucket usando a URL pré-assinada
    await uploadToBucket(signedUrl, file);

    // Retornar a URL pública do arquivo
    if (!publicUrl) {
        throw new Error(
            "URL pública não retornada pelo backend. Verifique se o endpoint /pre-signed-url retorna 'publicUrl'."
        );
    }

    return publicUrl;
}
