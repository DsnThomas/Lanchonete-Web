document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores da UI (Elementos sempre presentes na página) ---
    const cardapioContainer = document.getElementById('cardapio');
    const navbarList = document.querySelector('#navbar-categorias ul');
    const carrinhoFlutuante = document.getElementById('carrinho-flutuante');
    const contadorCarrinho = document.getElementById('contador-carrinho');
    const successModal = document.getElementById('successModal');
    const successModalClose = document.getElementById('successModalClose');
    const orderNumberSpan = document.getElementById('orderNumber');
    const qrcodeContainer = document.getElementById('qrcode');
    const myOrdersBtn = document.getElementById('myOrdersBtn');
    const myOrdersModal = document.getElementById('myOrdersModal');
    const myOrdersModalClose = document.getElementById('myOrdersModalClose');
    const myOrdersListContainer = document.getElementById('myOrdersListContainer');
    const noUserOrdersMessage = document.getElementById('noUserOrdersMessage');
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutModalClose = document.getElementById('checkoutModalClose');
    const checkoutOrderSummary = document.getElementById('checkoutOrderSummary');
    const checkoutOrderTotal = document.getElementById('checkoutOrderTotal');
    const payOnPickupBtn = document.getElementById('payOnPickupBtn');
    const payOnlineBtn = document.getElementById('payOnlineBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const paymentModal = document.getElementById('paymentModal');

    // --- Estado da Aplicação ---
    let carrinho = [];
    let cardapioGlobal = [];
    let isProcessing = false;

    // --- API e Auth ---
    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    const accessToken = localStorage.getItem('accessToken');

    // --- Funções Principais ---

    function atualizarBotoesDeUsuario() {
        const estaLogado = !!accessToken;
        if (myOrdersBtn) {
            myOrdersBtn.style.display = estaLogado ? 'flex' : 'none';
        }
        if (logoutBtn) {
            logoutBtn.style.display = estaLogado ? 'flex' : 'none';
        }
    }

    async function carregarCardapioDaAPI() {
        try {
            const response = await fetch(`${API_BASE_URL}/stock/menu-products/?is_active=true`);
            if (!response.ok) throw new Error(`Erro: ${response.statusText}`);
            cardapioGlobal = await response.json();
        } catch (error) {
            console.error('Falha ao carregar cardápio da API:', error);
            if (cardapioContainer) cardapioContainer.innerHTML = '<p>Não foi possível carregar o cardápio.</p>';
        }
    }

    function renderizarCardapio() {
        if (!cardapioContainer || !navbarList) return;
        cardapioContainer.innerHTML = '';
        navbarList.innerHTML = '';

        if (!cardapioGlobal || cardapioGlobal.length === 0) {
            if (cardapioContainer) cardapioContainer.innerHTML = "<p style='text-align: center;'>Nenhum item disponível no momento.</p>";
            return;
        }

        const itensPorCategoria = cardapioGlobal.reduce((acc, item) => {
            const categoria = item.stock_item_category_name || 'Diversos';
            if (!acc[categoria]) acc[categoria] = [];
            acc[categoria].push(item);
            return acc;
        }, {});

        for (const categoriaNome in itensPorCategoria) {
            const navId = `secao-${categoriaNome.toLowerCase().replace(/\s+/g, '-')}`;
            const navLi = document.createElement('li');
            navLi.innerHTML = `<a href="#${navId}" class="nav-link">${categoriaNome}</a>`;
            navbarList.appendChild(navLi);

            const secaoDiv = document.createElement('div');
            secaoDiv.className = 'categoria';
            secaoDiv.id = navId;
            secaoDiv.innerHTML = `<h3>${categoriaNome}</h3><div class="itens-categoria"></div>`;
            const itensCategoriaDiv = secaoDiv.querySelector('.itens-categoria');
            
            itensPorCategoria[categoriaNome].forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'item-cardapio';
                const estoqueDisponivel = item.stock_item_quantity > 0;
                if (!estoqueDisponivel) itemDiv.classList.add('esgotado');
                itemDiv.innerHTML = `
                    <img src="${item.image_url || item.stock_item_image_url || 'https://via.placeholder.com/150'}" alt="${item.name}">
                    <h4>${item.name}</h4>
                    <p class="descricao-item">${item.description || '&nbsp;'}</p>
                    <p class="preco">R$ ${parseFloat(item.sale_price).toFixed(2)}</p>
                    <div class="controle-item">
                        <div class="quantidade-seletor">
                            <button class="qtd-btn diminuir" ${!estoqueDisponivel ? 'disabled' : ''}>-</button>
                            <span class="quantidade-valor">1</span>
                            <button class="qtd-btn aumentar" ${!estoqueDisponivel ? 'disabled' : ''}>+</button>
                        </div>
                        <button class="adicionar-carrinho" data-id="${item.id}" ${!estoqueDisponivel ? 'disabled' : ''}>
                            ${estoqueDisponivel ? 'Adicionar' : 'Esgotado'}
                        </button>
                    </div>`;
                itensCategoriaDiv.appendChild(itemDiv);
            });
            cardapioContainer.appendChild(secaoDiv);
        }
        adicionarListenersAosItens();
    }
    
    function adicionarListenersAosItens() {
        document.querySelectorAll('.item-cardapio').forEach(itemDiv => {
            const id = itemDiv.querySelector('.adicionar-carrinho').dataset.id;
            const itemDoCardapio = cardapioGlobal.find(p => p.id == id);
            if (!itemDoCardapio) return;
            const diminuirBtn = itemDiv.querySelector('.diminuir');
            const aumentarBtn = itemDiv.querySelector('.aumentar');
            const quantidadeSpan = itemDiv.querySelector('.quantidade-valor');
            const adicionarBtn = itemDiv.querySelector('.adicionar-carrinho');
            
            aumentarBtn.addEventListener('click', () => {
                let quantidade = parseInt(quantidadeSpan.textContent);
                if (quantidade < itemDoCardapio.stock_item_quantity) {
                    quantidadeSpan.textContent = quantidade + 1;
                }
            });
            
            diminuirBtn.addEventListener('click', () => {
                let quantidade = parseInt(quantidadeSpan.textContent);
                if (quantidade > 1) {
                    quantidadeSpan.textContent = quantidade - 1;
                }
            });
            
            adicionarBtn.addEventListener('click', () => {
                const quantidadeDesejada = parseInt(quantidadeSpan.textContent);
                adicionarAoCarrinho(itemDoCardapio, quantidadeDesejada);
                quantidadeSpan.textContent = '1';
            });
        });
    }

    function adicionarAoCarrinho(item, quantidade) {
        if (!item || item.stock_item_quantity <= 0) { alert('Item esgotado.'); return; }
        const itemExistente = carrinho.find(cartItem => cartItem.id === item.id);
        const qtdNoCarrinho = itemExistente ? itemExistente.quantidade : 0;
        
        if (qtdNoCarrinho + quantidade > item.stock_item_quantity) {
            alert(`Estoque insuficiente. Pode adicionar no máximo mais ${item.stock_item_quantity - qtdNoCarrinho}.`);
            return;
        }
        
        if (itemExistente) {
            itemExistente.quantidade += quantidade;
        } else {
            carrinho.push({ id: item.id, nome: item.name, preco: parseFloat(item.sale_price), quantidade: quantidade });
        }
        renderizarCarrinho();
    }
    
    function renderizarCarrinho() {
        if (!contadorCarrinho || !carrinhoFlutuante) return;
        const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
        contadorCarrinho.textContent = totalItens;
        carrinhoFlutuante.classList.toggle('carrinho-vazio-flutuante', totalItens === 0);
    }

    function limparCarrinho() {
        if (confirm('Tem certeza que deseja esvaziar seu carrinho?')) {
            carrinho = [];
            renderizarCarrinho();
            if(checkoutModal) checkoutModal.classList.remove('active'); 
        }
    }

    function fazerLogout() {
        localStorage.clear();
        window.location.href = 'index.html'; 
    }

    function abrirModalCheckout() {
        if (carrinho.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        checkoutOrderSummary.innerHTML = '';
        let total = 0;
        carrinho.forEach(item => {
            const itemHtml = `
                <div class="summary-item">
                    <span class="summary-item-name">${item.quantidade}x ${item.nome}</span>
                    <span class="summary-item-price">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                </div>
            `;
            checkoutOrderSummary.innerHTML += itemHtml;
            total += item.preco * item.quantidade;
        });
        checkoutOrderTotal.textContent = `R$ ${total.toFixed(2)}`;
        checkoutModal.classList.add('active');
    }

    async function processarPedido(paymentMethod) {
        if (isProcessing || carrinho.length === 0) return;
        if (!accessToken) {
            alert('Você precisa estar logado para finalizar um pedido.');
            window.location.href = 'index.html';
            return;
        }
        isProcessing = true;
        
        const requestBody = {
            payment_method: paymentMethod,
            items: carrinho.map(item => ({ product_id: item.id, quantity: item.quantidade }))
        };

        try {
            const response = await fetch(`${API_BASE_URL}/orders/sales/create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            if (!response.ok) {
                const errorMessage = data.error || data.detail || 'Não foi possível criar seu pedido.';
                throw new Error(errorMessage);
            }

            checkoutModal.classList.remove('active');

            if (paymentMethod === 'ONLINE') {
                iniciarSimulacaoPagamento(data.id, data.valor_total);
            } else {
                showSuccessModal(data.id);
                carrinho = [];
                renderizarCarrinho();
            }
        } catch (error) {
            console.error('Erro em processarPedido:', error);
            alert(error.message);
        } finally {
            isProcessing = false;
        }
    }

    function iniciarSimulacaoPagamento(orderId, totalAmount) {
        if (!paymentModal) return;

        // Seletores dos elementos do modal de pagamento
        const paymentInterfaceDiv = paymentModal.querySelector('.payment-interface');
        const paymentProcessingDiv = paymentModal.querySelector('#payment-processing');
        const paymentSuccessDiv = paymentModal.querySelector('#payment-success');
        const confirmCardPaymentBtn = paymentModal.querySelector('#confirmCardPayment');
        const confirmPixPaymentBtn = paymentModal.querySelector('#confirmPixPayment');
        const paymentAmountCardSpan = paymentModal.querySelector('#paymentAmountCard');

        // Reseta o estado do modal
        paymentInterfaceDiv.classList.remove('hidden');
        paymentProcessingDiv.classList.add('hidden');
        paymentSuccessDiv.classList.add('hidden');
        
        paymentAmountCardSpan.textContent = parseFloat(totalAmount).toFixed(2);
        paymentModal.classList.add('active');

        const handlePaymentSimulation = () => {
            paymentInterfaceDiv.classList.add('hidden');
            paymentProcessingDiv.classList.remove('hidden');

            // Simula o processamento
            setTimeout(() => {
                paymentProcessingDiv.classList.add('hidden');
                paymentSuccessDiv.classList.remove('hidden');

                // Após sucesso, atualiza o status
                setTimeout(async () => {
                    try {
                        // Chamando a nova rota segura com o método POST
                        const updateResponse = await fetch(`${API_BASE_URL}/orders/sales/${orderId}/confirm-payment/`, {
                            method: 'POST', // Usamos POST para esta ação
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${accessToken}`
                            },
                            // O corpo pode ser vazio, pois a ação está na URL
                        });

                        if (!updateResponse.ok) throw new Error('Falha ao confirmar o pagamento no servidor.');
                        
                        paymentModal.classList.remove('active');
                        showSuccessModal(orderId);
                        carrinho = [];
                        renderizarCarrinho();
                        iniciar();

                    } catch (err) {
                        alert(err.message);
                        paymentModal.classList.remove('active');
                    }
                }, 1500);
            }, 2000);
        };
        
        confirmCardPaymentBtn.onclick = handlePaymentSimulation;
        confirmPixPaymentBtn.onclick = handlePaymentSimulation;
    }
    
    function showSuccessModal(orderId) {
        if (!successModal) return;
        qrcodeContainer.innerHTML = '';
        orderNumberSpan.textContent = `#${orderId}`;
        new QRCode(qrcodeContainer, { text: String(orderId), width: 180, height: 180 });
        successModal.classList.add('active');
    }
    
    async function showMyOrders() {
        if (!accessToken) { alert('Faça login para ver seus pedidos.'); return; }
        
        // Seletores para os novos contêineres das abas
        const inProgressContainer = document.getElementById('inProgressOrdersContainer');
        const completedContainer = document.getElementById('completedOrdersContainer');
        
        try {
            const response = await fetch(`${API_BASE_URL}/orders/my-orders/`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) throw new Error('Falha ao buscar seus pedidos.');
            const orders = await response.json();
            
            // Limpa os contêineres antes de adicionar os novos dados
            inProgressContainer.innerHTML = '';
            completedContainer.innerHTML = '';
            
            if (orders.length === 0) {
                noUserOrdersMessage.classList.remove('hidden');
            } else {
                noUserOrdersMessage.classList.add('hidden');
                
                // Filtra os pedidos em duas listas
                const inProgressOrders = orders.filter(o => o.status !== 'FINALIZADO' && o.status !== 'CANCELADO');
                const completedOrders = orders.filter(o => o.status === 'FINALIZADO' || o.status === 'CANCELADO');

                // Ordena ambas as listas pela data mais recente primeiro
                inProgressOrders.sort((a,b) => new Date(b.data_venda) - new Date(a.data_venda));
                completedOrders.sort((a,b) => new Date(b.data_venda) - new Date(a.data_venda));

                // Função auxiliar para criar o HTML de um item de pedido
                const createOrderHtml = (order) => {
                    const orderDiv = document.createElement('div');
                    orderDiv.className = 'user-order-item';
                    const isOrderActive = order.status !== 'FINALIZADO' && order.status !== 'CANCELADO';
                    if (isOrderActive) orderDiv.dataset.orderId = order.id;
                    
                    orderDiv.innerHTML = `
                        <div class="order-item-header">
                            <strong>Pedido #${order.id}</strong>
                            <span class="status-badge status-${order.status.toLowerCase()}">${order.status_display}</span>
                        </div>
                        <div class="order-item-details">
                            <span>${new Date(order.data_venda).toLocaleDateString('pt-BR')} - R$ ${parseFloat(order.valor_total).toFixed(2)}</span>
                            ${isOrderActive ? '<br><small>Clique para ver o QR Code</small>' : ''}
                        </div>
                    `;
                    return orderDiv;
                };

                // Renderiza os pedidos em andamento
                if (inProgressOrders.length > 0) {
                    inProgressOrders.forEach(order => inProgressContainer.appendChild(createOrderHtml(order)));
                } else {
                    inProgressContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Nenhum pedido em andamento.</p>';
                }

                // Renderiza os pedidos finalizados
                if (completedOrders.length > 0) {
                    completedOrders.forEach(order => completedContainer.appendChild(createOrderHtml(order)));
                } else {
                    completedContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Nenhum pedido no histórico.</p>';
                }
            }
            myOrdersModal.classList.add('active');
        } catch (error) {
            alert(error.message);
        }
    }

    // --- Listeners de Eventos ---

    if (logoutBtn) logoutBtn.addEventListener('click', fazerLogout);
    if (clearCartBtn) clearCartBtn.addEventListener('click', (e) => { e.preventDefault(); limparCarrinho(); });
    if (carrinhoFlutuante) carrinhoFlutuante.addEventListener('click', (e) => { e.preventDefault(); abrirModalCheckout(); });
    
    function setupModalListeners(modal, closeBtn) {
        if (modal && closeBtn) {
            closeBtn.addEventListener('click', () => modal.classList.remove('active'));
            modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
        }
    }
    setupModalListeners(successModal, successModalClose);
    setupModalListeners(myOrdersModal, myOrdersModalClose);
    setupModalListeners(checkoutModal, checkoutModalClose);

    if (payOnPickupBtn) payOnPickupBtn.addEventListener('click', () => processarPedido('NA_RETIRADA'));
    if (payOnlineBtn) payOnlineBtn.addEventListener('click', () => processarPedido('ONLINE'));

    if (myOrdersBtn) myOrdersBtn.addEventListener('click', showMyOrders);
    
    if (myOrdersModal) { 
        myOrdersModal.addEventListener('click', (event) => {
            const orderItem = event.target.closest('.user-order-item');

            // Verificamos se um item de pedido com QR Code foi realmente clicado
            if (orderItem && orderItem.dataset.orderId) {
                myOrdersModal.classList.remove('active');
                showSuccessModal(orderItem.dataset.orderId);
            }
        });
    }


        document.querySelectorAll('.order-tabs .tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const targetContainerId = button.dataset.target;
            const targetContainer = document.getElementById(targetContainerId);

            // Remove a classe 'active' de todos os botões e contêineres
            document.querySelectorAll('.order-tabs .tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.order-tab-content').forEach(container => container.classList.remove('active'));

            // Adiciona a classe 'active' ao botão clicado e ao seu contêiner correspondente
            button.classList.add('active');
            targetContainer.classList.add('active');
        });
    });

    // --- Inicialização da Aplicação ---
    async function iniciar() {
        await carregarCardapioDaAPI();
        renderizarCardapio();
        renderizarCarrinho();
        atualizarBotoesDeUsuario();
    }

    iniciar();
});
