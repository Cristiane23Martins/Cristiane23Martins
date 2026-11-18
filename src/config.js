import 'dotenv/config';

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  sheetsUrl: process.env.SHEETS_WEBAPP_URL || '',
  nomeEmpresa: process.env.NOME_EMPRESA || 'Loja Exemplo',
  palavraInicio: (process.env.PALAVRA_INICIO || '#teste').trim().toLowerCase(),
  numerosPermitidos: (process.env.NUMEROS_PERMITIDOS || '')
    .split(',')
    .map((n) => n.replace(/\D/g, ''))
    .filter(Boolean),
  timeoutMinutos: Number(process.env.TIMEOUT_MINUTOS || 10),
};

if (!config.geminiApiKey || config.geminiApiKey === 'cole_sua_chave_aqui') {
  console.error('❌ Defina GEMINI_API_KEY no arquivo .env (pegue em https://aistudio.google.com/apikey)');
  process.exit(1);
}
