// Cliente da Uazapi: envio de mensagens, configuração do webhook e leitura dos eventos recebidos.
import { config } from './config.js';

async function chamar(metodo, caminho, corpo) {
  const resp = await fetch(`${config.uazapiUrl}${caminho}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', token: config.uazapiToken },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await resp.text();
  if (!resp.ok) throw new Error(`Uazapi ${metodo} ${caminho} → HTTP ${resp.status}: ${texto}`);
  try { return JSON.parse(texto); } catch { return texto; }
}

/**
 * Envia texto. O "delay" (ms) faz a Uazapi mostrar "digitando..." antes de enviar.
 */
export function enviarTexto(numero, texto) {
  const delay = Math.min(4000, 800 + texto.length * 20);
  return chamar('POST', '/send/text', { number: numero, text: texto, delay });
}

/** Aponta o webhook da instância para a URL pública do bot. */
export function configurarWebhook(url) {
  return chamar('POST', '/webhook', {
    url,
    enabled: true,
    events: ['messages'],
    // não reenviar ao bot as mensagens que ele mesmo mandou pela API
    excludeMessages: ['wasSentByApi'],
  });
}

export function verWebhook() {
  return chamar('GET', '/webhook');
}

const soNumeros = (v) => String(v || '').split('@')[0].split(':')[0].replace(/\D/g, '');

/**
 * Transforma o corpo do webhook em { id, telefone, nome, texto } — ou null se deve ser ignorado
 * (mensagem própria, grupo, mídia sem texto, outro tipo de evento...).
 */
export function lerEventoMensagem(corpo) {
  const evento = corpo?.EventType || corpo?.event || corpo?.type;
  if (evento && !String(evento).toLowerCase().startsWith('message')) return null;

  const m = corpo?.message || corpo?.data?.message || corpo?.data || corpo;
  if (!m || typeof m !== 'object') return null;

  if (m.fromMe || m.wasSentByApi) return null;
  const chatId = String(m.chatid || m.chatId || m.from || m.key?.remoteJid || '');
  if (m.isGroup || chatId.endsWith('@g.us') || chatId.includes('status@broadcast')) return null;

  const texto =
    m.text ||
    (typeof m.content === 'string' ? m.content : m.content?.text) ||
    m.body ||
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    '';
  if (!String(texto).trim()) return null;

  const telefone = soNumeros(chatId || m.sender);
  if (!telefone || telefone === config.botNumero) return null;

  return {
    id: m.messageid || m.messageId || m.id || m.key?.id || null,
    telefone,
    nome: m.senderName || m.pushName || corpo?.chat?.name || '',
    texto: String(texto),
  };
}
