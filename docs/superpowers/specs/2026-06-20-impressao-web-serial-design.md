# Design: Migração da impressão de pedidos para Web Serial API

- **Data:** 2026-06-20
- **Status:** Fase 1 implementada e em produção (`1e211af`). Fase 2 aguarda validação na Daruma real.
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

    > O commit `0ccce03`, posterior a este diagnóstico, já atacou esse item: o `connect()` migrou para o `useEffect` do próprio hook (rodando em todo consumidor) com deduplicação via `connectInFlight` em escopo de módulo. As peças móveis do QZ, porém, continuam todas lá — é por isso que a migração segue de pé.

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
       ├─ esc-pos.ts        → createReceipt() → string hex → hexToBytes() → Uint8Array
       └─ web-serial.ts     → getGrantedPort / authorizePrinter / printToPort
            └─ navigator.serial → porta COM → Daruma USB
```

Sem servidor no caminho de impressão. Sem WebSocket persistente. **Modelo open-per-print**: abrir porta → escrever → fechar, a cada impressão (mais robusto que manter handle aberto; evita porta travada após sleep do USB).

## 4. Fase 1 — Prova de Conceito (aditiva, QZ intacto) — ✅ IMPLEMENTADA

**Objetivo:** validar na Daruma real que o Web Serial imprime de forma estável, **sem tocar em nada do QZ**.

Implementada no commit `1e211af`. O que está escrito abaixo é o que foi construído — divergências em relação ao desenho original estão marcadas e explicadas.

### Arquivos

1. **`src/lib/web-serial.ts`** (novo, isolado, funções puras):
    - `isWebSerialSupported(): boolean` — `"serial" in navigator` + `window.isSecureContext`.
    - `requestPrinterPort(): Promise<SerialPort>` — `navigator.serial.requestPort()` (exige gesto do usuário). Retorna a porta escolhida.
    - `getGrantedPort(): Promise<SerialPort | null>` — **antecipado da Fase 2.** `navigator.serial.getPorts()` (silencioso) e usa a única porta concedida, se houver exatamente uma. Sem casar VID/PID ainda — isso fica para a Fase 2.
    - `ensurePrinterPort(): Promise<SerialPort>` — `getGrantedPort()` e, só se falhar, `requestPrinterPort()`.
    - `printToPort(port, bytes, { baudRate }): Promise<void>` — `port.open({ baudRate })`, obtém `writer = port.writable.getWriter()`, `writer.write(bytes)`, `writer.close()` (aguarda o stream drenar — fechar a porta direto após o `write()` pode truncar o cupom, porque `write()` resolve quando o dado vai para o SO, não quando chega na impressora), e em `finally` libera o lock e fecha a porta. Nunca deixa a porta travada. As chamadas são **serializadas** numa fila de módulo: uma porta só aceita um `open()` por vez, então cliques repetidos ou várias cópias enfileiram em vez de estourar `InvalidStateError`.
    - `describePort(port)` — rótulo `USB VVVV:PPPP` a partir de `port.getInfo()`, para exibir na UI.
    - `getBaudRate()` / `setBaudRate()` — baud rate da PoC em chave própria de `localStorage` (`web-serial-baud-rate`), para não mexer no `printer-store`, que ainda é do QZ. Migra para o `PrinterConfig` na Fase 2.

    > **Por que `getGrantedPort()` veio da Fase 2:** sem ele, `requestPort()` abriria o seletor de portas a **cada** impressão — e o critério de sucesso da PoC é justamente imprimir 5–10× seguidas _sem diálogo recorrente_. A PoC não teria como passar. A versão da Fase 1 é a mínima que resolve isso.

2. **`src/lib/esc-pos.ts`** — dois conversores para bytes:
    - `hexToBytes(hex): Uint8Array` — converte a saída de `createReceipt()`. **É o caminho do cupom.**
    - `toBytesLatin1(str): Uint8Array` — mapeia `str.charCodeAt(i) & 0xFF` por caractere. Usado só na **string de teste crua** da página de configurações (montada com escapes `\x..`), onde `TextEncoder` emitiria UTF-8 e corromperia tudo acima de 0x7F.

    > **Correção do desenho original:** a spec dizia que bastava `toBytesLatin1()` porque "o `toBytes()` atual usa `TextEncoder` (UTF-8)". Isso deixou de valer no commit `0ccce03` (posterior a esta spec), que removeu o `TextEncoder` e passou a fazer `createReceipt()` devolver **hex** — o QZ recebe o cupom com `flavor: "hex"`. Logo o cupom precisa de `hexToBytes()`, não de latin1. O hex é representação sem perdas dos mesmos bytes, então o cupom sai idêntico pelos dois caminhos (verificado: round-trip `hexToBytes(toHex()) === toBytes()`, acentos cp850 `ãçúÊÔ` → `c6 87 a3 d2 e2`, e `0xFA` da gaveta preservado).

3. **`src/app/settings/printer/page.tsx`** — no card "Teste de Impressão" já existente, um bloco tracejado "Web Serial (beta)" com o botão **"Imprimir teste via Web Serial (beta)"** e um **seletor de baud rate** (9600/19200/38400/115200), para ajustar a conexão durante o teste sem precisar de deploy. No clique: `ensurePrinterPort()` → seletor do navegador (só na primeira vez) → `printToPort()` com o mesmo ESC/POS de teste atual. Toast de sucesso/erro + mostra a porta autorizada. Botão desabilitado com mensagem clara se `!isWebSerialSupported()`.

4. **Botão de teste na página da order** — além das configurações, a PoC precisa imprimir um **pedido real** para conferir o resultado completo (itens, acentos, total, corte). Na tela `src/app/orders/[id]/page.tsx`, ao lado do botão atual "Imprimir Cupom" (QZ, intacto), há o botão **"Imprimir via Web Serial (beta)"** (novo componente `src/components/printer/print-order-button-serial.tsx`) que monta o `OrderTicketData` da order, gera o ESC/POS (`createReceipt`) → `hexToBytes()` → `printToPort()`, repetindo `config.copies` vezes. Para evitar duplicação, o mapeamento `Order → OrderTicketData` (antes dentro do `print-order-button.tsx`) foi extraído para `orderToTicketData()` em `src/lib/order-ticket.ts`, usado pelos dois botões.

5. **`package.json`** — `@types/w3c-web-serial` como devDependency (tipagem oficial do W3C; evita `@ts-expect-error`). Instalado: `1.0.8`.

### Não muda na Fase 1

`usePrintTicket.ts`, `printer-store.ts`, `/api/sign-print`, `certificate.pem`, dependência `qz-tray`, e o botão QZ existente (`print-order-button.tsx`, que só cede o mapeamento para o helper). Todo o QZ permanece funcional — os botões Web Serial são **aditivos e paralelos**.

### Critério de sucesso da PoC

Imprimir, na Daruma real, **5–10× seguidas** sem diálogo recorrente e sem falha intermitente: tanto a página de teste fixa (configurações) quanto **um pedido real** (tela da order), conferindo itens, acentos, total e corte. Se o cupom sair errado/incompleto, ajustar baud rate (testar 9600 → 19200 → 115200) e flow control. Se passar → libera Fase 2. Se não → QZ continua intacto, abortamos sem prejuízo.

**Já verificado** (sem hardware): `pnpm lint` e `pnpm build` limpos; conversão de bytes validada em script pontual — round-trip hex↔bytes sem perda, acentos cp850 corretos, `0xFA` da gaveta preservado, cupom completo íntegro, e a prova de que `TextEncoder` corromperia. Nenhum `Permissions-Policy` no `next.config`, `middleware.ts` ou `fly.toml` que pudesse bloquear `navigator.serial`.

**Pendente:** tudo que exige a Daruma — estabilidade em impressões consecutivas, baud rate correto, e se `writer.close()` basta para não truncar o cupom. Porta ocupada em open/close rápidos entre cópias e flow control também só aparecem no hardware.

## 5. Fase 2 — Migração completa + remoção do QZ (só se a PoC passar)

### Núcleo

1. **`src/lib/web-serial.ts`** ganha persistência:
    - `getGrantedPort({ usbVendorId, usbProductId })` — **já existe desde a Fase 1**, mas sem filtro: hoje só devolve a porta se houver exatamente uma concedida. Falta receber o VID/PID salvos e casar com eles, para funcionar quando houver mais de uma porta autorizada no navegador.
    - `authorizePrinter(): Promise<{ port, usbVendorId, usbProductId }>` — `requestPort()` (gesto único) + `port.getInfo()` para extrair VID/PID a persistir. `describePort()` da Fase 1 já lê o `getInfo()`, é só reaproveitar.
    - Mover o baud rate da chave própria de `localStorage` (`web-serial-baud-rate`, da Fase 1) para o `PrinterConfig`, e remover `getBaudRate`/`setBaudRate`.

2. **`src/hooks/usePrintTicket.ts`** reescrito (mantém o nome do hook para minimizar churn nos consumidores):
    - Remove tudo do QZ (interface `QZTray`, import `qz-tray`, `connect/disconnect/refreshPrinters`, certificado, assinatura).
    - Entram `authorizePrinter()` e `checkAuthorization()` (chama `getGrantedPort` no mount e em eventos `connect`/`disconnect` de `navigator.serial`, atualiza `isAuthorized`).
    - `printTicket(data)`: monta o ESC/POS (igual hoje, `createReceipt`) → `hexToBytes()` → `printToPort()` (open → write → close), repetindo `config.copies` vezes. `printRaw(commands)`, que recebe string crua, usa `toBytesLatin1()`.
    - Surface retornada: `{ authorizePrinter, checkAuthorization, printTicket, printRaw, isPrinting }`.

3. **`src/stores/printer-store.ts`**:
    - Em `PrinterConfig`: trocar `name: string` por `usbVendorId?: number`, `usbProductId?: number`, `label?: string`; adicionar `baudRate: number` (default 9600, herdando o valor que a Fase 1 guardou em `web-serial-baud-rate`). Manter `paperWidth`, `copies`, `cutPaper`, `openDrawer`, `codepage`.
    - Em `PrinterState`: remover `printers: string[]`; `isConnected` → `isAuthorized` (+ `setAuthorized`). Remover `setPrinters`.
    - Manter `persist` com `partialize` no `config` e `skipHydration: true`.

### UI

4. **`src/components/printer/printer-connector.tsx`**: "Conectar/Desconectar" → botão **"Autorizar impressora"** (chama `authorizePrinter`) + status **"Autorizada / Não autorizada"** (de `isAuthorized`). Remover o refresh vindo do QZ.

5. **`src/app/settings/printer/page.tsx`**:
    - Remover o `<Select>` de impressoras (Web Serial não enumera nomes — a escolha é pelo diálogo do navegador). Substituir por botão "Autorizar impressora" + label do dispositivo autorizado. O seletor de **baud rate** já existe desde a Fase 1: mover para o bloco principal e ligar no `PrinterConfig`.
    - Remover o card "Instalação do QZ Tray"; substituir por nota curta de Web Serial ("Use Chrome ou Edge; autorize a impressora uma vez — não precisa instalar nada").
    - Dissolver o bloco tracejado "Web Serial (beta)" da Fase 1: seu botão volta a ser o único "Imprimir Ticket de Teste" do card.

6. **`src/components/printer/print-order-button.tsx`**: com o `usePrintTicket` agora sob Web Serial, vira o **único** botão de impressão da order — trocar a checagem de `isConnected` por `isAuthorized`; se não autorizada, toast orientando a autorizar em Configurações. **Remover o componente temporário `print-order-button-serial.tsx`** da Fase 1 (sua lógica se funde aqui). O helper `orderToTicketData()` permanece. Idem para o botão "beta" das configurações, que volta a ser um único "Imprimir teste".

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

| Risco                                                                       | Mitigação                                                                                                                            |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| COM virtual da Daruma exige baud/flow control específico                    | PoC valida antes de remover QZ; baud configurável (9600→115200).                                                                     |
| Encoding de acentos (cp850) quebra com UTF-8                                | `hexToBytes()` no cupom e `toBytesLatin1()` na string crua de teste; nenhum dos dois passa por `TextEncoder`. Verificado com script. |
| Cupom truncado ao fechar a porta logo após o `write()`                      | `printToPort` chama `writer.close()` antes de `port.close()`, aguardando o stream drenar. Só o hardware confirma se basta.           |
| Cliques repetidos / múltiplas cópias colidem no mesmo `open()`              | Fila de módulo em `printToPort` serializa as impressões.                                                                             |
| Usuário limpa dados do site / troca de perfil/navegador → perde autorização | Re-autoriza com um clique; estado `isAuthorized` deixa isso explícito na UI.                                                         |
| Web Serial indisponível (navegador errado/HTTP)                             | `isWebSerialSupported()` desabilita os botões com mensagem clara.                                                                    |
| Porta travada após erro                                                     | `printToPort` libera lock e fecha a porta em `finally`.                                                                              |

## 7. Critérios de sucesso

- **Fase 1** (código em produção, teste na loja pendente): teste imprime estável 5–10× na Daruma real, sem diálogo recorrente.
- **Fase 2** (não iniciada): impressão de pedido real ponta a ponta funciona; **nenhum** diálogo após a primeira autorização; `pnpm build` e `pnpm lint` limpos; QZ Tray (deps, rota, cert, env) totalmente removido.

## 8. Fora de escopo (YAGNI)

- Suporte a Firefox/Safari (sem Web Serial) — vocês usam Chromium.
- Suporte a impressora de rede/Bluetooth — é USB/COM.
- Múltiplas impressoras simultâneas / multi-loja com seleção avançada.
- Fila de impressão offline / retry persistente.

## 9. Histórico de revisões

| Data       | Mudança                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-20 | Versão original: decisão pelo Caminho A, Fases 1 e 2 desenhadas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-08-08 | Fase 1 implementada (`1e211af`) e em produção. Duas correções ao desenho: (a) `createReceipt()` passou a devolver hex no commit `0ccce03`, posterior a esta spec, então o cupom precisa de `hexToBytes()` e não de `toBytesLatin1()` — que sobrevive apenas para a string crua de teste; (b) `getGrantedPort()` foi antecipado da Fase 2, sem o casamento de VID/PID, porque sem ele o seletor de portas reabriria a cada impressão e o critério de sucesso da PoC seria inalcançável. Somaram-se à Fase 1, não previstos: fila de serialização em `printToPort`, `writer.close()` antes de fechar a porta, `describePort()`, e seletor de baud rate na UI (em `localStorage` próprio, para não tocar o `printer-store`). |
