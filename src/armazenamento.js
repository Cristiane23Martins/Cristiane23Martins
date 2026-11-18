// Base de conhecimento e registros.
// Com SHEETS_WEBAPP_URL: lê/grava na planilha Google (via Apps Script).
// Sem ela: usa dados/base.json e grava em logs/.
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const ARQUIVO_BASE = path.resolve('dados', 'base.json');
let cache = null;

function baseLocal() {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO_BASE, 'utf8'));
  } catch (err) {
    console.warn('⚠️  Não consegui ler dados/base.json:', err.message);
    return {};
  }
}

/** Produtos, FAQ e Pedidos (cache de 1 minuto quando vem da planilha). */
export async function carregarBaseConhecimento() {
  if (!config.sheetsUrl) return baseLocal();
  if (cache && Date.now() - cache.em < 60 * 1000) return cache.dados;
  try {
    const resp = await fetch(`${config.sheetsUrl}?acao=base`);
    const dados = await resp.json();
    cache = { em: Date.now(), dados };
    return dados;
  } catch (err) {
    console.warn('⚠️  Não consegui ler a planilha, usando dados/base.json:', err.message);
    return cache?.dados || baseLocal();
  }
}

async function gravar(acao, dados) {
  if (!config.sheetsUrl) {
    fs.mkdirSync('logs', { recursive: true });
    fs.appendFileSync(path.join('logs', `${acao}.jsonl`), JSON.stringify(dados) + '\n');
    return;
  }
  try {
    await fetch(config.sheetsUrl, {
      method: 'POST',
      // text/plain funciona melhor com o Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ acao, ...dados }),
    });
  } catch (err) {
    console.warn(`⚠️  Falha ao gravar "${acao}" na planilha:`, err.message);
  }
}

/** Cada mensagem trocada → aba "Mensagens" */
export function registrarMensagem({ protocolo, telefone, autor, texto }) {
  return gravar('mensagem', { data: new Date().toISOString(), protocolo, telefone, autor, texto });
}

/** Resumo de cada atendimento finalizado → aba "Atendimentos" */
export function registrarAtendimento(dados) {
  return gravar('atendimento', dados);
}
