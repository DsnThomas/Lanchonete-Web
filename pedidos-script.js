document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores ---
    const ordersTableBody = document.querySelector('#ordersTable tbody');
    const noOrdersMessage = document.getElementById('noOrdersMessage');
    const loggedInUserNameSpan = document.getElementById('loggedInUserName');
    const logoutBtn = document.getElementById('logoutBtn');
    const modalOverlay = document.getElementById('orderModalOverlay');
    const modalContent = document.getElementById('modalContent');
    const modalCloseButton = document.getElementById('modalCloseButton');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item a');

    // NOVO: Seletores para o Scanner de QR Code
    const scanQrCodeBtn = document.getElementById('scanQrCodeBtn');
    const qrReaderContainer = document.getElementById('qr-reader');
    let html5QrCodeScanner = null; // Variável para controlar o scanner

    // --- API e Auth ---
    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    const accessToken = localStorage.getItem('accessToken');
    const userName = localStorage.getItem('userName');
    const userPermissions = JSON.parse(localStorage.getItem('userPermissions')) || [];

    // --- Autenticação ---
    if (!accessToken) {
        alert('Acesso negado. Por favor, faça login.');
        window.location.href = 'index.html';
        return;
    }
    if (loggedInUserNameSpan) {
        loggedInUserNameSpan.textContent = userName || 'Usuário';
    }

        const hasPermission = (sectionCodename) => {
        if (userPermissions.includes('all') || sectionCodename === 'dashboard') {
            return true;
        }
        // Links diretos como 'pedidos.html' também são verificados
        if (userPermissions.includes(sectionCodename)) {
            return true;
        }
        return false;
    };

    const applyRolePermissions = () => {
        if (userPermissions.includes('all')) return;

        navItems.forEach(link => {
            // Verifica tanto links de seção (data-section) quanto links de página (href)
            const sectionTarget = link.dataset.section;
            const pageTarget = link.getAttribute('href').split('?')[0]; // Pega o nome do arquivo, ex: "pedidos.html"

            // Se um usuário tem permissão para 'pedidos.html', não esconda o link para essa página.
            if (pageTarget === 'pedidos.html' && hasPermission(pageTarget)) {
                return;
            }

            const codename = sectionTarget || pageTarget;
            
            if (codename && !hasPermission(codename)) {
                link.parentElement.style.display = 'none';
            }
        });
    };

    // --- Funções Principais ---
    async function loadActiveOrders() {
        if (!ordersTableBody) return;
        try {
            const response = await fetch(`${API_BASE_URL}/orders/sales/active/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) throw new Error(`Erro: ${response.statusText}`);

            const orders = await response.json();

            if (orders.length === 0) {
                noOrdersMessage.classList.remove('hidden');
                ordersTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum pedido ativo no momento.</td></tr>';
            } else {
                noOrdersMessage.classList.add('hidden');
                renderOrdersTable(orders);
            }
        } catch (error) {
            console.error("Erro ao carregar pedidos:", error);
            ordersTableBody.innerHTML = `<tr><td colspan="5" class="error-message">Falha ao carregar a fila de pedidos.</td></tr>`;
        }
    }

    function renderOrdersTable(orders) {
        ordersTableBody.innerHTML = '';
        orders.forEach(order => {
            const row = ordersTableBody.insertRow();
            row.className = 'order-row';
            row.dataset.orderId = order.id;

            // Contando o total de itens para exibição
            const totalItems = order.itens.reduce((sum, item) => sum + item.quantidade, 0);

            // --- CÓDIGO CORRIGIDO PARA RENDERIZAR A LINHA ---
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${new Date(order.data_venda).toLocaleTimeString('pt-BR')}</td>
                <td>${order.cliente_nome || 'Venda no Balcão'}</td>
                <td>R$ ${parseFloat(order.valor_total).toFixed(2)}</td>
                <td>
                    <span class="status-badge status-${order.status.toLowerCase()}">
                        ${order.status_display}
                    </span>
                </td>
            `;
        });
    }

    // --- LÓGICA DO MENU MOBILE ---
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');

    // Cria o overlay dinamicamente
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    document.body.appendChild(overlay);

    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        // Fecha o menu se clicar fora (no overlay)
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    async function openOrderModal(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/sales/${orderId}/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar detalhes do pedido.');

            const order = await response.json();

            let actionButton = '';
            let cancelButton = ''; // Novo botão de cancelar

            const statusActions = {
                'AGUARDANDO_PAGAMENTO': { action: 'Iniciar Preparo', nextStatus: 'EM_PREPARO' },               
                'PAGO': { action: 'Pedido Pronto', nextStatus: 'PRONTO' },
                'EM_PREPARO': { action: 'Pedido Pronto', nextStatus: 'PRONTO' },
                'PRONTO': { action: 'Entregar/Finalizar', nextStatus: 'FINALIZADO' },
            };

            // Apenas permite cancelar se o pedido não estiver finalizado ou cancelado
            if (order.status !== 'FINALIZADO' && order.status !== 'CANCELADO') {
                 cancelButton = `<button class="action-button modal-cancel" data-order-id="${order.id}">Cancelar Pedido</button>`;
            }

            if (statusActions[order.status]) {
                const { action, nextStatus } = statusActions[order.status];
                actionButton = `<button class="action-button modal-action" data-order-id="${order.id}" data-next-status="${nextStatus}">${action}</button>`;
            }

            modalContent.innerHTML = `
                <h3>Detalhes do Pedido #${order.id}</h3>
                <p><strong>Status Atual:</strong> <span class="status-badge ${order.status.toLowerCase()}">${order.status_display || order.status}</span></p>
                <p><strong>Cliente:</strong> ${order.cliente_nome || 'Venda no Balcão'}</p>
                <p><strong>Valor Total:</strong> R$ ${parseFloat(order.valor_total).toFixed(2)}</p>
                <h4>Itens:</h4>
                <ul class="order-items-list">
                    ${order.itens.map(item => `<li>${item.quantidade}x ${item.nome_produto}</li>`).join('')}
                </ul>
                <div class="order-actions">
                    ${actionButton}
                    ${cancelButton}
                </div>
            `;
            modalOverlay.classList.add('active');
        } catch (error) {
            console.error("Erro ao abrir modal:", error);
            alert(error.message);
        }
    }

    function closeOrderModal() {
        modalOverlay.classList.remove('active');
        modalContent.innerHTML = '';
    }

    async function updateOrderStatus(orderId, nextStatus) {
        if (nextStatus === 'FINALIZADO') {
            if (!confirm(`Tem certeza que deseja finalizar o pedido #${orderId}?`)) return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/orders/sales/${orderId}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({ status: nextStatus })
            });
            if (!response.ok) throw new Error('Falha ao atualizar o status.');
            closeOrderModal();
            loadActiveOrders();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert(error.message);
        }
    }

    async function cancelOrder(orderId) {
        if (!confirm(`Tem certeza que deseja CANCELAR o pedido #${orderId}? Esta ação é irreversível.`)) {
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/orders/sales/${orderId}/`, {
                method: 'PATCH', // Usamos PATCH para atualizar o status para CANCELADO
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({ status: 'CANCELADO' }) // Define o status para CANCELADO
            });
            if (!response.ok) throw new Error('Falha ao cancelar o pedido.');
            
            alert(`Pedido #${orderId} foi cancelado com sucesso!`);
            closeOrderModal();
            loadActiveOrders(); // Recarrega a lista para remover o pedido cancelado ou atualizar seu status
        } catch (error) {
            console.error('Erro ao cancelar pedido:', error);
            alert(error.message);
        }
    }


    // --- LÓGICA DO SCANNER DE QR CODE ---

    function onScanSuccess(decodedText, decodedResult) {
        console.log(`QR Code lido com sucesso: ${decodedText}`);

        if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
            html5QrCodeScanner.stop().catch(err => console.error("Falha ao parar scanner.", err));
        }
        qrReaderContainer.style.display = 'none';

        const orderId = decodedText;
        openOrderModal(orderId);
    }

    function onScanFailure(error) {
        // Ignora erros contínuos de "QR code not found".
        // console.warn(`QR Scan Error: ${error}`); // Pode descomentar para depurar
    }

    function startQrScanner() {
        if (!html5QrCodeScanner) {
            html5QrCodeScanner = new Html5Qrcode("qr-reader");
        }
        qrReaderContainer.style.display = 'block';
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrCodeScanner.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
            .catch(err => {
                alert("Erro ao iniciar a câmera. Verifique as permissões do navegador.");
                qrReaderContainer.style.display = 'none';
            });
    }

    // --- Event Listeners ---
    if (ordersTableBody) {
        ordersTableBody.addEventListener('click', (event) => {
            const row = event.target.closest('.order-row');
            if (row) openOrderModal(row.dataset.orderId);
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) closeOrderModal(); // Clica no overlay para fechar
            // Lógica para botões de ação no modal
            if (event.target.classList.contains('modal-action')) {
                updateOrderStatus(event.target.dataset.orderId, event.target.dataset.nextStatus);
            } else if (event.target.classList.contains('modal-cancel')) { // NOVO: Listener para o botão de cancelar
                cancelOrder(event.target.dataset.orderId);
            }
        });
    }

    if (modalCloseButton) modalCloseButton.addEventListener('click', closeOrderModal);
    if(logoutBtn) logoutBtn.addEventListener('click', () => { localStorage.clear(); window.location.href = 'index.html'; });

    // Listener para o botão de escanear (se existir)
    if (scanQrCodeBtn) {
        scanQrCodeBtn.addEventListener('click', () => {
            const isScanning = qrReaderContainer.style.display === 'block';
            if (isScanning) {
                if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
                    html5QrCodeScanner.stop();
                }
                qrReaderContainer.style.display = 'none';
            } else {
                startQrScanner();
            }
        });
    }

    applyRolePermissions();
    // --- Inicialização ---
    loadActiveOrders();
    // setInterval(loadActiveOrders, 15000); // Descomente para ativar o auto-refresh (cada 15 segundos)
});