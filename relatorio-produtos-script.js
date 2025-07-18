document.addEventListener('DOMContentLoaded', () => {
    // --- Autenticação ---
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        alert('Acesso negado. Por favor, faça login.');
        window.location.href = 'index.html';
        return;
    }

    // --- Seletores da UI ---
    const printReportBtn = document.getElementById('printReportBtn');
    const loggedInUserNameSpan = document.getElementById('loggedInUserName');
    const logoutBtn = document.getElementById('logoutBtn');
    const tableBody = document.querySelector('#productsReportTable tbody');

    // --- API ---
    const API_BASE_URL = 'http://127.0.0.1:8000/api';

    // --- Funções ---

    function setupAdminUI() {
        // Preenche o nome do usuário
        const userName = localStorage.getItem('userName');
        if (loggedInUserNameSpan) {
            loggedInUserNameSpan.textContent = userName || 'Usuário';
        }

        // Lógica do menu mobile
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('overlay');

        if (mobileMenuToggle && sidebar && overlay) {
            mobileMenuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }
        
        // Lógica do logout
        if(logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = 'index.html';
            });
        }
    }

    async function loadProductReport() {
        const url = `${API_BASE_URL}/stock/reports/all-products/`;
        
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Falha ao carregar relatório de produtos.');
            }

            const products = await response.json();
            renderTable(products);

        } catch (error) {
            console.error("Erro ao gerar relatório de produtos:", error);
            tableBody.innerHTML = `<tr><td colspan="8" class="error-message">${error.message}</td></tr>`;
        }
    }

    function renderTable(products) {
        // Limpa o estado de "carregando"
        tableBody.innerHTML = '';

        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">Nenhum produto encontrado.</td></tr>';
            return;
        }

        products.forEach(product => {
            const row = `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.stock_item_category_name || 'N/A'}</td>
                    <td>${product.supplier_name || 'N/A'}</td>
                    <td>R$ ${parseFloat(product.sale_price).toFixed(2)}</td>
                    <td>R$ ${product.cost_price ? parseFloat(product.cost_price).toFixed(2) : 'N/A'}</td>
                    <td>${product.stock_item_quantity}</td>
                    <td class="status ${product.is_active ? 'status-active' : 'status-inactive'}">
                        ${product.is_active ? 'Sim' : 'Não'}
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    // --- Event Listeners ---
    if (printReportBtn) {
        printReportBtn.addEventListener('click', () => {
            window.print(); // O CSS cuidará da formatação
        });
    }

    // --- Inicialização ---
    setupAdminUI();
    loadProductReport();
});