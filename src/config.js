import 'dotenv/config';

const soNumeros = (v) => (v || '').replace(/\D/g, '');

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

  uazapiUrl: (process.env.UAZAPI_URL || '').replace(/\/+$/, ''),
  uazapiToken: process.env.UAZAPI_TOKEN || '',
  sheetsUrl: (process.env.SHEETS_WEBAPP_URL || '').trim(),
  botNumero: soNumeros(process.env.BOT_NUMERO),
  porta: Number(process.env.PORTA || 3000),

  nomeEmpresa: process.env.NOME_EMPRESA || 'Loja Exemplo',
  palavraInicio: (process.env.PALAVRA_INICIO ?? '#teste').trim().toLowerCase(),
  numerosPermitidos: (process.env.NUMEROS_PERMITIDOS || '').split(',').map(soNumeros).filter(Boolean),
  timeoutMinutos: Number(process.env.TIMEOUT_MINUTOS || 10),
};

if (!config.geminiApiKey || config.geminiApiKey === 'cole_sua_chave_aqui') {
  console.error('❌ Defina GEMINI_API_KEY no arquivo .env (pegue em https://aistudio.google.com/apikey)');
  process.exit(1);
}

/** Chamado pelos scripts que falam com a Uazapi (o simulador não precisa). */
export function exigirUazapi() {
  if (!config.uazapiUrl || config.uazapiUrl.includes('SEU-SUBDOMINIO') || !config.uazapiToken) {
    console.error('❌ Defina UAZAPI_URL e UAZAPI_TOKEN no arquivo .env');
    process.exit(1);
  }
}
