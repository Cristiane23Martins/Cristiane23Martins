# 🤖 Bot de Atendimento — WhatsApp + Gemini + Google Sheets

Bot de **atendimento simulado** no WhatsApp para testar a inteligência do **Gemini (API gratuita)**.
O atendimento começa, conversa e termina **sem transferir para humano**. A planilha Google serve como
base de conhecimento (produtos, FAQ, pedidos) e como registro das conversas.

```
Cliente (WhatsApp) ──► whatsapp-web.js ──► atendimento.js ──► Gemini
                                              │
                                              └──► Planilha Google (Apps Script)
                                                    • lê: Produtos, FAQ, Pedidos
                                                    • grava: Mensagens, Atendimentos
```

## Estrutura

| Arquivo | Função |
|---|---|
| `src/index.js` | Conecta no WhatsApp (QR Code) e repassa as mensagens |
| `src/simulador.js` | Conversa pelo terminal — testa o Gemini **sem** WhatsApp |
| `src/atendimento.js` | Início, conversa, encerramento, protocolo e timeout |
| `src/gemini.js` | Prompt da atendente "Lia", chat com memória e resumo final |
| `src/sheets.js` | Lê/grava a planilha (ou usa dados de exemplo + `./logs` se não configurada) |
| `apps-script/Code.gs` | Código para colar no Apps Script da planilha |

## Passo a passo

### 1. Pré-requisitos
- [Node.js 18+](https://nodejs.org)
- Chave gratuita do Gemini: https://aistudio.google.com/apikey

### 2. Instalar
```bash
npm install
cp .env.example .env     # no Windows: copy .env.example .env
```
Abra o `.env` e cole sua `GEMINI_API_KEY`.

### 3. Testar só a IA (sem WhatsApp) — recomendado começar por aqui
```bash
npm run simular
```
Exemplos para testar: *"Oi, quero saber do meu pedido 1001"*, *"Vocês têm tênis?"*,
*"Como faço uma troca?"*, *"Era só isso, obrigado!"* (o Gemini encerra sozinho e gera o protocolo).

### 4. (Opcional) Conectar a planilha Google
1. Crie uma planilha nova no Google Sheets.
2. Menu **Extensões > Apps Script**, apague o conteúdo e cole o arquivo `apps-script/Code.gs`.
3. No editor, selecione a função **`criarAbas`** e clique em **Executar** (autorize o acesso).
   Isso cria as abas com dados de exemplo — edite-as à vontade.
4. **Implantar > Nova implantação > App da Web** — Executar como: *Eu*; Quem pode acessar: *Qualquer pessoa*.
5. Copie a URL gerada para `SHEETS_WEBAPP_URL` no `.env`.

> Sem a planilha, o bot usa os dados de exemplo de `src/sheets.js` e grava os logs em `./logs`.

### 5. Rodar no WhatsApp
```bash
npm start
```
1. Escaneie o QR Code em **WhatsApp > Aparelhos conectados > Conectar um aparelho**.
2. De **outro celular**, envie `#teste` para o número conectado → o atendimento começa.
3. Converse normalmente. Para encerrar: diga que não precisa de mais nada ou envie `encerrar`.

## Como o atendimento funciona

- **Início:** só quando o cliente envia a palavra `PALAVRA_INICIO` (padrão `#teste`) — assim o bot
  não responde seus contatos pessoais. Você também pode restringir com `NUMEROS_PERMITIDOS`.
- **Conversa:** o Gemini mantém o histórico e responde usando apenas os dados da planilha.
- **Encerramento** (qualquer um destes):
  - o cliente diz que acabou → o Gemini se despede e encerra;
  - o cliente envia `encerrar`, `sair` ou `finalizar`;
  - `TIMEOUT_MINUTOS` sem mensagens.
- **Ao encerrar:** gera protocolo, pede ao Gemini um resumo + assunto e grava na aba `Atendimentos`.

## Avisos
- `whatsapp-web.js` é uma biblioteca **não oficial**. Para testes, use de preferência um número secundário.
- A cota gratuita do Gemini tem limite de requisições por minuto; se estourar, o bot avisa o cliente.
- Para personalizar a atendente, edite o texto em `montarInstrucoes()` em `src/gemini.js`.
