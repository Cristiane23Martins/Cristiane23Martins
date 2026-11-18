/**
 * Google Apps Script — cole este código em: Planilha > Extensões > Apps Script.
 * Depois: Implantar > Nova implantação > Tipo "App da Web"
 *   - Executar como: Eu
 *   - Quem pode acessar: Qualquer pessoa
 * Copie a URL gerada para SHEETS_WEBAPP_URL no arquivo .env do bot.
 *
 * Abas usadas (se faltar alguma, rode a função criarAbas uma vez):
 *   Produtos     -> codigo | nome | preco | estoque
 *   FAQ          -> pergunta | resposta
 *   Pedidos      -> numero | cliente | status | previsao
 *   Mensagens    -> data | protocolo | telefone | autor | texto   (log, gravado pelo bot)
 *   Atendimentos -> protocolo | telefone | nome | inicio | fim | duracaoMin | totalMensagens | motivo | assunto | resumo
 */

const CABECALHOS = {
  Produtos: ['codigo', 'nome', 'preco', 'estoque'],
  FAQ: ['pergunta', 'resposta'],
  Pedidos: ['numero', 'cliente', 'status', 'previsao'],
  Mensagens: ['data', 'protocolo', 'telefone', 'autor', 'texto'],
  Atendimentos: ['protocolo', 'telefone', 'nome', 'inicio', 'fim', 'duracaoMin', 'totalMensagens', 'motivo', 'assunto', 'resumo'],
};

/** Rode UMA vez pelo editor para criar as abas com dados de exemplo. */
function criarAbas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const exemplos = {
    Produtos: [
      ['P001', 'Camiseta Básica', 'R$ 49,90', 35],
      ['P002', 'Calça Jeans', 'R$ 149,90', 12],
      ['P003', 'Tênis Casual', 'R$ 229,90', 0],
    ],
    FAQ: [
      ['Qual o horário de funcionamento?', 'Segunda a sexta, 9h às 18h; sábado, 9h às 13h.'],
      ['Qual o prazo de entrega?', 'De 3 a 7 dias úteis para capitais e até 12 dias úteis para o interior.'],
      ['Como faço uma troca?', 'Trocas em até 30 dias após o recebimento, com etiqueta e nota fiscal.'],
      ['Quais as formas de pagamento?', 'Pix (5% de desconto), cartão em até 6x sem juros e boleto.'],
    ],
    Pedidos: [
      ['1001', 'Maria', 'Em transporte', '22/11'],
      ['1002', 'João', 'Entregue', '-'],
      ['1003', 'Ana', 'Aguardando pagamento', '-'],
    ],
  };

  Object.keys(CABECALHOS).forEach(function (nome) {
    let aba = ss.getSheetByName(nome);
    if (!aba) aba = ss.insertSheet(nome);
    if (aba.getLastRow() === 0) {
      aba.appendRow(CABECALHOS[nome]);
      aba.getRange(1, 1, 1, CABECALHOS[nome].length).setFontWeight('bold');
      (exemplos[nome] || []).forEach(function (linha) { aba.appendRow(linha); });
    }
  });
}

/** Lê uma aba como lista de objetos { cabecalho: valor }. */
function lerAba(nome) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nome);
  if (!aba || aba.getLastRow() < 2) return [];
  const valores = aba.getDataRange().getDisplayValues();
  const cab = valores.shift();
  return valores.map(function (linha) {
    const obj = {};
    cab.forEach(function (c, i) { obj[c] = linha[i]; });
    return obj;
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** GET ?acao=base -> devolve Produtos, FAQ e Pedidos para o bot usar como contexto. */
function doGet(e) {
  return json({
    produtos: lerAba('Produtos'),
    faq: lerAba('FAQ'),
    pedidos: lerAba('Pedidos'),
  });
}

/** POST -> grava mensagens e atendimentos. */
function doPost(e) {
  const dados = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (dados.acao === 'mensagem') {
    ss.getSheetByName('Mensagens').appendRow(
      CABECALHOS.Mensagens.map(function (c) { return dados[c] || ''; })
    );
  } else if (dados.acao === 'atendimento') {
    ss.getSheetByName('Atendimentos').appendRow(
      CABECALHOS.Atendimentos.map(function (c) { return dados[c] !== undefined ? dados[c] : ''; })
    );
  }
  return json({ ok: true });
}
