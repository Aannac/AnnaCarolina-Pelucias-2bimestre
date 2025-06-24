function revelarCupom() {
  const camada = document.getElementById('camada-cinza');
  const cupom = document.getElementById('cupom');

  camada.style.opacity = 0; //Alteração de opacidade: A opacidade da camada é definida como 0, o que a torna invisível. Essa ação faz com que a camada "cinza" desapareça ao ser "raspada" (clicada)
  setTimeout(() => { //atrasa a execução
    camada.style.display = 'none'; //a camada camada-cinza é completamente removida da tela, tornando o cupom visivel
    cupom.style.display = 'block';

    // Armazena o cupom apenas quando for raspado
    localStorage.setItem('cupomDesconto', 'DESCONTO10');
    alert('Cupom revelado: DESCONTO10');
  }, 500); //0,5s
}

function voltarParaLoja() {
  window.location.href = '../Index.html'; // Voltar à página principal após revelar o cupom
}