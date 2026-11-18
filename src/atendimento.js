// Lógica do atendimento: início, conversa com o Gemini e encerramento.
// É independente do canal — usada tanto pelo WhatsApp quanto pelo simulador de terminal.
import { config } from './config.js';
import { criarConversa, responder, resumirAtendimento } from './gemini.js';
import { carregarBaseConhecimento, registrarMensagem, registrarAtendimento } from './sheets.js';

const COMANDOS_ENCERRAR = ['encerrar', 'sair', 'finalizar', '#fim'];

/** Atendimentos em andamento, por telefone. */
const sessoes = new Map();

function gerarProtocolo() {
  const d = new Date();
  const data = d.toISOString().slice(0, 10).replace(/-/g, '');
  return `${data}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function temSessao(telefone) {
  return sessoes.has(telefone);
}

async function iniciar(telefone, nome, enviar) {
  const base = await carregarBaseConhecimento();
  const sessao = {
    protocolo: gerarProtocolo(),
    telefone,
    nome,
    inicio: new Date(),
    conversa: criarConversa(base, nome),
    historico: [],
    timer: null,
    enviar,
  };
  sessoes.set(telefone, sessao);
  console.log(`🟢 Atendimento ${sessao.protocolo} iniciado com ${nome || telefone}`);
  return sessao;
}

async function falar(sessao, autor, texto) {
  sessao.historico.push({ autor, texto });
  await registrarMensagem({ protocolo: sessao.protocolo, telefone: sessao.telefone, autor, texto });
}

function reiniciarTimeout(sessao) {
  clearTimeout(sessao.timer);
  sessao.timer = setTimeout(async () => {
    await sessao.enviar('⏰ Como não recebi mais mensagens, vou encerrar este atendimento. Se precisar, é só chamar de novo!');
    await encerrar(sessao.telefone, 'Inatividade');
  }, config.timeoutMinutos * 60 * 1000);
}

export async function encerrar(telefone, motivo) {
  const sessao = sessoes.get(telefone);
  if (!sessao) return;
  sessoes.delete(telefone);
  clearTimeout(sessao.timer);

  const { resumo, assunto } = await resumirAtendimento(sessao.historico);
  const fim = new Date();
  await registrarAtendimento({
    protocolo: sessao.protocolo,
    telefone: sessao.telefone,
    nome: sessao.nome || '',
    inicio: sessao.inicio.toISOString(),
    fim: fim.toISOString(),
    duracaoMin: Math.round((fim - sessao.inicio) / 60000),
    totalMensagens: sessao.historico.length,
    motivo,
    assunto,
    resumo,
  });
  console.log(`🔴 Atendimento ${sessao.protocolo} encerrado (${motivo}). Resumo: ${resumo}`);
}

/**
 * Processa uma mensagem recebida.
 * @param {object} p
 * @param {string} p.telefone  identificador do cliente
 * @param {string} p.nome      nome do cliente (opcional)
 * @param {string} p.texto     texto recebido
 * @param {(t: string) => Promise<any>} p.enviar  função que envia a resposta ao cliente
 * @param {boolean} [p.exigirPalavraInicio=true]
 * @returns {Promise<boolean>} true se a mensagem foi tratada pelo bot
 */
export async function processarMensagem({ telefone, nome, texto, enviar, exigirPalavraInicio = true }) {
  texto = (texto || '').trim();
  if (!texto) return false;

  let sessao = sessoes.get(telefone);

  // Sem atendimento aberto: só começa com a palavra de início
  if (!sessao) {
    if (exigirPalavraInicio && texto.toLowerCase() !== config.palavraInicio) return false;
    sessao = await iniciar(telefone, nome, enviar);
    if (texto.toLowerCase() === config.palavraInicio) texto = 'Olá!';
  }
  sessao.enviar = enviar;

  // Cliente pediu para encerrar explicitamente
  if (COMANDOS_ENCERRAR.includes(texto.toLowerCase())) {
    await falar(sessao, 'Cliente', texto);
    const msg = `✅ Atendimento encerrado. Protocolo: *${sessao.protocolo}*.\nObrigada pelo contato com a ${config.nomeEmpresa}! 💙`;
    await falar(sessao, 'Bot', msg);
    await enviar(msg);
    await encerrar(telefone, 'Cliente encerrou');
    return true;
  }

  await falar(sessao, 'Cliente', texto);

  let resposta;
  try {
    resposta = await responder(sessao.conversa, texto);
  } catch (err) {
    console.error('Erro no Gemini:', err.message);
    const msg = '😕 Tive um probleminha técnico agora. Pode tentar de novo em alguns segundos?';
    await enviar(msg);
    reiniciarTimeout(sessao);
    return true;
  }

  let msg = resposta.texto;
  if (resposta.encerrar) msg += `\n\n📄 Protocolo do atendimento: *${sessao.protocolo}*`;

  await falar(sessao, 'Bot', msg);
  await enviar(msg);

  if (resposta.encerrar) await encerrar(telefone, 'Resolvido pelo bot');
  else reiniciarTimeout(sessao);

  return true;
}
