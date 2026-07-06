/**
 * Codificação de texto Unicode para as codepages OEM/ANSI usadas por
 * impressoras térmicas ESC/POS.
 *
 * O byte 0x00–0x7F é ASCII (identidade). Só o intervalo alto (0x80–0xFF)
 * difere entre codepages. Mapeamos explicitamente os caracteres latinos que
 * aparecem em texto pt-BR (acentos, cedilha, ª/º). Qualquer caractere sem
 * representação na codepage vira "?" (0x3F) em vez de imprimir lixo.
 */

export type Codepage = "cp437" | "cp850" | "cp860" | "cp1252";

const QUESTION_MARK = 0x3f;

// cp850 (DOS Latin-1) — cobre bem os acentos do português.
const CP850: Record<string, number> = {
    "ç": 0x87, "Ç": 0x80,
    "á": 0xa0, "é": 0x82, "í": 0xa1, "ó": 0xa2, "ú": 0xa3,
    "Á": 0xb5, "É": 0x90, "Í": 0xd6, "Ó": 0xe0, "Ú": 0xe9,
    "â": 0x83, "ê": 0x88, "î": 0x8c, "ô": 0x93, "û": 0x96,
    "Â": 0xb6, "Ê": 0xd2, "Î": 0xd7, "Ô": 0xe2, "Û": 0xea,
    "ã": 0xc6, "õ": 0xe4, "ñ": 0xa4,
    "Ã": 0xc7, "Õ": 0xe5, "Ñ": 0xa5,
    "à": 0x85, "è": 0x8a, "ì": 0x8d, "ò": 0x95, "ù": 0x97,
    "À": 0xb7, "È": 0xd4, "Ì": 0xde, "Ò": 0xe3, "Ù": 0xeb,
    "ä": 0x84, "ë": 0x89, "ï": 0x8b, "ö": 0x94, "ü": 0x81,
    "Ä": 0x8e, "Ë": 0xd3, "Ï": 0xd8, "Ö": 0x99, "Ü": 0x9a,
    "ª": 0xa6, "º": 0xa7,
};

// cp860 (DOS Português) — arranjo próprio para o português.
const CP860: Record<string, number> = {
    "ç": 0x87, "Ç": 0x80,
    "á": 0xa0, "é": 0x82, "í": 0xa1, "ó": 0xa2, "ú": 0xa3,
    "Á": 0x86, "É": 0x90, "Í": 0x8b, "Ó": 0x9f, "Ú": 0x96,
    "â": 0x83, "ê": 0x88, "ô": 0x93,
    "Â": 0x8f, "Ê": 0x89, "Ô": 0x8c,
    "ã": 0x84, "õ": 0x94, "ñ": 0xa4,
    "Ã": 0x8e, "Õ": 0x99, "Ñ": 0xa5,
    "à": 0x85, "è": 0x8a, "ì": 0x8d, "ò": 0x95, "ù": 0x97,
    "À": 0x91, "È": 0x92, "Ì": 0x98, "Ò": 0xa9, "Ù": 0x9d,
    "ü": 0x81, "Ü": 0x9a,
    "ª": 0xa6, "º": 0xa7,
};

// cp437 (DOS USA) — não possui ã/õ nem as maiúsculas acentuadas do pt-BR.
const CP437: Record<string, number> = {
    "ç": 0x87, "Ç": 0x80,
    "á": 0xa0, "é": 0x82, "í": 0xa1, "ó": 0xa2, "ú": 0xa3,
    "â": 0x83, "ê": 0x88, "î": 0x8c, "ô": 0x93, "û": 0x96,
    "à": 0x85, "è": 0x8a, "ì": 0x8d, "ò": 0x95, "ù": 0x97,
    "ä": 0x84, "ë": 0x89, "ï": 0x8b, "ö": 0x94, "ü": 0x81,
    "É": 0x90, "Ä": 0x8e, "Ö": 0x99, "Ü": 0x9a, "ñ": 0xa4, "Ñ": 0xa5,
    "ª": 0xa6, "º": 0xa7,
};

// cp1252 (Windows-1252): 0xA0–0xFF é idêntico ao Latin-1, então acentos
// mapeiam pelo próprio code point. Só o bloco 0x80–0x9F precisa de tabela.
const CP1252_PUNCT: Record<string, number> = {
    "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85,
    "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89, "Š": 0x8a,
    "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91, "’": 0x92,
    "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
    "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c,
    "ž": 0x9e, "Ÿ": 0x9f,
};

const MAPS: Record<Exclude<Codepage, "cp1252">, Record<string, number>> = {
    cp437: CP437,
    cp850: CP850,
    cp860: CP860,
};

function encodeChar(ch: string, cp: Codepage): number {
    const code = ch.charCodeAt(0);
    if (code < 0x80) return code;

    if (cp === "cp1252") {
        if (code >= 0xa0 && code <= 0xff) return code;
        return CP1252_PUNCT[ch] ?? QUESTION_MARK;
    }

    return MAPS[cp][ch] ?? QUESTION_MARK;
}

/**
 * Codifica uma string para a codepage informada, retornando os bytes.
 * Normaliza para NFC antes (para casar acentos que venham decompostos).
 */
export function encodeText(text: string, cp: Codepage): number[] {
    const normalized = text.normalize("NFC");
    const out: number[] = [];
    for (const ch of normalized) {
        out.push(encodeChar(ch, cp));
    }
    return out;
}

/** Normaliza um valor de codepage arbitrário para um dos suportados. */
export function toCodepage(value: string): Codepage {
    return value === "cp437" || value === "cp860" || value === "cp1252" ? value : "cp850";
}
