// Servidor que recebe o webhook da Uazapi e responde pelo WhatsApp.
import http from 'node:http';
import { config, exigirUazapi } from './config.js';
import { enviarTexto, lerEventoMensagem } from './uazapi.js';
import { processarMensagem } from './atendimento.js';

exigirUazapi();

// Evita responder duas vezes se a Uazapi reenviar o mesmo evento
const idsProcessados = new Set();
// Processa as mensagens de cada cliente em ordem (uma de cada vez)
const filas = new Map();

function enfileirar(telefone, tarefa) {
  const anterior = filas.get(telefone) || Promise.resolve();
  const atual = anterior.then(tarefa).catch((err) => console.error('Erro no atendimento:', err));
  filas.set(telefone, atual);
  atual.finally(() => filas.get(telefone) === atual && filas.delete(telefone));
}

async function tratarWebhook(corpo) {
  // Se o evento trouxer o token da instância, confere se é o nosso
  if (corpo?.token && corpo.token !== config.uazapiToken) return;

  const msg = lerEventoMensagem(corpo);
  if (!msg) return;

  if (msg.id) {
    if (idsProcessados.has(msg.id)) return;
    idsProcessados.add(msg.id);
    if (idsProcessados.size > 5000) idsProcessados.delete(idsProcessados.values().next().value);
  }

  if (config.numerosPermitidos.length && !config.numerosPermitidos.includes(msg.telefone)) return;

  console.log(`📩 ${msg.nome || msg.telefone}: ${msg.texto}`);
  enfileirar(msg.telefone, () =>
    processarMensagem({
      telefone: msg.telefone,
      nome: msg.nome,
      texto: msg.texto,
      enviar: (texto) => enviarTexto(msg.telefone, texto),
      exigirPalavraInicio: Boolean(config.palavraInicio),
    })
  );
}

const servidor = http.createServer((req, res) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('🤖 Bot de atendimento no ar.');
  }
  if (req.method !== 'POST') {
    res.writeHead(405);
    return res.end();
  }

  let dados = '';
  req.on('data', (parte) => {
    dados += parte;
    if (dados.length > 1e6) req.destroy();
  });
  req.on('end', () => {
    // Responde 200 na hora; o Gemini é chamado depois, sem segurar a Uazapi
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
    let corpo;
    try { corpo = JSON.parse(dados); } catch { return; }
    if (process.env.DEBUG_WEBHOOK) console.log('Webhook recebido:', JSON.stringify(corpo));
    tratarWebhook(corpo).catch((err) => console.error('Erro no webhook:', err));
  });
});

servidor.listen(config.porta, () => {
  console.log(`✅ Bot ouvindo na porta ${config.porta} (POST em qualquer caminho, ex.: /webhook)`);
  console.log(
    config.palavraInicio
      ? `   Envie "${config.palavraInicio}" para o número do bot para iniciar um atendimento.`
      : '   Qualquer mensagem recebida inicia um atendimento.'
  );
  if (config.numerosPermitidos.length) console.log('   Atendendo apenas:', config.numerosPermitidos.join(', '));
});
