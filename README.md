# 🤖 Bot de Atendimento — WhatsApp (Uazapi) + Gemini + Google Sheets

Bot de **atendimento simulado** no WhatsApp para testar a inteligência do **Gemini (API gratuita)**.
O atendimento começa, conversa e termina **sem transferir para humano**.

```
Cliente ──WhatsApp──► Uazapi ──webhook──► este bot (servidor.js) ──► Gemini
                         ▲                         │
                         └──── POST /send/text ◄───┤
                                                   ▼
                              Planilha Google (Apps Script)
                              • lê: Produtos, FAQ, Pedidos
                              • grava: Mensagens, Atendimentos
```

## Estrutura

| Arquivo | Função |
|---|---|
| `src/servidor.js` | Recebe o webhook da Uazapi e responde pelo WhatsApp |
| `src/uazapi.js` | Envia mensagens, configura o webhook e lê os eventos da Uazapi |
| `src/configurar-webhook.js` | Comando para apontar o webhook da instância para o bot |
| `src/simulador.js` | Conversa pelo terminal — testa o Gemini **sem** WhatsApp |
| `src/atendimento.js` | Início, conversa, encerramento, protocolo e timeout |
| `src/gemini.js` | Prompt da atendente "Lia", chat com memória e resumo final |
| `src/armazenamento.js` | Lê e grava na planilha (ou em `dados/base.json` e `logs/` sem planilha) |
| `apps-script/Code.gs` | Código para colar no Apps Script da planilha |
| `dados/base.json` | Dados de reserva, usados só quando a planilha não está configurada |

## Passo a passo

### 1. Instalar
Precisa de [Node.js 18+](https://nodejs.org).
```bash
npm install
cp .env.example .env     # no Windows: copy .env.example .env
```
Preencha no `.env`:
- `GEMINI_API_KEY` — chave gratuita em https://aistudio.google.com/apikey
- `UAZAPI_URL` — endereço do seu servidor Uazapi (ex.: `https://suaempresa.uazapi.com`)
- `UAZAPI_TOKEN` — token da **instância** conectada ao número do bot
- `BOT_NUMERO` — número do bot com 55 + DDD (ex.: `5527999999999`)

### 2. Ligar a planilha
A planilha **Bot Atendimento WhatsApp - Gemini** já está no seu Google Drive com as abas
`Produtos`, `FAQ`, `Pedidos`, `Mensagens` e `Atendimentos`.
1. Abra a planilha e vá em **Extensões > Apps Script**.
2. Apague o que estiver lá, cole todo o conteúdo de `apps-script/Code.gs` e salve (Ctrl+S).
3. Clique em **Implantar > Nova implantação**, na engrenagem escolha **App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. Clique em **Implantar** e autorize (se aparecer "app não verificado": *Avançado > Acessar*).
5. Copie a **URL do app da Web** (termina em `/exec`) para `SHEETS_WEBAPP_URL` no `.env`.

> Para mudar produtos, FAQ ou pedidos, edite a planilha — o bot pega as mudanças em até 1 minuto.
> Se alterar o código do Apps Script, faça **Implantar > Gerenciar implantações > editar > Nova versão**.

### 3. Testar só a IA (sem WhatsApp)
```bash
npm run simular
```

### 4. Subir o bot
```bash
npm start
```

### 5. Deixar o bot acessível pela internet
A Uazapi precisa conseguir chamar o seu computador. Para testes, use um túnel gratuito
em **outro terminal**:
```bash
npx cloudflared tunnel --url http://localhost:3000
# ou: ngrok http 3000
```
Ele mostra uma URL do tipo `https://algo.trycloudflare.com`.

### 6. Configurar o webhook na Uazapi
```bash
npm run webhook -- https://algo.trycloudflare.com/webhook
```
(Ou no painel da Uazapi: webhook da instância → URL acima, evento **messages**, excluir mensagens
**enviadas pela API**.) Rode `npm run webhook` sem URL para ver a configuração atual.

> A URL do túnel muda sempre que você o reinicia — repita o passo 6 quando isso acontecer.

### 7. Testar
De **outro celular**, envie `#teste` para o número do bot e converse.

## Como o atendimento funciona

- **Início:** quando o cliente envia `PALAVRA_INICIO` (padrão `#teste`). Deixe vazio no `.env`
  para qualquer mensagem iniciar. `NUMEROS_PERMITIDOS` limita quem o bot atende.
- **Conversa:** o Gemini mantém o histórico e responde só com os dados da planilha.
  A Uazapi mostra "digitando..." antes de cada resposta.
- **Encerramento:** o cliente diz que acabou (o Gemini encerra sozinho), envia `encerrar`/`sair`,
  ou fica `TIMEOUT_MINUTOS` sem responder.
- **Ao encerrar:** envia protocolo e grava resumo + assunto na aba `Atendimentos`
  (todas as mensagens ficam na aba `Mensagens`).

## Se o bot não responder
- Rode com `DEBUG_WEBHOOK=1 npm start` para ver no terminal o JSON exato que a Uazapi está enviando.
- Confira se o túnel está no ar abrindo a URL no navegador (deve mostrar "Bot de atendimento no ar").
- Mensagens de grupo, de mídia sem texto e do próprio bot são ignoradas de propósito.
