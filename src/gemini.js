// Comunicação com a API do Gemini.
import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

// Marcador que o Gemini coloca no fim da resposta quando decide encerrar o atendimento.
export const MARCADOR_FIM = '[FIM_ATENDIMENTO]';

function montarInstrucoes(base, nomeCliente) {
  return `
Você é a "Lia", atendente virtual da empresa ${config.nomeEmpresa}, conversando pelo WhatsApp.

REGRAS:
- Responda sempre em português do Brasil, de forma cordial, objetiva e humana.
- Mensagens curtas (no máximo 3 parágrafos curtos), adequadas ao WhatsApp. Pode usar *negrito* do WhatsApp e emojis com moderação.
- Use SOMENTE as informações da BASE DE DADOS abaixo. Se não souber algo, diga que não tem essa informação — nunca invente preços, prazos ou status.
- Para consultar um pedido, peça o número do pedido.
- Este é um atendimento de teste: NUNCA transfira para um atendente humano. Resolva você mesma.
- Quando o cliente indicar que não precisa de mais nada (ex.: "só isso", "obrigado, tchau", "pode encerrar"),
  despeça-se de forma simpática e termine sua resposta exatamente com ${MARCADOR_FIM}
- Não use ${MARCADOR_FIM} em nenhuma outra situação.
${nomeCliente ? `- O nome do cliente no WhatsApp é "${nomeCliente}".` : ''}

BASE DE DADOS (planilha da empresa):
${JSON.stringify(base, null, 2)}
`.trim();
}

/** Cria uma conversa (chat com memória) para um atendimento. */
export function criarConversa(base, nomeCliente) {
  return ai.chats.create({
    model: config.geminiModel,
    config: {
      systemInstruction: montarInstrucoes(base, nomeCliente),
      temperature: 0.6,
    },
  });
}

/** Envia a mensagem do cliente e devolve { texto, encerrar }. */
export async function responder(conversa, mensagem) {
  const resp = await conversa.sendMessage({ message: mensagem });
  let texto = (resp.text || '').trim();
  const encerrar = texto.includes(MARCADOR_FIM);
  texto = texto.replace(MARCADOR_FIM, '').trim();
  return { texto: texto || 'Desculpe, não entendi. Pode repetir?', encerrar };
}

/** Pede ao Gemini um resumo do atendimento para gravar no registro. */
export async function resumirAtendimento(historico) {
  const transcricao = historico.map((m) => `${m.autor}: ${m.texto}`).join('\n');
  try {
    const resp = await ai.models.generateContent({
      model: config.geminiModel,
      contents:
        'Resuma este atendimento em no máximo 2 frases e classifique o assunto em UMA palavra ' +
        '(Pedido, Produto, Troca, Pagamento, Dúvida, Outro). Responda em JSON: {"resumo": "...", "assunto": "..."}\n\n' +
        transcricao,
      config: { responseMimeType: 'application/json' },
    });
    return JSON.parse(resp.text);
  } catch {
    return { resumo: '(não foi possível gerar resumo)', assunto: 'Outro' };
  }
}
