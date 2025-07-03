let products = [];
let cart = []; // Adicionando a variável cart que estava faltando
let userFavorites = []; // Array para armazenar IDs dos produtos favoritos do usuário

async function fetchProducts() {
  const res = await fetch('/api/products');
  products = await res.json();
  await loadUserFavorites(); // Carregar favoritos do usuário
  renderProducts(products);
}

// Função para carregar favoritos do usuário
async function loadUserFavorites() {
  const userLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (userLogado && userLogado.email) {
    try {
      const res = await fetch(`/api/favorites/${userLogado.email}`);
      const data = await res.json();
      userFavorites = data.favorites || [];
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      userFavorites = [];
    }
  }
}

document.addEventListener("DOMContentLoaded", fetchProducts);

function renderProducts(products) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";
  products.forEach(p => {
    const isFavorite = userFavorites.includes(p.id);
    const starClass = isFavorite ? 'star-filled' : 'star-empty';
    const starIcon = isFavorite ? '★' : '☆';
    
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-header">
        <h3>${p.name}</h3>
        <button class="favorite-btn ${starClass}" onclick="toggleFavorite(${p.id})" title="Adicionar aos favoritos">
          ${starIcon}
        </button>
      </div>
      <p>Preço: R$ ${p.price.toFixed(2)}</p>
      <img src="/imagem/${p.image}" width="150">
      <button onclick="addToCart(${p.id})">Adicionar ao Carrinho</button>
    `;
    container.appendChild(card);
  });
}

//Busca o produto pelo id, adiciona ao array cart, atualiza o contador e o conteúdo do carrinho.
function searchProducts() {
const searchTerm = document.getElementById('searchInput').value.toLowerCase(); //Captura o texto digitado e converte para minúsculo
const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchTerm)); //Filtra os produtos que contêm o texto digitado no nome (armazenados no searchTerm)
renderProducts(filteredProducts); // Renderiza apenas os produtos que combinam com a busca
}

function addToCart(id) {
const product = products.find(p => p.id === id); //Procura o produto com o ID fornecido
if (product) {
  cart.push(product); //Adiciona o produto no cart
  document.getElementById('cart-count').innerText = cart.length; //Atualiza o número de itens no carrinho.
  updateCart();
  
  // Feedback visual para o usuário
  const button = event.target;
  const originalText = button.innerText;
  button.innerText = "Adicionado!";
  button.style.backgroundColor = "#4CAF50";
  
  setTimeout(() => {
    button.innerText = originalText;
    button.style.backgroundColor = "";
  }, 1000);
}
}

function updateCart() {
const cartItems = document.getElementById('cart-items');
cartItems.innerHTML = '';
let total = 0;   //Limpa a lista atual e inicia o total com 0

cart.forEach((item, index) => { //nsere cada item do carrinho no HTML
  cartItems.innerHTML += 
    `<div class="cart-item">
      <p>${item.name} - R$ ${item.price.toFixed(2)}</p>
      <button onclick="removeFromCart(${index})">Remover</button>
    </div>`
  ;
  total += item.price; //Soma o preço do produto atual ao total da compra
});

document.getElementById('cart-total').innerText = total.toFixed(2); //Exibe o total formatado com 2 casas decimais
}

function removeFromCart(index) { //Remove um item específico do carrinho com base no seu índice (posição), atualiza o contador de itens e reexibe o carrinho com os produtos atualizados
cart.splice(index, 1); //splice() é um método que remove elementos do cart, index indica a posição do item a ser removido e o 1 é a quantidade
document.getElementById('cart-count').innerText = cart.length; //atualiza com a nova quantidae de itens no carrinho
updateCart();
}

function openCart() {
document.getElementById('cartModal').style.display = 'flex'; //Altera seu estilo CSS para display: flex, o que torna o modal visível na tela
updateCart();
}

function closeCart() {
document.getElementById('cartModal').style.display = 'none'; //Define o display como "none", o que faz com que o modal desapareça da tela
}

function openCheckout() {
// Verificar se o usuário está logado antes de abrir o checkout
const usuarioLogado = localStorage.getItem("usuarioLogado");
if (!usuarioLogado) {
  alert("Você precisa estar logado para finalizar a compra.");
  window.location.href = "./login/login.html";
  return;
}

document.getElementById("checkoutModal").style.display = "flex"; //seleciona a janela de "dados", tornando visivel e centralizada
document.getElementById("cartModal").style.display = "none"; // faz com que desapareça

const cupom = localStorage.getItem("cupomDesconto"); //ve no armazenamento local se a pessoa revelou o cupom
const cupomSection = document.getElementById("cupom-section"); //é a div que contém o botão "Aplicar Cupom"
const botaoCupom = document.getElementById("btn-aplicar-cupom"); //é o botão que o usuário clica para aplicar o cupom no total da compra

if (cupom === "DESCONTO10") { //Se o valor obtido do localStorage for exatamente "DESCONTO10", então o usuário tem um cupom ativo
  cupomSection.style.display = "block"; //Torna a seção do cupom visível e habilita o botão para aplicar o cupom
  botaoCupom.disabled = false;
} else {
  cupomSection.style.display = "none"; //esconde a area do cupom
  botaoCupom.disabled = true; //Desativa o botão "Aplicar Cupom"
}
}

// Raspadinha do cupom
function rasparCupom() {
localStorage.setItem('cupomDesconto', 'DESCONTO10'); //salva o cupom no armazenamento local
alert("Você raspou o cupom! Agora pode aplicá-lo.");

const botaoCupom = document.getElementById('btn-aplicar-cupom'); //busca no HTML o botão "Aplicar Cupom" que aparece no checkout
if (botaoCupom) { //Verifica se o botão realmente existe na tela.
  botaoCupom.disabled = false; //Se sim, ativa o botão definindo disabled = false, o que permite que ele seja clicado
}
}

function revelarCupom() {
const camada = document.getElementById('camada-cinza'); //fundo "cinza" que cobre o cupom
const cupom = document.getElementById('cupom');

camada.style.opacity = 0; //Torna o fundo cinza completamente transparente, criando a impressão de que ele desapareceu gradualmente
setTimeout(() => { //atrasa a execução do código dentro da tela
  camada.style.display = 'none'; //Remove a camada cinza da tela (agora invisível e não ocupando mais espaço)
  cupom.style.display = 'block';//Exibe o elemento do cupom de desconto

  localStorage.setItem('cupomDesconto', 'DESCONTO10');
  alert('Cupom revelado: DESCONTO10');

  const botaoCupom = document.getElementById('btn-aplicar-cupom');
  if (botaoCupom) {
    botaoCupom.disabled = false;
  }
}, 500); //atraso de 500 milissegundos (ou 0,5 segundos)
}


function aplicarCupom() {
const cupom = localStorage.getItem('cupomDesconto'); //pega o valor no armazenamento local

if (!cupom) { //Se não existir cupom no localStorage, o código avisa o usuário e interrompe a execução da função com return
  alert('Você precisa raspar o cartão para obter um cupom!');
  return;
}

const totalElement = document.getElementById('cart-total'); //Busca o elemento HTML que mostra o valor total e converte esse valor de texto para número decimal com parseFloat
const totalOriginal = parseFloat(totalElement.innerText);

const desconto = cupom === 'DESCONTO10' ? 10 : 0;//se o cupom foi igual a DESCONTO10 será de 10%, se não for vai ser 0%

if (desconto > 0) { //se o cupom for válido
  const totalComDesconto = totalOriginal * ((100 - desconto) / 100);//faz uma multiplicação por 0.90 que é a mesma coisa que 10%
  totalElement.innerText = totalComDesconto.toFixed(2);//Atualiza o valor no HTML com o novo total, formatado com 2 casas decimais
  alert(`Cupom aplicado: ${cupom} (-${desconto}%)`);
} else {
  alert('Cupom inválido.');
}
}

function finalizePurchase() {
// Verificar se o usuário está logado antes de prosseguir
const usuarioLogado = localStorage.getItem("usuarioLogado");
if (!usuarioLogado) {
  alert("Você precisa estar logado para finalizar a compra.");
  window.location.href = "./login/login.html";
  return;
}

const name = document.getElementById("Nome").value.trim(); //Obtém os valores dos campos do formulário e remove espaços extras usando .trim()
const city = document.getElementById("Cidade").value.trim();
const street = document.getElementById("Rua").value.trim();
const number = document.getElementById("Numero").value.trim();
const cep = document.getElementById("CEP").value.trim();
const complement = document.getElementById("Complemento")?.value.trim() || "";//O Complemento é opcional, por isso usa o operador ?. para evitar erro se ele não existir, e || "" para garantir que ele não fique indefinido

if (!name || !city || !street || !number || !cep) { //Verifica se todos os campos obrigatórios foram preenchidos
  alert("Por favor, preencha todos os campos obrigatórios.");
  return;
}

if (isNaN(number) || isNaN(cep)) { //Verifica se são apenas números
  alert("Número e CEP devem conter apenas números.");
  return;
}


const total = parseFloat(document.getElementById('cart-total').innerText);//Obtém o valor total da compra no HTML e converte para número
localStorage.setItem('valorTotal', total.toFixed(2)); //armazena com 2 casas decimais
  alert(`Compra realizada por ${name}! Total: R$ ${total.toFixed(2)}`);
window.location.href = './Pagamento/Pagamento.html'; //vai para a pagina de pagamento
}

document.addEventListener('DOMContentLoaded', () => { //Espera a página HTML terminar de carregar completamente e quando o conteúdo estiver pronto
renderProducts(products); //mostra a interface com os dados

const cupomSection = document.getElementById('cupom-section');
const botaoCupom = document.getElementById('btn-aplicar-cupom');

if (cupomSection) {
  cupomSection.style.display = 'none'; //Esconde a seção do cupom inicialmente
}

if (localStorage.getItem('cupomDesconto') === 'DESCONTO10' && botaoCupom) { //Se o cupom 'DESCONTO10' já estiver salvo no localStorage
  botaoCupom.disabled = false; //Habilita o botão de aplicar cupom
  if (cupomSection) cupomSection.style.display = 'block'; //Mostra a seção de cupom
}
});



// Função para alternar favorito
async function toggleFavorite(productId) {
  const userLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  
  if (!userLogado || !userLogado.email) {
    alert('Você precisa estar logado para adicionar favoritos!');
    return;
  }

  const isFavorite = userFavorites.includes(productId);
  const endpoint = isFavorite ? '/api/favorites/remove' : '/api/favorites/add';
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userLogado.email,
        produto_id: productId
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      // Atualizar array local de favoritos
      if (isFavorite) {
        userFavorites = userFavorites.filter(id => id !== productId);
      } else {
        userFavorites.push(productId);
      }
      
      // Re-renderizar produtos para atualizar as estrelas
      renderProducts(products);
      
      // Feedback visual
      const message = isFavorite ? 'Produto removido dos favoritos!' : 'Produto adicionado aos favoritos!';
      showNotification(message);
    } else {
      console.error('Erro:', data.error || data.message);
    }
  } catch (error) {
    console.error('Erro ao alterar favorito:', error);
    alert('Erro ao processar favorito. Tente novamente.');
  }
}

// Função para mostrar notificação
function showNotification(message) {
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    z-index: 1000;
    font-weight: bold;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(notification);
  
  // Remover após 3 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

