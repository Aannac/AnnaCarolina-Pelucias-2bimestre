// Recupera o valor total do carrinho do localStorage e exibe na página
let valorTotal = parseFloat(localStorage.getItem('valorTotal') || '0'); //se não existir valor usa 0
document.getElementById('valor').textContent = valorTotal.toFixed(2).replace('.', ','); //troca . por , (estilo brasileiro)

// Função para calcular o valor total com ou sem desconto aplicado
function calcularValores() {
  const valorTotal = parseFloat(localStorage.getItem('valorTotal') || '0');
  return valorTotal;
}

// Função para gerar QR Code Pix
function pagarPIX() {
  const valor = calcularValores().toFixed(2); // Obtém o valor total do carrinho formatado com 2 casas decimais
  const chavePix = 'cf227dbe-75ae-497d-927f-a292d805bfda'; // Chave Pix do recebedor
  const nomeRecebedor = 'ANNA'; // Nome do recebedor
  const cidade = 'CAMPO MOURAO'; // Cidade do recebedor
  const descricao = 'Pagamento Plushies'; // Descrição da transação

  // Função auxiliar para formatar campos do payload Pix
  function formatField(id, value) {
    const length = value.length.toString().padStart(2, '0'); // Comprimento em 2 dígitos
    return id + length + value; // Concatena campo ID, tamanho e valor
  }

  // Constrói o payload Pix sem o CRC ainda
  let payloadSemCRC =
    formatField("00", "01") +
    formatField("26",
      formatField("00", "BR.GOV.BCB.PIX") +
      formatField("01", chavePix) +
      formatField("02", descricao)
    ) +
    formatField("52", "0000") + // Código de categoria (sem categoria)
    formatField("53", "986") + // Código da moeda (BRL)
    formatField("54", valor) + // Valor da transação
    formatField("58", "BR") + // País
    formatField("59", nomeRecebedor) + // Nome do recebedor
    formatField("60", cidade) + // Cidade do recebedor
    formatField("62", formatField("05", "***")) + // Identificador adicional (***)
    "6304"; // Início do campo de CRC

  // Função para gerar o código CRC16 do payload Pix
  function crc16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
      crc ^= str.charCodeAt(c) << 8;
      for (let i = 0; i < 8; i++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0'); // Retorna em hexadecimal com 4 dígitos
  }

  const crc = crc16(payloadSemCRC); // Calcula o CRC
  const payloadFinal = payloadSemCRC + crc; // Adiciona CRC ao payload

  const qrCodeDiv = document.getElementById('qrcode');
  qrCodeDiv.innerHTML = ''; // Limpa conteúdo anterior do QR code
  document.getElementById('qrcode-area').style.display = 'block'; // Mostra a área do QR code

  // Gera o QR code usando a biblioteca QRCode.js
  new QRCode(qrCodeDiv, {
    text: payloadFinal, // Texto do QR Code (payload Pix)
    width: 250,
    height: 250,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  // Cria e adiciona um elemento com informações do pagamento abaixo do QR code
  const info = document.createElement('div');
  info.className = 'nome-valor';
  info.innerHTML = `
    <p><strong>Nome:</strong> ${nomeRecebedor}</p>
    <p><strong>CPF (PIX):</strong> ${chavePix}</p>
    <p><strong>Valor:</strong> R$ ${valor}</p>
  `;
  qrCodeDiv.appendChild(info);
}
//o CRC é um campo obrigatório no final do payload (a "mensagem codificada") e serve para garantir que o conteúdo do QR Code não foi alterado ou corrompido.

document.addEventListener("DOMContentLoaded", function() {
  const usuarioLogado = localStorage.getItem("usuarioLogado");
  const gerarQrCodeBtn = document.getElementById("gerarQrCodeBtn");

  if (usuarioLogado) {
    gerarQrCodeBtn.disabled = false;
  } else {
    alert("Você precisa estar logado para finalizar a compra.");
    window.location.href = "../login/login.html";
  }
});

