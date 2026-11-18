// Simulador de atendimento no terminal — testa o Gemini sem precisar do WhatsApp.
import readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import { config } from './config.js';
import { processarMensagem, temSessao } from './atendimento.js';

const TELEFONE = '5500000000000';
const rl = readline.createInterface({ input: stdin, output: stdout });

console.log(`\n💬 Simulador de atendimento — ${config.nomeEmpresa} (modelo ${config.geminiModel})`);
console.log('   Digite suas mensagens como se fosse o cliente.');
console.log('   "encerrar" finaliza o atendimento | "/sair" fecha o simulador.\n');

const enviar = async (texto) => console.log(`\n🤖 Lia: ${texto}\n`);

const perguntar = () => stdout.write('👤 Você: ');
perguntar();

for await (const linha of rl) {
  const texto = linha.trim();
  if (texto === '/sair') break;

  if (texto) {
    await processarMensagem({ telefone: TELEFONE, nome: 'Cliente Teste', texto, enviar, exigirPalavraInicio: false });
    if (!temSessao(TELEFONE)) console.log('— Atendimento finalizado. Envie outra mensagem para abrir um novo. —\n');
  }
  perguntar();
}

rl.close();
process.exit(0);
