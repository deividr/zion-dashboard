# Design: Migração da impressão de pedidos para Web Serial API

- **Data:** 2026-06-20
- **Status:** Aprovado para implementação
- **Autor:** Deivid Rodrigues (+ Claude)
- **Escopo:** Substituir o QZ Tray pela Web Serial API na impressão de cupons/tickets na Daruma.

## 1. Contexto e problema

A impressão de pedidos na impressora térmica Daruma (LaBuonapasta) é **instável** — às vezes imprime, às vezes não — e **pede autorização do QZ Tray em toda impressão**. O objetivo é resolver os dois problemas de raiz.

### Estado atual

A impressão é feita via **QZ Tray** desde o commit inicial da feature (`b9e9477`, 20/mar/2026):

- `src/hooks/usePrintTicket.ts` — conecta ao QZ Tray via WebSocket (`qz.websocket.connect()`), configura certificado (`setCertificatePromise` lendo `/certificate.pem`) e assinatura (`setSignaturePromise` → `POST /api/sign-print`), lista impressoras (`qz.printers.find()`) e imprime (`qz.print()`).
- `src/app/api/sign-print/route.ts` — assina cada requisição com `PRINT_PRIVATE_KEY` (SHA512).
- `src/lib/esc-pos.ts` — `EscPosEncoder` + `createReceipt()` geram os comandos ESC/POS do cupom.
- `src/stores/printer-store.ts` — Zustand com `persist`, guarda só `config` no localStorage (`skipHydration: true`).
- `public/certificate.pem` — certificado público servido ao QZ.

### Diagnóstico (por que falha)

1. **Diálogo recorrente:** servir o `certificate.pem` e assinar **não basta** para eliminar o prompt do QZ — o certificado também precisa estar instalado na pasta de confiança do QZ Tray (`override.crt`) em cada máquina. O commit `e532fe2` tentou "eliminar o diálogo" só com assinatura e não resolveu. O histórico mostra uma briga contínua com o QZ (`e532fe2`, `6afb69a`, `f3b9785`, `4737959`, `ce2e878`, `a5997dd`), todos sobre certificado, conexão e persistência.
2. **Instabilidade:** o `connect()` só roda no `useEffect` da página `settings/printer` e usa `initialized.current`, então em outras telas o `isConnected` pode estar `false` e a impressão falha silenciosamente. Além disso, o QZ adiciona muitas peças móveis (bridge Java, WebSocket que cai, reconexão, assinatura por requisição).

> **Verificação de histórico:** confirmado via pickaxe em todo o histórico (`--all`) que **nunca houve** implementação Web Serial neste repositório (`navigator.serial`, `requestPort`, `getPorts`, `WebUSB`, `usb` → zero ocorrências; nenhuma branch/stash/reflog). A feature sempre foi QZ Tray. Qualquer memória de "já tentamos serial" foi experimento local não-commitado ou confusão com a frustração do QZ.

### Ambiente (confirmado com o usuário)

- Daruma conectada via **USB**, aparece como **porta COM** (serial virtual) no Gerenciador de Dispositivos do Windows.
- PC da loja usa **Chrome/Edge no Windows** (Chromium → suporta Web Serial/WebUSB).
- App servido em **HTTPS** (Fly.io) → secure context disponível.

Esse cenário (USB + COM + Chromium + HTTPS) permite falar **direto** com a impressora pelo navegador, eliminando o QZ por completo.

## 2. Decisão

**Caminho A — migrar para a Web Serial API**, com **prova de conceito (PoC) primeiro**.

O Chrome/Edge fala direto com a porta COM da Daruma via `navigator.serial`. Removemos QZ Tray, certificado, `/api/sign-print` e a dependência `qz-tray`, reaproveitando o `esc-pos.ts`. O diálogo do QZ desaparece: o navegador pede autorização **uma única vez** (clique → seletor de portas) e depois reconecta sozinho e em silêncio via `getPorts()`. A instabilidade some junto com o bridge Java.

A execução é em **duas fases** para reduzir risco: validar na Daruma real antes de remover o QZ.

### Alternativas consideradas (rejeitadas)

- **Caminho B — consertar o QZ "de vez"** (instalar cert na pasta de confiança em cada PC + corrigir ciclo de conexão). Trata sintomas, mantém todas as peças móveis (Java, WebSocket, cert por máquina, licença QZ para uso comercial).
- **Caminho C — agente local próprio ou PrintNode (SaaS).** Overkill: o Web Serial resolve sem custo nem app extra. Fica como plano B teórico se a COM virtual da Daruma se provar problemática.

## 3. Arquitetura da solução

```
Navegador (Chrome/Edge, HTTPS)
  └─ usePrintTicket (hook)
       ├─ esc-pos.ts        → createReceipt() → string ESC/POS → toBytesLatin1() → Uint8Array
       └─ web-serial.ts     → getGrantedPort / authorizePrinter / printToPort
            └─ navigator.serial → porta COM → Daruma USB
```

Sem servidor no caminho de impressão. Sem WebSocket persistente. **Modelo open-per-print**: abrir porta → escrever → fechar, a cada impressão (mais robusto que manter handle aberto; evita porta travada após sleep do USB).

## 4. Fase 1 — Prova de Conceito (aditiva, QZ intacto)

**Objetivo:** validar na Daruma real que o Web Serial imprime de forma estável, **sem tocar em nada do QZ**.

### Arquivos

1. **`src/lib/web-serial.ts`** (novo, isolado, funções puras):
   - `isWebSerialSupported(): boolean` — `"serial" in navigator` + `window.isSecureContext`.
   - `requestPrinterPort(): Promise<SerialPort>` — `navigator.serial.requestPort()` (exige gesto do usuário). Retorna a porta escolhida.
   - `printToPort(port, bytes, { baudRate }): Promise<void>` — `port.open({ baudRate })`, obtém `writer = port.writable.getWriter()`, `writer.write(bytes)`, e em `finally` libera o lock (`writer.releaseLock()`) e `port.close()`. Nunca deixa a porta travada.

2. **`src/lib/esc-pos.ts`** — adicionar `toBytesLatin1(str): Uint8Array` que mapeia `str.charCodeAt(i) & 0xFF` para cada byte. **Crítico:** o `toBytes()` atual usa `TextEncoder` (UTF-8), que corromperia bytes > 0x7F (acentos cp850 e comandos como `\xFA`). O latin1 reproduz exatamente como o QZ trata a string crua hoje, então o cupom sai idêntico.

3. **`src/app/settings/printer/page.tsx`** — no card "Teste de Impressão" já existente, adicionar um segundo botão **"Imprimir teste via Web Serial (beta)"**. No clique: `requestPrinterPort()` → seletor do navegador (uma vez) → `printToPort()` com o mesmo ESC/POS de teste atual (`handleTestPrint`). Toast de sucesso/erro + mostra a porta escolhida. Botão desabilitado se `!isWebSerialSupported()`.

4. **`package.json`** — adicionar `@types/w3c-web-serial` como devDependency (tipagem oficial do W3C; evita `@ts-expect-error`).

### Não muda na Fase 1

`usePrintTicket.ts`, `printer-store.ts`, `/api/sign-print`, `certificate.pem`, dependência `qz-tray`, `print-order-button.tsx`. Todo o QZ permanece funcional.

### Critério de sucesso da PoC

Imprimir o teste **5–10× seguidas** na Daruma real, sem diálogo recorrente e sem falha intermitente. Se o cupom sair errado/incompleto, ajustar baud rate (testar 9600 → 19200 → 115200) e flow control. Se passar → libera Fase 2. Se não → QZ continua intacto, abortamos sem prejuízo.

## 5. Fase 2 — Migração completa + remoção do QZ (só se a PoC passar)

### Núcleo

1. **`src/lib/web-serial.ts`** ganha persistência:
   - `getGrantedPort({ usbVendorId, usbProductId }): Promise<SerialPort | null>` — `navigator.serial.getPorts()` (**silencioso, sem diálogo**) e casa com o VID/PID salvos (ou usa a única porta concedida, se houver só uma). É o que dá o reconectar-sozinho-pra-sempre.
   - `authorizePrinter(): Promise<{ port, usbVendorId, usbProductId }>` — `requestPort()` (gesto único) + `port.getInfo()` para extrair VID/PID a persistir.

2. **`src/hooks/usePrintTicket.ts`** reescrito (mantém o nome do hook para minimizar churn nos consumidores):
   - Remove tudo do QZ (interface `QZTray`, import `qz-tray`, `connect/disconnect/refreshPrinters`, certificado, assinatura).
   - Entram `authorizePrinter()` e `checkAuthorization()` (chama `getGrantedPort` no mount e em eventos `connect`/`disconnect` de `navigator.serial`, atualiza `isAuthorized`).
   - `printTicket(data)` / `printRaw(commands)`: montam ESC/POS (igual hoje, `createReceipt`) → `toBytesLatin1()` → `printToPort()` (open → write → close), repetindo `config.copies` vezes.
   - Surface retornada: `{ authorizePrinter, checkAuthorization, printTicket, printRaw, isPrinting }`.

3. **`src/stores/printer-store.ts`**:
   - Em `PrinterConfig`: trocar `name: string` por `usbVendorId?: number`, `usbProductId?: number`, `label?: string`; adicionar `baudRate: number` (default 9600). Manter `paperWidth`, `copies`, `cutPaper`, `openDrawer`, `codepage`.
   - Em `PrinterState`: remover `printers: string[]`; `isConnected` → `isAuthorized` (+ `setAuthorized`). Remover `setPrinters`.
   - Manter `persist` com `partialize` no `config` e `skipHydration: true`.

### UI

4. **`src/components/printer/printer-connector.tsx`**: "Conectar/Desconectar" → botão **"Autorizar impressora"** (chama `authorizePrinter`) + status **"Autorizada / Não autorizada"** (de `isAuthorized`). Remover o refresh vindo do QZ.

5. **`src/app/settings/printer/page.tsx`**:
   - Remover o `<Select>` de impressoras (Web Serial não enumera nomes — a escolha é pelo diálogo do navegador). Substituir por botão "Autorizar impressora" + label do dispositivo autorizado + seletor de **baud rate** (9600/19200/38400/115200).
   - Remover o card "Instalação do QZ Tray"; substituir por nota curta de Web Serial ("Use Chrome ou Edge; autorize a impressora uma vez — não precisa instalar nada").
   - Renomear o botão de teste Web Serial "beta" da Fase 1 para "Imprimir teste" (deixa de ser beta — é o fluxo padrão agora).

6. **`src/components/printer/print-order-button.tsx`**: trocar a checagem de `isConnected` por `isAuthorized`; se não autorizada, toast orientando a autorizar em Configurações. Resto do fluxo igual.

### Remoção do QZ (lista exata, verificada no código)

- Deletar `src/app/api/sign-print/route.ts` (único lugar que usa `PRINT_PRIVATE_KEY`).
- Deletar `public/certificate.pem` (único `fetch` estava em `usePrintTicket.ts:67`).
- `pnpm remove qz-tray` (importado só em `src/hooks/usePrintTicket.ts`).
- Remover `pem` do regex do matcher em `src/middleware.ts:18` (foi adicionado pelo `6afb69a` só por causa do cert).
- Remover `PRINT_PRIVATE_KEY` dos secrets do Fly.io e do `.env.local` (não está versionado nem em `env.ts`; remoção manual de infra).
- Dockerfile: nada a reverter — o `certificate.pem` era copiado junto com `public/` no standalone; basta o arquivo não existir mais.

### Borda

- Dois dispositivos com mesmo VID/PID → usa o primeiro de `getPorts()`. Aceitável (1 loja / 1 impressora).
- `requestPort()` sem filtro inicialmente (o usuário escolhe a Daruma; aprendemos VID/PID depois para o `getGrantedPort`).

## 6. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| COM virtual da Daruma exige baud/flow control específico | PoC valida antes de remover QZ; baud configurável (9600→115200). |
| Encoding de acentos (cp850) quebra com UTF-8 | `toBytesLatin1()` (`charCodeAt & 0xFF`) reproduz o comportamento atual do QZ. |
| Usuário limpa dados do site / troca de perfil/navegador → perde autorização | Re-autoriza com um clique; estado `isAuthorized` deixa isso explícito na UI. |
| Web Serial indisponível (navegador errado/HTTP) | `isWebSerialSupported()` desabilita os botões com mensagem clara. |
| Porta travada após erro | `printToPort` libera lock e fecha a porta em `finally`. |

## 7. Critérios de sucesso

- **Fase 1:** teste imprime estável 5–10× na Daruma real, sem diálogo recorrente.
- **Fase 2:** impressão de pedido real ponta a ponta funciona; **nenhum** diálogo após a primeira autorização; `pnpm build` e `pnpm lint` limpos; QZ Tray (deps, rota, cert, env) totalmente removido.

## 8. Fora de escopo (YAGNI)

- Suporte a Firefox/Safari (sem Web Serial) — vocês usam Chromium.
- Suporte a impressora de rede/Bluetooth — é USB/COM.
- Múltiplas impressoras simultâneas / multi-loja com seleção avançada.
- Fila de impressão offline / retry persistente.
