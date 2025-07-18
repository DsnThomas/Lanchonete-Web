document.addEventListener('DOMContentLoaded', () => {
    // --- Autenticação ---
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        alert('Acesso negado. Por favor, faça login.');
        window.location.href = 'index.html';
        return;
    }

    // --- Seletores da UI ---
    const generateReportBtn = document.getElementById('generateReportBtn');
    const loggedInUserNameSpan = document.getElementById('loggedInUserName');
    const logoutBtn = document.getElementById('logoutBtn');

    // --- API ---
    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    
    // --- Estado ---
    let salesChartInstance = null; // Variável para guardar a instância do gráfico

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

    async function loadReports() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        let url = new URL(`${API_BASE_URL}/orders/reports/sales/`);
        if (startDate && endDate) {
            url.searchParams.append('start_date', startDate);
            url.searchParams.append('end_date', endDate);
        }

        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.detail || 'Falha ao carregar relatório de vendas.');
            }
            
            const data = await response.json();
            
            document.getElementById('reportTotalRevenue').textContent = `R$ ${parseFloat(data.resumo.faturamento_total).toFixed(2)}`;
            document.getElementById('reportTotalOrders').textContent = data.resumo.total_pedidos;
            document.getElementById('reportAverageTicket').textContent = `R$ ${parseFloat(data.resumo.ticket_medio).toFixed(2)}`;
            
            const topProductsTbody = document.querySelector('#topProductsTable tbody');
            topProductsTbody.innerHTML = '';
            data.top_produtos.forEach(prod => {
                topProductsTbody.innerHTML += `<tr><td>${prod.nome_produto}</td><td>${prod.quantidade_vendida}</td></tr>`;
            });

            const paymentMethodsTbody = document.querySelector('#paymentMethodsTable tbody');
            paymentMethodsTbody.innerHTML = '';
            data.vendas_por_pagamento.forEach(pay => {
                paymentMethodsTbody.innerHTML += `<tr><td>${pay.payment_method}</td><td>R$ ${parseFloat(pay.total).toFixed(2)}</td></tr>`;
            });

            renderSalesChart(data.vendas_por_dia);

        } catch (error) {
            console.error("Erro ao gerar relatório de vendas:", error);
            alert(error.message);
        }
    }

    // NOVA FUNÇÃO PARA CARREGAR O RELATÓRIO DE LUCRATIVIDADE
    async function loadProfitabilityReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        let url = new URL(`${API_BASE_URL}/orders/reports/product-profitability/`);
        if (startDate && endDate) {
            url.searchParams.append('start_date', startDate);
            url.searchParams.append('end_date', endDate);
        }

        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Falha ao carregar relatório de lucratividade.');
            }

            const data = await response.json();
            const profitabilityTbody = document.querySelector('#profitabilityTable tbody');
            profitabilityTbody.innerHTML = ''; // Limpa a tabela antes de preencher

            data.forEach(item => {
                const row = `
                    <tr>
                        <td>${item.nome_produto}</td>
                        <td>${item.quantidade_vendida}</td>
                        <td>R$ ${parseFloat(item.receita_total).toFixed(2)}</td>
                        <td>R$ ${parseFloat(item.custo_total).toFixed(2)}</td>
                        <td>R$ ${parseFloat(item.lucro_bruto).toFixed(2)}</td>
                        <td>${item.margem_lucro_percentual}%</td>
                    </tr>
                `;
                profitabilityTbody.innerHTML += row;
            });

        } catch (error) {
            console.error("Erro ao gerar relatório de lucratividade:", error);
            alert(error.message);
        }
    }

    function renderSalesChart(salesData) {
        const ctx = document.getElementById('salesChart').getContext('2d');
        
        if (salesChartInstance) {
            salesChartInstance.destroy();
        }

        const labels = salesData.map(d => new Date(d.dia + 'T00:00:00').toLocaleDateString('pt-BR'));
        const values = salesData.map(d => d.total);

        salesChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Faturamento por Dia (R$)',
                    data: values,
                    backgroundColor: 'rgba(255, 193, 7, 0.5)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, ticks: { color: 'white' } },
                    x: { ticks: { color: 'white' } }
                },
                plugins: {
                    legend: { labels: { color: 'white' } }
                }
            }
        });
    }

    // --- Event Listeners ---
    // ATUALIZADO: O botão agora chama ambas as funções de relatório
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => {
            loadReports();
            loadProfitabilityReport();
        });
    }

    // --- Inicialização ---
    setupAdminUI();
    // ATUALIZADO: Carrega ambos os relatórios na inicialização
    loadReports(); 
    loadProfitabilityReport();
});