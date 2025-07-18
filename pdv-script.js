document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores da UI do PDV ---
    const productGrid = document.getElementById('pdvProductGrid');
    const orderItemsList = document.getElementById('orderItemsList');
    const subtotalValueEl = document.getElementById('subtotalValue');
    const totalValueEl = document.getElementById('totalValue');
    const finalizeSaleBtn = document.getElementById('finalizeSaleBtn');
    const productSearchInput = document.getElementById('productSearchInput');
    const categoryFilterSelect = document.getElementById('categoryFilterSelect');
    
    // Modal de Pagamento
    const paymentPdvModal = document.getElementById('paymentPdvModal');
    const paymentPdvModalClose = document.getElementById('paymentPdvModalClose');
    const paymentModalTotalEl = document.getElementById('paymentModalTotal');

    // Modal de recibo
    const receiptModal = document.getElementById('receiptModal');
    const receiptOrderIdEl = document.getElementById('receiptOrderId');
    const receiptQrCodeEl = document.getElementById('receiptQrCode');
    const printReceiptBtn = document.getElementById('printReceiptBtn');
    const newOrderBtn = document.getElementById('newOrderBtn');

    // Seletores para o Modal de Pedidos Pendentes
    const loadPendingOrdersBtn = document.getElementById('loadPendingOrdersBtn');
    const pendingOrdersModal = document.getElementById('pendingOrdersModal');
    const pendingOrdersModalClose = document.getElementById('pendingOrdersModalClose');
    const pendingOrdersList = document.getElementById('pendingOrdersList');
    const newOrderBtnPDV = document.getElementById('newOrderBtnPDV');

    // NOVO: Seletores e variável para o scanner no PDV
    const scanQrCodeBtnPDV = document.getElementById('scanQrCodeBtnPDV');
    const qrReaderContainerPDV = document.getElementById('qr-reader-pdv');
    let html5QrCodeScanner = null;


    // --- Estado da Aplicação ---
    let allProducts = [];
    let cart = []; // Formato: [{id, name, price, quantity, stock}, ...]
    let currentPayingOrderId = null; // Guarda o ID do pedido existente que está sendo pago

    // --- API e Auth ---
    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    const accessToken = localStorage.getItem('accessToken');

    // --- Verificação de Autenticação ---
    if (!accessToken) {
        alert('Acesso negado. Por favor, faça login.');
        window.location.href = 'index.html';
        return;
    }

    // --- Funções de Renderização da UI (sem alterações) ---

    function renderProductGrid(products) {
        productGrid.innerHTML = '';
        if (!products || products.length === 0) {
            productGrid.innerHTML = '<p class="empty-cart-message">Nenhum produto encontrado.</p>';
            return;
        }
        products.forEach(product => {
            const isOutOfStock = product.stock_item_quantity <= 0;
            const card = document.createElement('div');
            card.className = `pdv-product-card ${isOutOfStock ? 'esgotado' : ''}`;
            if (!isOutOfStock) {
                card.dataset.productId = product.id;
            }
            
            card.innerHTML = `
                <img src="${product.image_url || product.stock_item_image_url || 'https://via.placeholder.com/150'}" alt="${product.name}">
                <h5>${product.name}</h5>
                <p>R$ ${parseFloat(product.sale_price).toFixed(2)}</p>
            `;
            productGrid.appendChild(card);
        });
    }

    function renderCart() {
        const orderItemsList = document.getElementById('orderItemsList'); // Adicionado para garantir o escopo
        if (cart.length === 0) {
            orderItemsList.innerHTML = '<p class="empty-cart-message">O carrinho está vazio.</p>';
        } else {
            orderItemsList.innerHTML = '';
            cart.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'order-item';

                // NOVO: Lógica para mostrar os controles apenas se não for um pedido existente
                const controlesHtml = currentPayingOrderId === null
                    ? ` <div class="order-item-controls">
                            <button class="qtd-btn" data-id="${item.id}" data-action="decrease">-</button>
                            <span class="item-quantity">${item.quantity}</span>
                            <button class="qtd-btn" data-id="${item.id}" data-action="increase">+</button>
                            <button class="qtd-btn remove-item-btn" data-id="${item.id}" data-action="remove"><i class="fas fa-trash-alt"></i></button>
                        </div>`
                    : ''; // Se for um pedido existente, não renderiza nada

                itemEl.innerHTML = `
                    <div class="order-item-info">
                        <span>${item.name}</span>
                        <small>R$ ${parseFloat(item.price).toFixed(2)}</small>
                    </div>
                    ${controlesHtml}
                `;
                orderItemsList.appendChild(itemEl);
            });
        }
        updateTotals();
    }

    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        subtotalValueEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        totalValueEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        finalizeSaleBtn.disabled = cart.length === 0;
    }

    // --- Funções de Lógica de Negócio (com alterações) ---

    async function initializePDV() {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/stock/menu-products/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch(`${API_BASE_URL}/stock/categories/`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
            ]);
            
            if (!productsRes.ok || !categoriesRes.ok) throw new Error('Falha ao carregar dados iniciais do servidor.');
            
            allProducts = await productsRes.json();
            const categories = await categoriesRes.json();

            renderProductGrid(allProducts.filter(p => p.is_active));
            populateCategoryFilter(categories);

        } catch (error) {
            console.error('Falha ao inicializar o PDV:', error);
            productGrid.innerHTML = `<p class="empty-cart-message" style="color: var(--red);">${error.message}</p>`;
        }
    }

    function populateCategoryFilter(categories) {
        categoryFilterSelect.innerHTML = '<option value="all">Todas as Categorias</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categoryFilterSelect.appendChild(option);
        });
    }

    function handleProductClick(event) {
        // NOVO: Verificação para impedir adição de itens
        if (currentPayingOrderId !== null) {
            alert('Não é possível adicionar itens a um pedido existente. Finalize a venda ou inicie um novo pedido.');
            return;
        }

        const card = event.target.closest('.pdv-product-card');
        if (card && !card.classList.contains('esgotado')) {
            const productId = parseInt(card.dataset.productId, 10);
            addToCart(productId);
        }
    }

    function addToCart(productId) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const existingItem = cart.find(item => item.id === product.id);
        const stockAvailable = product.stock_item_quantity;
        const quantityInCart = existingItem ? existingItem.quantity : 0;
        
        if (quantityInCart >= stockAvailable) {
            alert(`Estoque máximo para "${product.name}" atingido.`);
            return;
        }
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id: product.id, name: product.name, price: parseFloat(product.sale_price), quantity: 1, stock: stockAvailable });
        }
        renderCart();
    }
    
    function handleCartActions(event) {
        const button = event.target.closest('.qtd-btn');
        if (!button) return;

        const productId = parseInt(button.dataset.id, 10);
        const action = button.dataset.action;
        const itemIndex = cart.findIndex(item => item.id === productId);
        if (itemIndex === -1) return;

        const itemInCart = cart[itemIndex];

        if (action === 'increase') {
            if (itemInCart.quantity < itemInCart.stock) itemInCart.quantity++;
            else alert(`Estoque máximo para "${itemInCart.name}" atingido.`);
        } else if (action === 'decrease') {
            itemInCart.quantity--;
            if (itemInCart.quantity === 0) cart.splice(itemIndex, 1);
        } else if (action === 'remove') {
            cart.splice(itemIndex, 1);
        }
        renderCart();
    }

    function handleFilterAndSearch() {
        const searchTerm = productSearchInput.value.toLowerCase();
        const selectedCategory = categoryFilterSelect.value;
        let filteredProducts = allProducts.filter(p => p.is_active);

        if (selectedCategory !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.stock_item_category_name === selectedCategory);
        }
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(searchTerm));
        }
        renderProductGrid(filteredProducts);
    }
    
    async function finalizeSale(paymentMethod) {
        // Se temos um ID, estamos pagando um pedido existente (PATCH)
        if (currentPayingOrderId) {
            try {
                const response = await fetch(`${API_BASE_URL}/orders/sales/${currentPayingOrderId}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                    body: JSON.stringify({ 
                        payment_method: paymentMethod,
                        status: 'PAGO' 
                    })
                });

                const saleData = await response.json();
                if (!response.ok) {
                    throw new Error(saleData.detail || saleData.error || 'Falha ao atualizar o pedido.');
                }
                
                paymentPdvModal.classList.add('hidden');

                // ALTERAÇÃO PRINCIPAL AQUI:
                // Criamos um objeto 'receiptData' usando o ID que já temos (currentPayingOrderId)
                // e pegamos apenas os dados do QR Code da resposta da API.
                const receiptData = {
                    id: currentPayingOrderId,
                    pix_qr_code_data: saleData.pix_qr_code_data
                };

                showReceiptModal(receiptData); // Passamos o objeto corrigido

            } catch (error) {
                console.error('Erro ao pagar pedido existente:', error);
                alert(error.message);
            }
        } 
        // Se não, estamos criando uma nova venda (POST)
        else {
            const requestBody = {
                payment_method: paymentMethod,
                items: cart.map(item => ({ product_id: item.id, quantity: item.quantity }))
            };

            try {
                const response = await fetch(`${API_BASE_URL}/orders/sales/create/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                    body: JSON.stringify(requestBody)
                });

                const saleData = await response.json();
                if (!response.ok) {
                    throw new Error(saleData.error || 'Falha ao registrar a venda.');
                }

                paymentPdvModal.classList.add('hidden');
                showReceiptModal(saleData);

            } catch (error) {
                console.error('Erro ao finalizar venda:', error);
                alert(error.message);
            }
        }
    }

    function showReceiptModal(saleData) {
        // Limpa o QR code anterior e gera um novo
        receiptQrCodeEl.innerHTML = '';
        new QRCode(receiptQrCodeEl, {
            text: saleData.pix_qr_code_data || String(saleData.id), // Prioriza o PIX
            width: 160,
            height: 160,
        });

        // Atualiza o número do pedido no modal
        receiptOrderIdEl.textContent = `Pedido #${saleData.id}`;

        // Apenas mostra o modal de recibo.
        receiptModal.classList.remove('hidden');
    }

    function resetPDV() {
        cart = [];
        currentPayingOrderId = null; 
        renderCart();
        receiptModal.classList.add('hidden'); 
        initializePDV(); 

        // NOVO: Remove a classe para destravar a interface
        document.querySelector('.pdv-wrapper').classList.remove('pdv-locked');
    }

    function onScanSuccess(decodedText, decodedResult) {
        console.log(`QR Code lido com sucesso: ${decodedText}`);

        if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
            html5QrCodeScanner.stop().catch(err => console.error("Falha ao parar scanner.", err));
        }
        qrReaderContainerPDV.style.display = 'none';
        scanQrCodeBtnPDV.innerHTML = '<i class="fas fa-qrcode"></i> Ler QR Code';

        // Chama a função para carregar o pedido no carrinho do PDV
        const orderId = decodedText;
        loadOrderIntoCart(orderId);
    }

    function onScanFailure(error) {
        // Ignora erros contínuos
    }

    function startQrScanner() {
        if (!html5QrCodeScanner) {
            html5QrCodeScanner = new Html5Qrcode("qr-reader-pdv");
        }
        qrReaderContainerPDV.style.display = 'block';
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrCodeScanner.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
            .catch(err => {
                alert("Erro ao iniciar a câmera. Verifique as permissões do navegador.");
                qrReaderContainerPDV.style.display = 'none';
            });
    }

    // --- Funções para carregar e manusear pedidos pendentes ---

    async function fetchAndShowPendingOrders() {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/sales/active/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar pedidos.');
            
            const allActiveOrders = await response.json();
            const pendingPaymentOrders = allActiveOrders.filter(order => order.status === 'AGUARDANDO_PAGAMENTO');
            
            pendingOrdersList.innerHTML = ''; // Limpa a lista
            if (pendingPaymentOrders.length === 0) {
                pendingOrdersList.innerHTML = '<p>Nenhum pedido aguardando pagamento.</p>';
            } else {
                pendingPaymentOrders.forEach(order => {
                    const li = document.createElement('li');
                    li.dataset.orderId = order.id;
                    li.innerHTML = `
                        <strong>Pedido #${order.id}</strong>
                        <small>Cliente: ${order.cliente_nome || 'Venda no Balcão'} | Total: R$ ${parseFloat(order.valor_total).toFixed(2)}</small>
                    `;
                    pendingOrdersList.appendChild(li);
                });
            }

            pendingOrdersModal.classList.remove('hidden');

        } catch (error) {
            console.error("Erro ao carregar pedidos pendentes:", error);
            alert(error.message);
        }
    }

    async function loadOrderIntoCart(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/sales/${orderId}/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    alert(`Pedido com ID #${orderId} não encontrado.`);
                } else {
                    alert('Não foi possível carregar os detalhes do pedido.');
                }
                throw new Error('Falha ao carregar pedido.');
            }

            const orderDetails = await response.json();
            cart = [];
            currentPayingOrderId = orderDetails.id;

            orderDetails.itens.forEach((item, index) => {
                const itemPrice = item.preco_unitario || 0;
                const temporaryId = index;
                cart.push({
                    id: temporaryId,
                    name: item.nome_produto,
                    price: parseFloat(itemPrice),
                    quantity: item.quantidade,
                    stock: Infinity
                });
            });

            renderCart();
            pendingOrdersModal.classList.add('hidden');

            // NOVO: Adiciona a classe para travar a interface
            document.querySelector('.pdv-wrapper').classList.add('pdv-locked');

        } catch (error) {
            console.error('Erro ao carregar pedido no carrinho:', error.message);
        }
    }

    // --- Event Listeners ---
    productGrid.addEventListener('click', handleProductClick);
    orderItemsList.addEventListener('click', handleCartActions);
    productSearchInput.addEventListener('input', handleFilterAndSearch);
    categoryFilterSelect.addEventListener('change', handleFilterAndSearch);
    
    // --- Listeners para o Modal de Recibo ---
    printReceiptBtn.addEventListener('click', () => {
        window.print(); // O CSS @media print cuida do resto
    });
    
    newOrderBtn.addEventListener('click', resetPDV);

    receiptModal.addEventListener('click', (event) => {
        if (event.target === receiptModal) {
            resetPDV();
        }
    });


    // --- Listeners para o Modal de Pagamento ---
    finalizeSaleBtn.addEventListener('click', () => {
        if (finalizeSaleBtn.disabled) return;
        paymentModalTotalEl.textContent = totalValueEl.textContent;
        paymentPdvModal.classList.remove('hidden');
    });
    
    paymentPdvModalClose.addEventListener('click', () => {
        paymentPdvModal.classList.add('hidden');
    });
    
    paymentPdvModal.addEventListener('click', (event) => {
        if (event.target === paymentPdvModal) {
            paymentPdvModal.classList.add('hidden');
            return;
        }

        const paymentButton = event.target.closest('.payment-button');
        if (paymentButton) {
            const method = paymentButton.dataset.method;
            finalizeSale(method);
        }
    });

    // NOVO: Listener para o botão "Novo Pedido"

    if (newOrderBtnPDV) {
    newOrderBtnPDV.addEventListener('click', () => {
        // Confirma com o usuário se o carrinho não estiver vazio
        if (cart.length > 0) {
            if (confirm('Tem certeza que deseja limpar o pedido atual e começar um novo?')) {
                resetPDV();
            }
        } else {
            resetPDV();
        }
    });
}
    if (scanQrCodeBtnPDV) {
        scanQrCodeBtnPDV.addEventListener('click', () => {
            const isScanning = qrReaderContainerPDV.style.display === 'block';
            if (isScanning) {
                if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
                    html5QrCodeScanner.stop();
                }
                qrReaderContainerPDV.style.display = 'none';
                scanQrCodeBtnPDV.innerHTML = '<i class="fas fa-qrcode"></i> Ler QR Code';
            } else {
                startQrScanner();
                scanQrCodeBtnPDV.innerHTML = '<i class="fas fa-stop-circle"></i> Parar';
            }
        });
    }

    // --- Listeners para o Modal de Pedidos Pendentes ---
    if (loadPendingOrdersBtn) {
        loadPendingOrdersBtn.addEventListener('click', fetchAndShowPendingOrders);
    }

    if (pendingOrdersModalClose) {
        pendingOrdersModalClose.addEventListener('click', () => {
            pendingOrdersModal.classList.add('hidden');
        });
    }
    
    if (pendingOrdersList) {
        pendingOrdersList.addEventListener('click', (event) => {
            const listItem = event.target.closest('li');
            if(listItem && listItem.dataset.orderId){
                const orderId = listItem.dataset.orderId;
                loadOrderIntoCart(orderId);
            }
        });
    }


    // --- Inicialização ---
    initializePDV();
});