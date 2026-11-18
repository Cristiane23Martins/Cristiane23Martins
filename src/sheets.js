// Integração com a planilha Google (via Web App do Google Apps Script).
// Se SHEETS_WEBAPP_URL não estiver configurada, usa dados de exemplo e grava logs locais.
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const DADOS_EXEMPLO = {
  produtos: [
    { codigo: 'P001', nome: 'Camiseta Básica', preco: 'R$ 49,90', estoque: '35' },
    { codigo: 'P002', nome: 'Calça Jeans', preco: 'R$ 149,90', estoque: '12' },
    { codigo: 'P003', nome: 'Tênis Casual', preco: 'R$ 229,90', estoque: '0' },
  ],
  faq: [
    { pergunta: 'Qual o horário de funcionamento?', resposta: 'Segunda a sexta, 9h às 18h; sábado, 9h às 13h.' },
    { pergunta: 'Qual o prazo de entrega?', resposta: 'De 3 a 7 dias úteis para capitais e até 12 dias úteis para o interior.' },
    { pergunta: 'Como faço uma troca?', resposta: 'Trocas em até 30 dias após o recebimento, com etiqueta e nota fiscal.' },
    { pergunta: 'Quais as formas de pagamento?', resposta: 'Pix (5% de desconto), cartão em até 6x sem juros e boleto.' },
  ],
  pedidos: [
    { numero: '1001', cliente: 'Maria', status: 'Em transporte', previsao: '22/11' },
    { numero: '1002', cliente: 'João', status: 'Entregue', previsao: '-' },
    { numero: '1003', cliente: 'Ana', status: 'Aguardando pagamento', previsao: '-' },
  ],
};

let cache = null;

/** Lê as abas Produtos, FAQ e Pedidos da planilha (com cache de 5 minutos). */
export async function carregarBaseConhecimento() {
  if (cache && Date.now() - cache.em < 5 * 60 * 1000) return cache.dados;

  let dados = DADOS_EXEMPLO;
  if (config.sheetsUrl) {
    try {
      const resp = await fetch(`${config.sheetsUrl}?acao=base`);
      dados = await resp.json();
    } catch (err) {
      console.warn('⚠️  Não consegui ler a planilha, usando dados de exemplo:', err.message);
    }
  }
  cache = { em: Date.now(), dados };
  return dados;
}

async function enviar(acao, payload) {
  if (!config.sheetsUrl) {
    // Modo local: grava em ./logs/<acao>.jsonl
    fs.mkdirSync('logs', { recursive: true });
    fs.appendFileSync(path.join('logs', `${acao}.jsonl`), JSON.stringify(payload) + '\n');
    return;
  }
  try {
    await fetch(config.sheetsUrl, {
      method: 'POST',
      // text/plain evita o "preflight" e funciona melhor com o Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ acao, ...payload }),
    });
  } catch (err) {
    console.warn(`⚠️  Falha ao gravar "${acao}" na planilha:`, err.message);
  }
}

/** Grava cada mensagem trocada na aba "Mensagens". */
export function registrarMensagem({ protocolo, telefone, autor, texto }) {
  return enviar('mensagem', { protocolo, telefone, autor, texto, data: new Date().toISOString() });
}

/** Grava o resumo do atendimento finalizado na aba "Atendimentos". */
export function registrarAtendimento(dados) {
  return enviar('atendimento', dados);
}
