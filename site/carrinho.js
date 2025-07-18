// NO SEU script.js ATUAL, SUBSTITUA A FUNÇÃO DE FINALIZAR PEDIDO
function finalizarPedido(event) {
    event.preventDefault(); // Previne o comportamento padrão do link

    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    // 1. Salva o carrinho atual no localStorage para a próxima página usar
    localStorage.setItem('carrinhoParaCheckout', JSON.stringify(carrinho));

    // 2. Redireciona o usuário para a nova página do carrinho
    window.location.href = 'carrinho.html';
}

// Garanta que o seu ícone flutuante chame essa função
const carrinhoFlutuante = document.getElementById('carrinho-flutuante');
if (carrinhoFlutuante) {
    carrinhoFlutuante.addEventListener('click', finalizarPedido);
}

// Se você ainda tiver o botão de finalizar na barra lateral, adicione o evento a ele também
const botaoFinalizarCompra = document.getElementById('finalizar-compra');
if (botaoFinalizarCompra) {
    botaoFinalizarCompra.addEventListener('click', finalizarPedido);
}