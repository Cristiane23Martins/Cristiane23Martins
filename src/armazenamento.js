// Base de conhecimento (dados/base.json) e registros locais (pasta logs/).
import fs from 'node:fs';
import path from 'node:path';

const ARQUIVO_BASE = path.resolve('dados', 'base.json');

/** Lê dados/base.json a cada atendimento — edite o arquivo sem reiniciar o bot. */
export function carregarBaseConhecimento() {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO_BASE, 'utf8'));
  } catch (err) {
    console.warn('⚠️  Não consegui ler dados/base.json:', err.message);
    return {};
  }
}

function gravar(arquivo, dados) {
  fs.mkdirSync('logs', { recursive: true });
  fs.appendFileSync(path.join('logs', arquivo), JSON.stringify(dados) + '\n');
}

/** Cada mensagem trocada → logs/mensagens.jsonl */
export function registrarMensagem({ protocolo, telefone, autor, texto }) {
  gravar('mensagens.jsonl', { data: new Date().toISOString(), protocolo, telefone, autor, texto });
}

/** Resumo de cada atendimento finalizado → logs/atendimentos.jsonl */
export function registrarAtendimento(dados) {
  gravar('atendimentos.jsonl', dados);
}
