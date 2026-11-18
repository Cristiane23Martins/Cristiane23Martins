// Bot de WhatsApp (via whatsapp-web.js — conecta lendo o QR Code, como o WhatsApp Web).
import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { config } from './config.js';
import { processarMensagem } from './atendimento.js';

const { Client, LocalAuth } = pkg;

const client = new Client({
  authStrategy: new LocalAuth(), // salva a sessão em .wwebjs_auth (não precisa ler o QR toda vez)
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
});

client.on('qr', (qr) => {
  console.log('📱 Escaneie o QR Code abaixo no WhatsApp > Aparelhos conectados:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log(`✅ Bot conectado! Envie "${config.palavraInicio}" de outro número para iniciar um atendimento.`);
  if (config.numerosPermitidos.length) console.log('   Atendendo apenas:', config.numerosPermitidos.join(', '));
});

client.on('auth_failure', (m) => console.error('Falha na autenticação:', m));
client.on('disconnected', (r) => console.warn('Desconectado:', r));

client.on('message', async (msg) => {
  try {
    // Ignora grupos, status e mensagens que não são texto
    if (msg.from.endsWith('@g.us') || msg.from === 'status@broadcast' || msg.type !== 'chat') return;

    const contato = await msg.getContact();
    const telefone = contato.number || msg.from.split('@')[0];

    if (config.numerosPermitidos.length && !config.numerosPermitidos.includes(telefone)) return;

    const chat = await msg.getChat();
    await processarMensagem({
      telefone,
      nome: contato.pushname || contato.name || '',
      texto: msg.body,
      enviar: async (texto) => {
        await chat.sendStateTyping(); // mostra "digitando..."
        await new Promise((r) => setTimeout(r, Math.min(3000, 500 + texto.length * 15)));
        return client.sendMessage(msg.from, texto);
      },
    });
  } catch (err) {
    console.error('Erro ao processar mensagem:', err);
  }
});

client.initialize();
