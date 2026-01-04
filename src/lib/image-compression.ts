import imageCompression from "browser-image-compression";

export interface CompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    fileType?: string;
}

const defaultOptions: CompressionOptions = {
    maxSizeMB: 1, // Máximo 1MB após compressão
    maxWidthOrHeight: 1200, // Redimensionar se maior que 1200px
    useWebWorker: true, // Não travar a UI
    fileType: "image/jpeg", // Converter tudo para JPEG para melhor compressão
};

/**
 * Comprime uma imagem usando browser-image-compression
 * @param file Arquivo de imagem original
 * @param options Opções de compressão (opcional)
 * @returns Promise<File> Arquivo comprimido
 */
export async function compressImage(file: File, options?: CompressionOptions): Promise<File> {
    const compressionOptions = {
        ...defaultOptions,
        ...options,
    };

    try {
        const compressedFile = await imageCompression(file, compressionOptions);
        return compressedFile;
    } catch (error) {
        console.error("Erro ao comprimir imagem:", error);
        throw new Error("Falha ao comprimir a imagem. Tente novamente.");
    }
}

/**
 * Valida se o arquivo é uma imagem válida
 * @param file Arquivo a ser validado
 * @returns boolean
 */
export function isValidImageFile(file: File): boolean {
    return file.type.startsWith("image/");
}

/**
 * Valida o tamanho do arquivo antes da compressão
 * @param file Arquivo a ser validado
 * @param maxSizeMB Tamanho máximo em MB (padrão: 10MB)
 * @returns boolean
 */
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
}
