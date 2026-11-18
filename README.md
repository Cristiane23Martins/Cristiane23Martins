# 🤖 Bot de Atendimento — WhatsApp (Uazapi) + Gemini

Bot de **atendimento simulado** no WhatsApp para testar a inteligência do **Gemini (API gratuita)**.
O atendimento começa, conversa e termina **sem transferir para humano**.

```
Cliente ──WhatsApp──► Uazapi ──webhook──► este bot (servidor.js) ──► Gemini
                         ▲                         │
                         └──── POST /send/text ◄───┘
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
| `src/armazenamento.js` | Lê `dados/base.json` e grava registros em `logs/` |
| `dados/base.json` | Produtos, FAQ e pedidos fictícios — edite à vontade |

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

### 2. Testar só a IA (sem WhatsApp)
```bash
npm run simular
```

### 3. Subir o bot
```bash
npm start
```

### 4. Deixar o bot acessível pela internet
A Uazapi precisa conseguir chamar o seu computador. Para testes, use um túnel gratuito
em **outro terminal**:
```bash
npx cloudflared tunnel --url http://localhost:3000
# ou: ngrok http 3000
```
Ele mostra uma URL do tipo `https://algo.trycloudflare.com`.

### 5. Configurar o webhook na Uazapi
```bash
npm run webhook -- https://algo.trycloudflare.com/webhook
```
(Ou no painel da Uazapi: webhook da instância → URL acima, evento **messages**, excluir mensagens
**enviadas pela API**.) Rode `npm run webhook` sem URL para ver a configuração atual.

> A URL do túnel muda sempre que você o reinicia — repita o passo 5 quando isso acontecer.

### 6. Testar
De **outro celular**, envie `#teste` para o número do bot e converse.

## Como o atendimento funciona

- **Início:** quando o cliente envia `PALAVRA_INICIO` (padrão `#teste`). Deixe vazio no `.env`
  para qualquer mensagem iniciar. `NUMEROS_PERMITIDOS` limita quem o bot atende.
- **Conversa:** o Gemini mantém o histórico e responde só com os dados de `dados/base.json`.
  A Uazapi mostra "digitando..." antes de cada resposta.
- **Encerramento:** o cliente diz que acabou (o Gemini encerra sozinho), envia `encerrar`/`sair`,
  ou fica `TIMEOUT_MINUTOS` sem responder.
- **Ao encerrar:** envia protocolo e grava resumo + assunto em `logs/atendimentos.jsonl`
  (todas as mensagens ficam em `logs/mensagens.jsonl`).

## Se o bot não responder
- Rode com `DEBUG_WEBHOOK=1 npm start` para ver no terminal o JSON exato que a Uazapi está enviando.
- Confira se o túnel está no ar abrindo a URL no navegador (deve mostrar "Bot de atendimento no ar").
- Mensagens de grupo, de mídia sem texto e do próprio bot são ignoradas de propósito.
