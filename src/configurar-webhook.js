// Uso: npm run webhook -- https://sua-url-publica/webhook
import { exigirUazapi } from './config.js';
import { configurarWebhook, verWebhook } from './uazapi.js';

exigirUazapi();

const url = process.argv[2];
try {
  if (url) {
    console.log('Configurando webhook para:', url);
    console.log(JSON.stringify(await configurarWebhook(url), null, 2));
  } else {
    console.log('Webhook atual da instância:');
    console.log(JSON.stringify(await verWebhook(), null, 2));
    console.log('\nPara alterar: npm run webhook -- https://sua-url-publica/webhook');
  }
} catch (err) {
  console.error('❌', err.message);
  console.error('   Se preferir, configure o webhook direto no painel da Uazapi (evento "messages").');
  process.exit(1);
}
