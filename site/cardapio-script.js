document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores da UI ---
    const cardapioContainer = document.getElementById('cardapio');
    const navbarList = document.querySelector('#navbar-categorias ul');
    const carrinhoFlutuante = document.getElementById('carrinho-flutuante');
    const contadorCarrinho = document.getElementById('contador-carrinho');

    // --- Estado da Aplicação ---
    let carrinho = [];
    let cardapioGlobal = []; // Armazenará o cardápio vindo da API

    // --- Lógica de Carregamento do Cardápio ---

    async function carregarCardapioDaAPI() {
        // Endpoint que busca apenas os produtos marcados como "Ativos"
        const apiUrl = 'http://127.0.0.1:8000/api/stock/menu-products/?is_active=true';

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Erro ao buscar cardápio: ${response.statusText}`);
            }
            const menuItems = await response.json();
            console.log('Cardápio carregado da API:', menuItems);
            cardapioGlobal = menuItems; // Salva os dados globalmente para uso no carrinho
            return menuItems;
        } catch (error) {
            console.error('Falha ao carregar cardápio da API:', error);
            if (cardapioContainer) {
                cardapioContainer.innerHTML = '<p style="text-align: center; color: red; font-size: 1.2em;">Não foi possível carregar o cardápio. O servidor parece estar offline. Tente novamente mais tarde.</p>';
            }
            return []; // Retorna um array vazio para não quebrar a aplicação
        }
    }

    // --- Lógica de Renderização Dinâmica ---

    function renderizarCardapio(menuItems) {
        // Limpa o conteúdo antigo
        if (cardapioContainer) cardapioContainer.innerHTML = '';
        if (navbarList) navbarList.innerHTML = '';

        if (!menuItems || menuItems.length === 0) {
            if (cardapioContainer) cardapioContainer.innerHTML = "<p style='text-align: center;'>Nenhum item disponível no momento.</p>";
            return;
        }

        // Agrupa os itens por categoria
        const itensPorCategoria = menuItems.reduce((acc, item) => {
            const categoria = item.category_name || 'Sem Categoria';
            if (!acc[categoria]) {
                acc[categoria] = [];
            }
            acc[categoria].push(item);
            return acc;
        }, {});

        // Para cada categoria, cria a seção e o link de navegação
        for (const categoriaNome in itensPorCategoria) {
            const navId = `secao-${categoriaNome.toLowerCase().replace(/\s+/g, '-')}`;

            // 1. Cria o link na barra de navegação
            const navLi = document.createElement('li');
            navLi.innerHTML = `<a href="#${navId}" class="nav-link">${categoriaNome}</a>`;
            if (navbarList) navbarList.appendChild(navLi);

            // 2. Cria a seção da categoria no cardápio
            const secaoDiv = document.createElement('div');
            secaoDiv.className = 'categoria';
            secaoDiv.id = navId;

            const tituloH3 = document.createElement('h3');
            tituloH3.textContent = categoriaNome;
            secaoDiv.appendChild(tituloH3);

            const itensCategoriaDiv = document.createElement('div');
            itensCategoriaDiv.className = 'itens-categoria';

            // 3. Adiciona os itens a essa categoria
            itensPorCategoria[categoriaNome].forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'item-cardapio';
                const estoqueDisponivel = item.stock_item_quantity > 0;
                if (!estoqueDisponivel) {
                    itemDiv.classList.add('esgotado');
                }

                itemDiv.innerHTML = `
                    <img src="${item.image_url || 'https://via.placeholder.com/150'}" alt="${item.name}">
                    <h4>${item.name}</h4>
                    <p class="descricao-item">${item.description || '&nbsp;'}</p>
                    <p class="preco">R$ ${parseFloat(item.sale_price).toFixed(2)}</p>
                    <div class="info-estoque">${estoqueDisponivel ? `Estoque: ${item.stock_item_quantity}` : 'ESGOTADO'}</div>
                    <div class="controle-item">
                        <div class="quantidade-seletor">
                            <button class="qtd-btn diminuir" ${!estoqueDisponivel ? 'disabled' : ''}>-</button>
                            <span class="quantidade-valor">1</span>
                            <button class="qtd-btn aumentar" ${!estoqueDisponivel ? 'disabled' : ''}>+</button>
                        </div>
                        <button class="adicionar-carrinho" data-id="${item.id}" ${!estoqueDisponivel ? 'disabled' : ''}>
                            ${estoqueDisponivel ? 'Adicionar' : 'Esgotado'}
                        </button>
                    </div>
                `;
                itensCategoriaDiv.appendChild(itemDiv);
            });

            secaoDiv.appendChild(itensCategoriaDiv);
            if (cardapioContainer) cardapioContainer.appendChild(secaoDiv);
        }
        
        // Adiciona os listeners de eventos após renderizar tudo
        adicionarListenersAosItens();
    }
    
    // --- Lógica de Eventos e Carrinho ---

    function adicionarListenersAosItens() {
        document.querySelectorAll('.item-cardapio').forEach(itemDiv => {
            const id = itemDiv.querySelector('.adicionar-carrinho').dataset.id;
            const itemDoCardapio = cardapioGlobal.find(p => p.id == id);
            
            const diminuirBtn = itemDiv.querySelector('.diminuir');
            const aumentarBtn = itemDiv.querySelector('.aumentar');
            const quantidadeSpan = itemDiv.querySelector('.quantidade-valor');
            const adicionarBtn = itemDiv.querySelector('.adicionar-carrinho');

            if (diminuirBtn) {
                diminuirBtn.addEventListener('click', () => {
                    let quantidade = parseInt(quantidadeSpan.textContent);
                    if (quantidade > 1) {
                        quantidadeSpan.textContent = quantidade - 1;
                    }
                });
            }

            if (aumentarBtn) {
                aumentarBtn.addEventListener('click', () => {
                    let quantidade = parseInt(quantidadeSpan.textContent);
                    if (itemDoCardapio && quantidade < itemDoCardapio.stock_item_quantity) {
                        quantidadeSpan.textContent = quantidade + 1;
                    }
                });
            }

            if (adicionarBtn) {
                adicionarBtn.addEventListener('click', () => {
                    const quantidadeDesejada = parseInt(quantidadeSpan.textContent);
                    adicionarAoCarrinho(itemDoCardapio, quantidadeDesejada);
                    quantidadeSpan.textContent = '1'; // Reseta a quantidade no cardápio
                });
            }
        });
    }

    function adicionarAoCarrinho(item, quantidade) {
        if (!item || item.stock_item_quantity <= 0) {
            alert('Desculpe, este item está esgotado.');
            return;
        }

        const itemExistente = carrinho.find(cartItem => cartItem.id === item.id);
        const quantidadeAtualNoCarrinho = itemExistente ? itemExistente.quantidade : 0;

        if (quantidadeAtualNoCarrinho + quantidade > item.stock_item_quantity) {
            alert(`Desculpe, não temos estoque suficiente. Você pode adicionar no máximo mais ${item.stock_item_quantity - quantidadeAtualNoCarrinho} unidade(s).`);
            return;
        }

        if (itemExistente) {
            itemExistente.quantidade += quantidade;
        } else {
            carrinho.push({
                id: item.id,
                nome: item.name,
                preco: parseFloat(item.sale_price),
                quantidade: quantidade,
                estoqueMax: item.stock_item_quantity
            });
        }
        renderizarCarrinho();
    }
    
    function renderizarCarrinho() {
        const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
        contadorCarrinho.textContent = totalItens;
        
        if (totalItens > 0) {
            carrinhoFlutuante.classList.remove('carrinho-vazio-flutuante');
        } else {
            carrinhoFlutuante.classList.add('carrinho-vazio-flutuante');
        }
        // Futuramente, esta função também renderizará a lista de itens no modal do carrinho.
    }

    // A função de finalizar compra precisará ser refatorada para enviar o pedido ao backend.
    // Por enquanto, ela permanece como uma simulação.
    function finalizarCompra() {
        if (carrinho.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        // Lógica futura: abrir modal de confirmação e enviar 'carrinho' para um endpoint da API.
        console.log("Finalizando compra com os seguintes itens:", carrinho);
        alert("Função de finalizar compra ainda não integrada ao backend.");
    }
    
    // Listener para o carrinho flutuante
    if (carrinhoFlutuante) {
        carrinhoFlutuante.addEventListener('click', (e) => {
            e.preventDefault();
            // Lógica futura: abrir um modal com o resumo do carrinho
            finalizarCompra(); 
        });
    }


    // --- Inicialização da Aplicação ---
    
    async function iniciarAplicacao() {
        const menuItems = await carregarCardapioDaAPI();
        renderizarCardapio(menuItems);
        renderizarCarrinho();
        // A lógica de scroll e navbar pode ser reativada aqui se necessário
    }

    iniciarAplicacao();
});