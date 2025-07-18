document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos Globais e de Funcionários ---
    const registerEmployeeForm = document.getElementById('registerEmployeeForm');
    const employeeFormTitle = document.querySelector('#employee-management .form-container h3');
    const employeeFormSubmitButton = registerEmployeeForm ? registerEmployeeForm.querySelector('.submit-button') : null;
    let editingEmployeeId = null; // Controla o modo de edição de funcionário

    const logoutBtn = document.getElementById('logoutBtn');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item a');
    const contentSections = document.querySelectorAll('.main-content .content-section');
    const loggedInUserNameSpan = document.getElementById('loggedInUserName');
    const employeesTableBody = document.querySelector('#employeesTable tbody');
    const noEmployeesMessage = document.getElementById('noEmployeesMessage');

    // --- Elementos de Gerenciamento de Cargos ---
    const createRoleForm = document.getElementById('createRoleForm');
    const roleNameInput = document.getElementById('roleName');
    const rolesTableBody = document.querySelector('#rolesTable tbody');
    const noRolesMessage = document.getElementById('noRolesMessage');
    const newRoleSelect = document.getElementById('newRole');

    // --- Elementos de Gerenciamento de Fornecedores ---
    const supplierForm = document.getElementById('supplierForm');
    const supplierNameInput = document.getElementById('supplierName');
    const supplierContactPersonInput = document.getElementById('supplierContactPerson');
    const supplierPhoneInput = document.getElementById('supplierPhone');
    const supplierEmailInput = document.getElementById('supplierEmail');
    const suppliersTableBody = document.querySelector('#suppliersTable tbody');
    const noSuppliersMessage = document.getElementById('noSuppliersMessage');
    const supplierFormTitle = document.getElementById('supplierFormTitle');
    const saveSupplierButton = document.getElementById('saveSupplierButton');
    let editingSupplierId = null;
    const supplierCnpjCpfInput = document.getElementById('supplierCnpjCpf');
    const supplierStreetInput = document.getElementById('supplierStreet');
    const supplierNumberInput = document.getElementById('supplierNumber');
    const supplierNeighborhoodInput = document.getElementById('supplierNeighborhood');
    const supplierCityInput = document.getElementById('supplierCity');

    // --- Elementos de Gerenciamento de Estoque ---
    const stockItemForm = document.getElementById('stockItemForm');
    const stockItemNameInput = document.getElementById('stockItemName');
    const stockItemCategorySelect = document.getElementById('stockItemCategory');
    const stockItemSupplierSelect = document.getElementById('stockItemSupplier');
    const stockItemQuantityInput = document.getElementById('stockItemQuantity');
    const stockItemUnitInput = document.getElementById('stockItemUnit');
    const stockItemCostPriceInput = document.getElementById('stockItemCostPrice');
    const stockItemMinLevelInput = document.getElementById('stockItemMinLevel');
    const stockItemExpiryDateInput = document.getElementById('stockItemExpiryDate');
    const stockItemImageInput = document.getElementById('stockItemImage');
    const stockItemsGrid = document.getElementById('stockItemsGrid');
    const noStockItemsMessage = document.getElementById('noStockItemsMessage');
    let editingItemId = null;
    const stockFormTitle = document.getElementById('stockFormTitle');
    const stockFormSubmitButton = stockItemForm ? stockItemForm.querySelector('.submit-button') : null;
    
    // --- Elementos de Produtos do Cardápio ---
    const menuProductForm = document.getElementById('menuProductForm');
    const menuProductNameInput = document.getElementById('menuProductName');
    const menuProductStockItemSelect = document.getElementById('menuProductStockItem');
    const menuProductDescriptionInput = document.getElementById('menuProductDescription');
    const menuProductSalePriceInput = document.getElementById('menuProductSalePrice');
    const menuProductImageInput = document.getElementById('menuProductImage');
    const menuProductImagePreview = document.getElementById('menuProductImagePreview');
    const menuProductIsActiveCheckbox = document.getElementById('menuProductIsActive');
    const menuProductsGrid = document.getElementById('menuProductsGrid');
    const noMenuProductsMessage = document.getElementById('noMenuProductsMessage');
    const menuProductFormTitle = document.getElementById('menuProductFormTitle');
    const saveMenuProductButton = document.getElementById('saveMenuProductButton');
    let editingMenuProductId = null;
    const cargoIdForPermissionsInput = document.getElementById('cargoIdForPermissions');

    // --- Configurações da API e Autenticação ---
    const USERS_API_URL = 'http://127.0.0.1:8000/api/auth';
    const STOCK_API_URL = 'http://127.0.0.1:8000/api/stock';
    // NOVA CONSTANTE ADICIONADA
    const ORDERS_API_URL = 'http://127.0.0.1:8000/api/orders';
    const accessToken = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    const userFunction = localStorage.getItem('userFunction');
    const userPermissions = JSON.parse(localStorage.getItem('userPermissions')) || [];

        // --- NOVOS ELEMENTOS PARA CATEGORIAS DE ESTOQUE ---
    const categoryForm = document.getElementById('categoryForm');
    const categoryNameInput = document.getElementById('categoryName');
    const categoriesTableBody = document.querySelector('#categoriesTable tbody');
    const noCategoriesMessage = document.getElementById('noCategoriesMessage');

    if (!accessToken || userRole !== 'equipe') {
        alert('Acesso negado. Por favor, faça login como membro da equipe para acessar o painel de administração.');
        window.location.href = 'index.html';
        return;
    }

    if (loggedInUserNameSpan) {
        loggedInUserNameSpan.textContent = userName || userEmail;
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

    // --- FUNÇÕES DE LÓGICA DE PERMISSÃO ---

    // Função auxiliar que verifica se o usuário tem uma permissão específica.
     const hasPermission = (sectionCodename) => {
         // O Dashboard é sempre permitido. 'all' é para superusuários/admins.
        if (userPermissions.includes('all') || sectionCodename === 'dashboard') {
          return true;
       }
       // Verifica se o codename da seção está na lista de permissões do usuário.
        return userPermissions.includes(sectionCodename);
    };

     // Função que é executada quando a página carrega para esconder os menus.
     const applyRolePermissions = () => {
         if (userPermissions.includes('all')) return; // Se for admin, não esconde nada.

         navItems.forEach(link => {
             const codename = link.dataset.section || link.getAttribute('href');
            if (codename && !hasPermission(codename)) {
                 // Se o usuário não tiver a permissão, o item <li> inteiro do menu é escondido.
                link.parentElement.style.display = 'none';
        }
     });
   };

    // --- Funções Auxiliares e de Navegação ---
    // NOVA FUNÇÃO PARA CARREGAR DADOS DO DASHBOARD
    const loadDashboardData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${accessToken}` };
            
            // Faz múltiplas requisições em paralelo para otimizar o carregamento
            const [menuResponse, pendingOrdersResponse, salesReportResponse] = await Promise.all([
                fetch(`${STOCK_API_URL}/menu-products/`, { headers }),
                fetch(`${ORDERS_API_URL}/sales/active/`, { headers }),
                fetch(`${ORDERS_API_URL}/reports/sales/`, { headers })
            ]);

            // 1. Itens no Cardápio
            if (menuResponse.ok) {
                const menuProducts = await menuResponse.json();
                document.getElementById('dashboard-menu-items').textContent = menuProducts.length;
            }

            // 2. Pedidos Pendentes
            if (pendingOrdersResponse.ok) {
                const pendingOrders = await pendingOrdersResponse.json();
                document.getElementById('dashboard-pending-orders').textContent = pendingOrders.length;
            }

            // 3. Faturamento Mensal
            if (salesReportResponse.ok) {
                const salesReport = await salesReportResponse.json();
                const totalRevenue = salesReport.resumo?.faturamento_total || 0;
                document.getElementById('dashboard-monthly-revenue').textContent = `R$ ${parseFloat(totalRevenue).toFixed(2)}`;
            }
            
            // 4. Total de Clientes (Placeholder)
            // OBS: O endpoint para contar clientes ainda precisa ser criado no backend.
            // Quando existir, a lógica será parecida com as outras. Ex:
            // const clientsResponse = await fetch(`${USERS_API_URL}/clients/`, { headers });
            // if (clientsResponse.ok) { ... }

        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
            // Pode-se adicionar uma mensagem de erro no dashboard se desejar
        }
    };


    const resetEmployeeForm = () => {
        if (registerEmployeeForm) {
            registerEmployeeForm.reset();
            editingEmployeeId = null;
            if (employeeFormTitle) employeeFormTitle.textContent = 'Cadastrar Novo Membro da Equipe';
            if (employeeFormSubmitButton) employeeFormSubmitButton.textContent = 'Cadastrar Funcionário';
            
            document.getElementById('newEmail').readOnly = false;
            document.getElementById('newPassword').parentElement.style.display = 'block';
            document.getElementById('newPassword2').parentElement.style.display = 'block';
            document.getElementById('newPassword').required = true;
            document.getElementById('newPassword2').required = true;
        }
    };
    
    const showSection = (sectionId) => {
         if (!hasPermission(sectionId)) {
             alert('Você não tem permissão para acessar esta área.');
         return; // Impede que o resto da função seja executado
    }
        contentSections.forEach(section => section.classList.remove('active'));
        const activeSection = document.getElementById(sectionId);
        if (activeSection) activeSection.classList.add('active');

        navItems.forEach(item => {
            item.parentElement.classList.remove('active');
            if (item.dataset.section === sectionId) {
                item.parentElement.classList.add('active');
            }
        });

    

        // Resetar formulários e estados ao mudar de seção
        resetEmployeeForm();
        if (stockItemForm) stockItemForm.reset();
        if (supplierForm) supplierForm.reset();
        if (menuProductForm) menuProductForm.reset();
        if (createRoleForm) createRoleForm.reset();
        editingItemId = null;
        editingSupplierId = null;
        editingMenuProductId = null;

        // --- ATUALIZAÇÃO IMPORTANTE ---
        // Carregar dados da seção ativa
        if (sectionId === 'dashboard') {
            loadDashboardData(); // Carrega os dados do dashboard
        } else if (sectionId === 'employee-management') {
            loadEmployees();
            loadRolesIntoSelect();
        } else if (sectionId === 'role-management') {
            loadRoles();
        } else if (sectionId === 'supplier-management') {
            loadSuppliers();
        } else if (sectionId === 'product-management') {
            loadMenuProducts();
            loadStockItemsIntoMenuProductSelect();
        } else if (sectionId === 'stock-management') {
            loadCategories();
            loadSuppliersIntoSelect();
            loadStockItems();
        }
    };

    if (menuProductStockItemSelect && menuProductSalePriceInput) {
        menuProductStockItemSelect.addEventListener('change', (event) => {
            // Encontra o <option> que foi selecionado
            const selectedOption = event.target.options[event.target.selectedIndex];
            
            // Pega o preço sugerido do atributo data que criamos
            const suggestedPrice = selectedOption.dataset.suggestedPrice;
    
            // Se houver um preço sugerido, atualiza o campo de preço de venda
            if (suggestedPrice) {
                menuProductSalePriceInput.value = parseFloat(suggestedPrice).toFixed(2);
            }
        });
    }

    // --- Gerenciamento de Funcionários ---

    const loadEmployees = async () => {
        if (!employeesTableBody) return;
        try {
            const response = await fetch(`${USERS_API_URL}/employees/`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) throw new Error('Falha ao carregar funcionários.');
            
            const employees = await response.json();
            employeesTableBody.innerHTML = '';

            if (employees.length === 0) {
                if (noEmployeesMessage) noEmployeesMessage.classList.remove('hidden');
            } else {
                if (noEmployeesMessage) noEmployeesMessage.classList.add('hidden');
                employees.forEach(employee => {
                    const row = employeesTableBody.insertRow();
                    const formattedAddress = [employee.street, employee.number, employee.neighborhood, employee.city].filter(Boolean).join(', ');

                    row.innerHTML = `
                        <td>${employee.first_name || 'N/A'}</td>
                        <td>${employee.email}</td>
                        <td>${employee.cpf || 'N/A'}</td>
                        <td>${employee.phone || 'N/A'}</td>
                        <td>${employee.function_name || 'N/A'}</td>
                        <td>${employee.shift || 'N/A'}</td>
                        <td>R$ ${employee.salary ? parseFloat(employee.salary).toFixed(2) : '0.00'}</td>
                        <td>${employee.date_of_birth ? new Date(employee.date_of_birth + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</td>
                        <td>${employee.admission_date ? new Date(employee.admission_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</td>
                        <td>${employee.marital_status || 'N/A'}</td>
                        <td>${formattedAddress || 'N/A'}</td>
                        <td>
                            <button class="action-edit employee-edit" data-id="${employee.id}" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="action-delete employee-delete" data-id="${employee.id}" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    `;
                    row.querySelector('.employee-delete').addEventListener('click', () => deleteEmployee(employee.id));
                    row.querySelector('.employee-edit').addEventListener('click', () => prepareEditEmployee(employee.id));
                });
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Não foi possível carregar a lista de funcionários.');
        }
    };

    const prepareEditEmployee = async (employeeId) => {
        try {
            const response = await fetch(`${USERS_API_URL}/employees/${employeeId}/`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) throw new Error('Não foi possível carregar os dados do funcionário.');
            
            const employee = await response.json();

            document.getElementById('newFirstName').value = employee.first_name || '';
            document.getElementById('newEmail').value = employee.email || '';
            document.getElementById('newEmail').readOnly = true;
            document.getElementById('newCpf').value = employee.cpf || '';
            document.getElementById('newSalary').value = employee.salary || '';
            document.getElementById('newPhone').value = employee.phone || '';
            document.getElementById('newDateOfBirth').value = employee.date_of_birth || '';
            document.getElementById('newAdmissionDate').value = employee.admission_date || '';
            document.getElementById('newShift').value = employee.shift || '';
            document.getElementById('newMaritalStatus').value = employee.marital_status || '';
            document.getElementById('newRole').value = employee.function;
            document.getElementById('addressStreet').value = employee.street || '';
            document.getElementById('addressNumber').value = employee.number || '';
            document.getElementById('addressNeighborhood').value = employee.neighborhood || '';
            document.getElementById('addressCity').value = employee.city || '';
            
            editingEmployeeId = employeeId;
            if (employeeFormTitle) employeeFormTitle.textContent = 'Editar Cadastro de Funcionário';
            if (employeeFormSubmitButton) employeeFormSubmitButton.textContent = 'Atualizar Cadastro';
            
            const passwordGroup = document.getElementById('newPassword').parentElement;
            const password2Group = document.getElementById('newPassword2').parentElement;
            if (passwordGroup) passwordGroup.style.display = 'none';
            if (password2Group) password2Group.style.display = 'none';
            document.getElementById('newPassword').required = false;
            document.getElementById('newPassword2').required = false;

            registerEmployeeForm.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Erro ao preparar edição:', error);
            alert(error.message);
        }
    };

    const deleteEmployee = async (employeeId) => {
        if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;
        try {
            const response = await fetch(`${USERS_API_URL}/employees/${employeeId}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (response.status === 204) {
                alert('Funcionário excluído com sucesso!');
                loadEmployees();
            } else {
                const data = await response.json();
                alert(`Erro ao excluir funcionário: ${data.detail || 'Não foi possível excluir.'}`);
            }
        } catch (error) {
            console.error('Erro na comunicação:', error);
            alert('Não foi possível conectar ao servidor para excluir o funcionário.');
        }
    };
    
    if (registerEmployeeForm) {
        registerEmployeeForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // LÓGICA FINAL E CORRETA
            if (editingEmployeeId) {
                // --- MODO DE EDIÇÃO ---
                const firstName = document.getElementById('newFirstName').value.trim();
                const roleId = document.getElementById('newRole').value;

                if (!firstName || !roleId) {
                    alert('Os campos Nome e Cargo não podem estar vazios durante a edição.');
                    return;
                }

                const employeeData = {
                    first_name: firstName,
                    function: roleId,
                    cpf: document.getElementById('newCpf').value.trim() || null,
                    street: document.getElementById('addressStreet').value.trim() || null,
                    number: document.getElementById('addressNumber').value.trim() || null,
                    neighborhood: document.getElementById('addressNeighborhood').value.trim() || null,
                    city: document.getElementById('addressCity').value.trim() || null,
                    salary: document.getElementById('newSalary').value ? parseFloat(document.getElementById('newSalary').value) : null,
                    phone: document.getElementById('newPhone').value.trim() || null,
                    date_of_birth: document.getElementById('newDateOfBirth').value || null,
                    admission_date: document.getElementById('newAdmissionDate').value || null,
                    shift: document.getElementById('newShift').value || null,
                    marital_status: document.getElementById('newMaritalStatus').value || null,
                };
                
                try {
                    const response = await fetch(`${USERS_API_URL}/employees/${editingEmployeeId}/`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                        body: JSON.stringify(employeeData)
                    });
                    const data = await response.json();
                    if (response.ok) {
                        alert('Funcionário atualizado com sucesso!');
                        resetEmployeeForm();
                        loadEmployees();
                    } else {
                        const errorMessages = Object.values(data).flat().join('\n');
                        alert(`Erro: ${errorMessages || 'Não foi possível atualizar.'}`);
                    }
                } catch (error) {
                    console.error('Erro de comunicação:', error);
                    alert('Não foi possível conectar ao servidor.');
                }

            } else {
                // --- MODO DE CRIAÇÃO ---
                const firstName = document.getElementById('newFirstName').value.trim();
                const email = document.getElementById('newEmail').value.trim();
                const password = document.getElementById('newPassword').value;
                const password2 = document.getElementById('newPassword2').value;
                const roleId = document.getElementById('newRole').value;

                if (!firstName || !email || !password || !roleId) {
                    alert('Por favor, preencha todos os campos obrigatórios (Nome, E-mail, Senha, Cargo)!');
                    return;
                }
                if (password !== password2) {
                    alert('As senhas não conferem!');
                    return;
                }

                const employeeData = {
                    first_name: firstName,
                    email: email,
                    password: password,
                    password2: password2,
                    role: 'equipe',
                    function: roleId,
                    cpf: document.getElementById('newCpf').value.trim() || null,
                    street: document.getElementById('addressStreet').value.trim() || null,
                    number: document.getElementById('addressNumber').value.trim() || null,
                    neighborhood: document.getElementById('addressNeighborhood').value.trim() || null,
                    city: document.getElementById('addressCity').value.trim() || null,
                    salary: document.getElementById('newSalary').value ? parseFloat(document.getElementById('newSalary').value) : null,
                    phone: document.getElementById('newPhone').value.trim() || null,
                    date_of_birth: document.getElementById('newDateOfBirth').value || null,
                    admission_date: document.getElementById('newAdmissionDate').value || null,
                    shift: document.getElementById('newShift').value || null,
                    marital_status: document.getElementById('newMaritalStatus').value || null,
                };

                try {
                    const response = await fetch(`${USERS_API_URL}/register-employee/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                        body: JSON.stringify(employeeData)
                    });
                    const data = await response.json();
                    if (response.ok) {
                        alert('Funcionário cadastrado com sucesso!');
                        resetEmployeeForm();
                        loadEmployees();
                    } else {
                        const errorMessages = Object.values(data).flat().join('\n');
                        alert(`Erro: ${errorMessages || 'Não foi possível cadastrar.'}`);
                    }
                } catch (error) {
                    console.error('Erro de comunicação:', error);
                    alert('Não foi possível conectar ao servidor.');
                }
            }
        });
    }

    // --- Gerenciamento de Cargos ---

    const loadRoles = async () => {
        console.log("1. Iniciando loadRoles para carregar a tabela de cargos."); // Ponto de verificação
        if (!rolesTableBody) {
            console.error("ERRO: Elemento da tabela de cargos (rolesTableBody) não encontrado!");
            return;
        }
        try {
            const response = await fetch(`${USERS_API_URL}/roles/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar cargos da API.');
            
            const roles = await response.json();
            rolesTableBody.innerHTML = ''; // Limpa a tabela antes de adicionar novas linhas

            if (roles.length === 0) {
                if (noRolesMessage) noRolesMessage.classList.remove('hidden');
            } else {
                if (noRolesMessage) noRolesMessage.classList.add('hidden');
                
                console.log(`2. Encontrados ${roles.length} cargos. Criando linhas...`); // Ponto de verificação

                roles.forEach(role => {
                    const row = rolesTableBody.insertRow(); // Cria uma nova linha na tabela
                    row.innerHTML = `
                        <td>${role.id}</td>
                        <td>${role.name}</td>
                        <td class="actions-column">
                            <button class="action-edit role-permissions" data-id="${role.id}" data-name="${role.name}" title="Editar Permissões">
                                <i class="fas fa-shield-alt"></i>
                            </button>
                            <button class="action-delete role-delete" data-id="${role.id}" title="Excluir">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    `;

                    // --- CORREÇÃO ESSENCIAL AQUI ---
                    // Adiciona os "ouvintes" de evento aos botões DENTRO da linha que acabamos de criar.
                    const permissionsButton = row.querySelector('.role-permissions');
                    const deleteButton = row.querySelector('.role-delete');

                    if (permissionsButton) {
                        permissionsButton.addEventListener('click', () => {
                            console.log(`4. Botão de permissões clicado para o cargo: ${role.name} (ID: ${role.id})`); // Ponto de verificação
                            openPermissionsModal(role.id, role.name);
                        });
                    }

                    if (deleteButton) {
                        deleteButton.addEventListener('click', () => deleteRole(role.id));
                    }
                });
            }
            console.log("3. Tabela de cargos carregada com sucesso."); // Ponto de verificação
        } catch (error) {
            console.error('Erro detalhado em loadRoles:', error);
            alert('Não foi possível carregar a lista de cargos.');
        }
    };

    const openPermissionsModal = async (cargoId, cargoName) => {
        if (!permissionsModalOverlay) return;
        
        permissionsModalTitle.textContent = `Editar Permissões para: ${cargoName}`;
        cargoIdForPermissionsInput.value = cargoId;
        permissionsCheckboxesContainer.innerHTML = '<p>Carregando permissões...</p>';
        
        // --- CORREÇÃO PRINCIPAL AQUI ---
        // Em vez de mudar o 'display', nós adicionamos a classe '.active'
        permissionsModalOverlay.classList.add('active'); 

        try {
            const [allPermissionsResponse, cargoResponse] = await Promise.all([
                fetch(`${USERS_API_URL}/frontend-permissions/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch(`${USERS_API_URL}/roles/${cargoId}/`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
            ]);

            if (!allPermissionsResponse.ok || !cargoResponse.ok) {
                throw new Error('Falha ao carregar dados de permissões da API.');
            }

            const allPermissions = await allPermissionsResponse.json();
            const cargoData = await cargoResponse.json();
            const currentPermissionIds = new Set(cargoData.permissions.map(p => p.id));

            permissionsCheckboxesContainer.innerHTML = '';
            
            allPermissions.forEach(permission => {
                const isChecked = currentPermissionIds.has(permission.id) ? 'checked' : '';
                permissionsCheckboxesContainer.innerHTML += `
                    <div class="permission-item">
                        <input type="checkbox" id="perm-${permission.id}" name="permission" value="${permission.id}" ${isChecked}>
                        <label for="perm-${permission.id}">${permission.name}</label>
                    </div>
                `;
            });

        } catch (error) {
            console.error('Erro ao abrir ou popular o modal de permissões:', error);
            permissionsCheckboxesContainer.innerHTML = '<p style="color: red;">Erro ao carregar permissões. Tente novamente.</p>';
        }
    };

    // --- NOVA FUNÇÃO PARA FECHAR O MODAL ---
    // Adicione esta função junto com a 'openPermissionsModal'
    const closePermissionsModal = () => {
        if (permissionsModalOverlay) {
            // Remove a classe '.active' para esconder o modal com a animação de fade-out
            permissionsModalOverlay.classList.remove('active');
        }
    };

    // --- OUVINTES DE EVENTO PARA FECHAR O MODAL ---
    // Garanta que estas linhas existam no seu código, após a declaração das funções.
    if (closePermissionsModalBtn) {
        closePermissionsModalBtn.addEventListener('click', closePermissionsModal);
    }
    if (cancelPermissionsBtn) {
        cancelPermissionsBtn.addEventListener('click', closePermissionsModal);
    }

    // Também é uma boa prática fechar o modal se o usuário clicar no fundo escuro
    if (permissionsModalOverlay) {
        permissionsModalOverlay.addEventListener('click', (event) => {
            // Fecha o modal apenas se o clique foi no próprio overlay (fundo),
            // e não em um de seus filhos (a janela branca).
            if (event.target === permissionsModalOverlay) {
                closePermissionsModal();
            }
        });
    }


    // --- FORMULÁRIO DE PERMISSÕES ---
    // Garanta que, ao salvar, o modal também seja fechado.
    if (permissionsForm) {
        permissionsForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const cargoId = cargoIdForPermissionsInput.value;
            const checkedBoxes = permissionsForm.querySelectorAll('input[name="permission"]:checked');
            const permission_ids = Array.from(checkedBoxes).map(cb => cb.value);

            try {
                const response = await fetch(`${USERS_API_URL}/roles/${cargoId}/set-permissions/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({ permission_ids })
                });

                if (response.ok) {
                    alert('Permissões atualizadas com sucesso!');
                    closePermissionsModal(); // <<<--- FECHA O MODAL APÓS SALVAR
                } else {
                    const errorData = await response.json();
                    alert(`Erro ao salvar: ${errorData.error || 'Erro desconhecido.'}`);
                }
            } catch (error) {
                console.error('Erro ao salvar permissões:', error);
                alert('Erro de comunicação ao salvar permissões.');
            }
        });
    }

    const deleteRole = async (roleId) => {
        if (!confirm('Tem certeza que deseja excluir este cargo?')) return;
        try {
            const response = await fetch(`${USERS_API_URL}/roles/${roleId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.status === 204) {
                alert('Cargo excluído com sucesso!');
                loadRoles();
                loadRolesIntoSelect();
            } else {
                const data = await response.json();
                alert(`Erro ao excluir cargo: ${data.detail || 'Não foi possível excluir.'}`);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Não foi possível conectar ao servidor para excluir o cargo.');
        }
    };

    if (createRoleForm) {
        createRoleForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = roleNameInput.value.trim();
            if (!name) {
                alert('O nome do cargo é obrigatório.');
                return;
            }
            try {
                const response = await fetch(`${USERS_API_URL}/roles/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                    body: JSON.stringify({ name })
                });
                const data = await response.json();
                if (response.ok) {
                    alert('Cargo criado com sucesso!');
                    createRoleForm.reset();
                    loadRoles();
                    loadRolesIntoSelect();
                } else {
                    const errorMessages = Object.values(data).flat().join('\n');
                    alert(`Erro ao criar cargo: ${errorMessages || 'Erro desconhecido'}`);
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Não foi possível conectar para criar o cargo.');
            }
        });
    }

    const loadRolesIntoSelect = async () => {
        if (!newRoleSelect) return;
        try {
            const response = await fetch(`${USERS_API_URL}/roles/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar cargos para o formulário.');
            
            const roles = await response.json();
            const currentValue = newRoleSelect.value;
            newRoleSelect.innerHTML = '<option value="">Selecione um Cargo</option>';
            roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.name;
                newRoleSelect.appendChild(option);
            });
            if (currentValue) newRoleSelect.value = currentValue;
        } catch (error) {
            console.error('Erro:', error);
        }
    };
    // --- FIM DAS FUNÇÕES DE CARGO ---

     // --- Gerenciamento de Categorias de Estoque ---
    const loadStockCategoriesForManagement = async () => {
        if (!categoriesTableBody) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/categories/`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) throw new Error('Falha ao carregar categorias.');
            const categories = await response.json();
            categoriesTableBody.innerHTML = '';
            if (categories.length > 0) {
                if (noCategoriesMessage) noCategoriesMessage.classList.add('hidden');
                categories.forEach(category => {
                    const row = categoriesTableBody.insertRow();
                    row.innerHTML = `
                        <td>${category.name}</td>
                        <td class="actions-column">
                            <button class="action-delete category-delete" data-id="${category.id}" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    `;
                    row.querySelector('.category-delete').addEventListener('click', () => deleteCategory(category.id));
                });
            } else {
                if (noCategoriesMessage) noCategoriesMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    };

    const deleteCategory = async (categoryId) => {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/categories/${categoryId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.status === 204) {
                alert('Categoria excluída com sucesso!');
                loadStockCategoriesForManagement();
                loadCategories(); // Atualiza o dropdown no formulário de itens
            } else {
                const data = await response.json();
                alert(`Erro ao excluir categoria: ${data.detail || 'Não foi possível excluir.'}`);
            }
        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
        }
    };

    if (categoryForm) {
        categoryForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = categoryNameInput.value.trim();
            if (!name) {
                alert('O nome da categoria é obrigatório.');
                return;
            }
            try {
                const response = await fetch(`${STOCK_API_URL}/categories/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                    body: JSON.stringify({ name })
                });
                const data = await response.json();
                if (response.ok) {
                    alert('Categoria criada com sucesso!');
                    categoryForm.reset();
                    loadStockCategoriesForManagement();
                    loadCategories();
                } else {
                    const errorMessages = Object.values(data).flat().join('\n');
                    alert(`Erro ao criar categoria: ${errorMessages}`);
                }
            } catch (error) {
                console.error('Erro ao criar categoria:', error);
            }
        });
    }

    const loadCategories = async () => {
        const stockItemCategorySelect = document.getElementById('stockItemCategory');
        if (!stockItemCategorySelect) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/categories/`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) return;
            const categories = await response.json();
            const currentValue = stockItemCategorySelect.value;
            stockItemCategorySelect.innerHTML = '<option value="">Selecione a Categoria</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                stockItemCategorySelect.appendChild(option);
            });
            if (currentValue) stockItemCategorySelect.value = currentValue;
        } catch (error) {
            console.error('Erro ao carregar categorias para o dropdown:', error);
        }
    };

    const loadSuppliers = async () => {
        if (!suppliersTableBody) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/suppliers/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) {
                console.error('Erro ao carregar fornecedores:', response.statusText);
                alert('Erro ao carregar fornecedores.');
                suppliersTableBody.innerHTML = '';
                if(noSuppliersMessage) noSuppliersMessage.classList.remove('hidden');
                return;
            }
            const suppliers = await response.json();
            suppliersTableBody.innerHTML = '';
            if (suppliers.length === 0) {
                if(noSuppliersMessage) noSuppliersMessage.classList.remove('hidden');
            } else {
                if(noSuppliersMessage) noSuppliersMessage.classList.add('hidden');
                suppliers.forEach(supplier => {
                    const row = suppliersTableBody.insertRow();
                    row.innerHTML = `
                        <td>${supplier.name}</td>
                        <td>${supplier.cnpj_cpf || 'N/A'}</td
                        <td>${supplier.contact_person || 'N/A'}</td>
                        <td>${supplier.phone || 'N/A'}</td>
                        <td>${supplier.email || 'N/A'}</td>
                        <td>${supplier.city || 'N/A'}</td>
                        <td>${(supplier.street && supplier.number) ? `${supplier.street}, ${supplier.number}` : 'N/A'}</td>
                        <td>
                            <button class="action-edit supplier-edit" data-id="${supplier.id}"><i class="fas fa-edit"></i></button>
                            <button class="action-delete supplier-delete" data-id="${supplier.id}"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    `;
                    row.querySelector('.supplier-edit').addEventListener('click', () => editSupplier(supplier.id));
                    row.querySelector('.supplier-delete').addEventListener('click', () => deleteSupplier(supplier.id));
                });
            }
        } catch (error) {
            console.error('Erro na comunicação ao carregar fornecedores:', error);
            alert('Não foi possível conectar para carregar fornecedores.');
            if(suppliersTableBody) suppliersTableBody.innerHTML = '';
            if(noSuppliersMessage) noSuppliersMessage.classList.remove('hidden');
        }
    };
    
    const deleteSupplier = async (supplierId) => {
        if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/suppliers/${supplierId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.status === 204) {
                alert('Fornecedor excluído com sucesso!');
                loadSuppliers();
                loadSuppliersIntoSelect();
            } else {
                 const data = await response.json();
                alert(`Erro ao excluir fornecedor: ${data.detail || response.statusText}`);
            }
        } catch (error) {
            console.error('Erro na comunicação ao excluir fornecedor:', error);
            alert('Não foi possível conectar para excluir o fornecedor.');
        }
    };

    const editSupplier = async (supplierId) => {
        if (!supplierForm || !supplierNameInput || !supplierCnpjCpfInput || !supplierContactPersonInput || !supplierPhoneInput || !supplierEmailInput) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/suppliers/${supplierId}/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) {
                const data = await response.json();
                alert(`Erro ao carregar dados do fornecedor: ${data.detail || response.statusText}`);
                return;
            }
            const supplier = await response.json();
            supplierNameInput.value = supplier.name;
            supplierCnpjCpfInput.value = supplier.cnpj_cpf || '';
            supplierContactPersonInput.value = supplier.contact_person || '';
            supplierPhoneInput.value = supplier.phone || '';
            supplierEmailInput.value = supplier.email || '';
            supplierStreetInput.value = supplier.street || '';
            supplierNumberInput.value = supplier.number || '';
            supplierNeighborhoodInput.value = supplier.neighborhood || '';
            supplierCityInput.value = supplier.city || '';
            editingSupplierId = supplier.id;
            if(supplierFormTitle) supplierFormTitle.textContent = 'Editar Fornecedor';
            if(saveSupplierButton) saveSupplierButton.textContent = 'Atualizar Fornecedor';
            supplierForm.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Erro ao buscar fornecedor para edição:', error);
            alert('Não foi possível conectar para carregar dados do fornecedor.');
        }
    };
    
    if (supplierForm) {
        supplierForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = supplierNameInput.value.trim();
            const cnpj_cpf = supplierCnpjCpfInput.value.trim();
            const contact_person = supplierContactPersonInput.value.trim();
            const phone = supplierPhoneInput.value.trim();
            const email = supplierEmailInput.value.trim();
            const street = supplierStreetInput.value.trim();
            const number = supplierNumberInput.value.trim();
            const neighborhood = supplierNeighborhoodInput.value.trim();
            const city = supplierCityInput.value.trim();
            if (!name) {
                alert('O nome do fornecedor é obrigatório.'); return;
            }
            const body = { name, cnpj_cpf: cnpj_cpf || null, contact_person: contact_person || null, phone: phone || null, email: email || null, street: street || null, number: number || null, neighborhood: neighborhood || null, city: city || null };
            let url = `${STOCK_API_URL}/suppliers/`;
            let method = 'POST';
            if (editingSupplierId) {
                url = `${STOCK_API_URL}/suppliers/${editingSupplierId}/`;
                method = 'PATCH'; 
            }
            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                if (response.ok) {
                    alert(`Fornecedor ${editingSupplierId ? 'atualizado' : 'salvo'} com sucesso!`);
                    supplierForm.reset();
                    editingSupplierId = null;
                    if(supplierFormTitle) supplierFormTitle.textContent = 'Adicionar Novo Fornecedor';
                    if(saveSupplierButton) saveSupplierButton.textContent = 'Salvar Fornecedor';
                    loadSuppliers();
                    loadSuppliersIntoSelect(); 
                } else {
                    const errorMessages = Object.values(data).flat().join('\n');
                    alert(`Erro ao ${editingSupplierId ? 'atualizar' : 'salvar'} fornecedor: ${errorMessages || 'Erro desconhecido'}`);
                }
            } catch (error) {
                console.error(`Erro na comunicação ao ${editingSupplierId ? 'atualizar' : 'salvar'} fornecedor:`, error);
                alert(`Não foi possível conectar para ${editingSupplierId ? 'atualizar' : 'salvar'} o fornecedor.`);
            }
        });
    }

    const loadSuppliersIntoSelect = async () => {
        if (!stockItemSupplierSelect) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/suppliers/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) {
                console.error('Erro ao carregar fornecedores para o select:', response.statusText); return;
            }
            const suppliers = await response.json();
            const currentValue = stockItemSupplierSelect.value; 
            stockItemSupplierSelect.innerHTML = '<option value="">Selecione o Fornecedor</option>';
            suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.id;
                option.textContent = supplier.name;
                stockItemSupplierSelect.appendChild(option);
            });
            if(currentValue) stockItemSupplierSelect.value = currentValue;
        } catch(error) {
            console.error('Erro na comunicação ao carregar fornecedores para o select:', error);
        }
    };

    const loadStockItems = async () => {
        if (!stockItemsGrid) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/items/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) {
                console.error('Erro ao carregar itens de estoque:', response.statusText);
                stockItemsGrid.innerHTML = '';
                if(noStockItemsMessage) noStockItemsMessage.classList.remove('hidden');
                return;
            }
            const items = await response.json();
            stockItemsGrid.innerHTML = '';
            if (items.length === 0) {
                if(noStockItemsMessage) noStockItemsMessage.classList.remove('hidden');
            } else {
                if(noStockItemsMessage) noStockItemsMessage.classList.add('hidden');
                items.forEach(item => {
                    const card = document.createElement('div');
                    card.classList.add('stock-item-card');
                    let statusTagsHtml = '';
                    if (item.is_expired) {
                        card.classList.add('expired');
                        statusTagsHtml += `<span class="status-tag expired-tag"><i class="fas fa-exclamation-triangle"></i> Vencido</span>`;
                    }
                    if (item.is_below_minimum_stock) {
                        card.classList.add('low-stock');
                        statusTagsHtml += `<span class="status-tag low-stock-tag"><i class="fas fa-arrow-down"></i> Estoque Baixo</span>`;
                    }
                    const imageUrl = item.image ? item.image : './placeholder.png';
                    const expiryDateFormatted = item.expiry_date ? new Date(item.expiry_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
                    card.innerHTML = `
                        <div class="card-actions">
                            <button class="action-edit stock-edit" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                            <button class="action-delete stock-delete" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
                        </div>
                        <img src="${imageUrl}" alt="${item.name}" loading="lazy">
                        <h4>${item.name}</h4>
                        <div class="status-tags">${statusTagsHtml}</div>
                        <span class="category-tag">${item.category_name || 'Sem Categoria'}</span>
                        <div class="stock-details">
                            <div class="detail-item"><span class="detail-label">Fornecedor:</span> ${item.supplier_name || 'N/A'}</div>
                            <div class="detail-item"><span class="detail-label">Qtd:</span> ${item.quantity} ${item.unit_of_measure}</div>
                            <div class="detail-item"><span class="detail-label">Custo:</span> R$ ${item.cost_price ? parseFloat(item.cost_price).toFixed(2) : '0.00'}</div>
                            <div class="detail-item"><span class="detail-label">Est. Mín:</span> ${item.minimum_stock_level || '0.00'}</div>
                            <div class="detail-item"><span class="detail-label">Validade:</span> ${expiryDateFormatted}</div>
                            <div class="detail-item full-width"><span class="detail-label">Últ. Atual:</span> ${new Date(item.last_updated).toLocaleString()}</div>
                        </div>
                    `;
                    stockItemsGrid.appendChild(card);
                    card.querySelector('.stock-delete').addEventListener('click', () => deleteStockItem(item.id));
                    card.querySelector('.stock-edit').addEventListener('click', () => editStockItem(item.id));
                });
            }
        } catch (error) {
            console.error('Erro na comunicação ao carregar itens de estoque:', error);
            alert('Não foi possível conectar para carregar o estoque.');
            if(stockItemsGrid) stockItemsGrid.innerHTML = '';
            if(noStockItemsMessage) noStockItemsMessage.classList.remove('hidden');
        }
    };

    const deleteStockItem = async (itemId) => {
        if (!confirm('Tem certeza que deseja excluir este item do estoque?')) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/items/${itemId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.status === 204) {
                alert('Item excluído do estoque com sucesso!');
                loadStockItems();
            } else {
                const data = await response.json();
                alert(`Erro ao excluir item: ${data.message || data.detail || response.statusText}`);
            }
        } catch (error) {
            console.error('Erro na comunicação ao excluir item do estoque:', error);
            alert('Não foi possível conectar para excluir o item.');
        }
    };

    const editStockItem = async (itemId) => {
        if (!stockItemForm) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/items/${itemId}/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) {
                const data = await response.json();
                alert(`Erro ao carregar dados do item para edição: ${data.detail || 'Erro desconhecido'}`);
                return;
            }
            const item = await response.json();
            stockItemNameInput.value = item.name;
            stockItemCategorySelect.value = item.category || '';
            stockItemSupplierSelect.value = item.supplier || ''; 
            stockItemQuantityInput.value = item.quantity;
            stockItemUnitInput.value = item.unit_of_measure;
            stockItemCostPriceInput.value = item.cost_price || '';
            document.getElementById('stockItemProfitPercentage').value = item.profit_percentage || '100.00';
            stockItemMinLevelInput.value = item.minimum_stock_level || '';
            stockItemExpiryDateInput.value = item.expiry_date || '';
            editingItemId = item.id;
            if (stockFormTitle) stockFormTitle.textContent = 'Editar Item de Estoque';
            if (stockFormSubmitButton) stockFormSubmitButton.textContent = 'Atualizar Item';
            stockItemForm.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Erro ao buscar item para edição:', error);
            alert('Não foi possível conectar para carregar dados do item.');
        }
    };

    // --- FUNÇÕES PARA GERENCIAR PRODUTOS DO CARDÁPIO ---
    const loadStockItemsIntoMenuProductSelect = async () => {
        if (!menuProductStockItemSelect) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/items/`, { // Reutiliza o endpoint de itens de estoque
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) {
                console.error('Erro ao carregar itens de estoque para o select de produtos:', response.statusText);
                return;
            }
            const stockItems = await response.json();
            const currentValue = menuProductStockItemSelect.value;
            menuProductStockItemSelect.innerHTML = '<option value="">Selecione o Item de Estoque...</option>';
            
            stockItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                // Exibe nome e quantidade atual para ajudar na seleção
                option.textContent = `${item.name} (Estoque: ${item.quantity} ${item.unit_of_measure})`;

                // --- ALTERAÇÃO PRINCIPAL AQUI ---
                // Se o item tiver um preço de venda sugerido, armazena-o no atributo 'data-suggested-price'
                if (item.suggested_sale_price) {
                    option.dataset.suggestedPrice = item.suggested_sale_price;
                }
                // --- FIM DA ALTERAÇÃO ---

                menuProductStockItemSelect.appendChild(option);
            });

            if (currentValue) menuProductStockItemSelect.value = currentValue;

        } catch (error) {
            console.error('Erro na comunicação ao carregar itens de estoque para o select:', error);
        }
    };

    const loadMenuProducts = async () => {
        if (!menuProductsGrid) return; 
        try {
            const response = await fetch(`${STOCK_API_URL}/menu-products/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) {
                console.error('Erro ao carregar produtos do cardápio:', response.statusText);
                alert('Erro ao carregar produtos do cardápio.');
                menuProductsGrid.innerHTML = ''; 
                if(noMenuProductsMessage) noMenuProductsMessage.classList.remove('hidden');
                return;
            }
            const menuProducts = await response.json();
            menuProductsGrid.innerHTML = ''; 

            if (menuProducts.length === 0) {
                if(noMenuProductsMessage) noMenuProductsMessage.classList.remove('hidden');
            } else {
                if(noMenuProductsMessage) noMenuProductsMessage.classList.add('hidden');
                menuProducts.forEach(product => {
                    const card = document.createElement('div');
                    card.classList.add('menu-product-card'); 
                    if (!product.is_active) {
                        card.classList.add('inactive-menu-product'); 
                    }

                    const imageUrl = product.image_url || product.stock_item_image_url || './placeholder.png';
                    const statusText = product.is_active ? 'Ativo' : 'Inativo';
                    const statusClass = product.is_active ? 'status-active-tag' : 'status-inactive-tag';

                    let descriptionHtml = '<p class="menu-product-description"><em>Sem descrição.</em></p>';
                    if (product.description && typeof product.description === 'string' && product.description.trim() !== '') {
                        let descText = product.description.substring(0, 70);
                        if (product.description.length > 70) {
                            descText += '...';
                        }
                        descriptionHtml = `<p class="menu-product-description">${descText}</p>`;
                    }

                    card.innerHTML = `
                        <div class="card-actions">
                            <button class="action-edit menu-product-edit" data-id="${product.id}" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="action-delete menu-product-delete" data-id="${product.id}" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                            <button class="action-toggle-active menu-product-toggle" data-id="${product.id}" data-active="${product.is_active}" title="${product.is_active ? 'Desativar' : 'Ativar'}">
                                ${product.is_active ? '<i class="fas fa-toggle-off"></i>' : '<i class="fas fa-toggle-on"></i>'}
                            </button>
                        </div>
                        <img src="${imageUrl}" alt="${product.name}" class="menu-product-card-img" loading="lazy">
                        <h4>${product.name}</h4>
                        <span class="menu-product-price">R$ ${parseFloat(product.sale_price).toFixed(2)}</span>
                        <p class="menu-product-stock-item">Base: ${product.stock_item_name || 'N/A'}</p>
                        ${descriptionHtml}
                        <div class="menu-product-status">
                            <span class="status-tag ${statusClass}">${statusText}</span>
                        </div>
                    `;
                    menuProductsGrid.appendChild(card);

                    card.querySelector('.menu-product-edit').addEventListener('click', () => editMenuProduct(product.id));
                    card.querySelector('.menu-product-delete').addEventListener('click', () => deleteMenuProduct(product.id));
                    card.querySelector('.menu-product-toggle').addEventListener('click', () => toggleMenuProductActive(product.id, product.is_active));
                });
            }
        } catch (error) {
            console.error('Erro na comunicação ao carregar produtos do cardápio:', error);
            alert('Não foi possível conectar para carregar os produtos do cardápio.');
            if(menuProductsGrid) menuProductsGrid.innerHTML = '';
            if(noMenuProductsMessage) noMenuProductsMessage.classList.remove('hidden');
        }
    };

    const editMenuProduct = async (productId) => {
        if (!menuProductForm) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/menu-products/${productId}/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) {
                const data = await response.json();
                alert(`Erro ao carregar produto para edição: ${data.detail || 'Erro desconhecido'}`);
                return;
            }
            
            const product = await response.json();
            menuProductNameInput.value = product.name;
            await loadStockItemsIntoMenuProductSelect(); 
            menuProductStockItemSelect.value = product.stock_item;
            menuProductDescriptionInput.value = product.description || '';
            menuProductSalePriceInput.value = product.sale_price;
            menuProductIsActiveCheckbox.checked = product.is_active;
            
            if (menuProductImagePreview) {
                menuProductImagePreview.src = product.image_url || product.stock_item_image_url || "#";
                if (product.image_url || product.stock_item_image_url) {
                    menuProductImagePreview.classList.remove('hidden');
                } else {
                    menuProductImagePreview.classList.add('hidden');
                }
            }
            menuProductImageInput.value = '';

            editingMenuProductId = product.id;
            if (menuProductFormTitle) menuProductFormTitle.textContent = 'Editar Produto do Cardápio';
            if (saveMenuProductButton) saveMenuProductButton.textContent = 'Atualizar Produto';
            menuProductForm.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Erro ao buscar produto do cardápio para edição:', error);
            alert('Erro ao carregar produto para edição. Tente novamente.');
        }
    };

    const deleteMenuProduct = async (productId) => {
        if (!confirm('Tem certeza que deseja excluir este produto do cardápio?')) return;
        try {
            const response = await fetch(`${STOCK_API_URL}/menu-products/${productId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.status === 204) {
                alert('Produto do cardápio excluído com sucesso!');
                loadMenuProducts();
            } else {
                const data = await response.json();
                alert(`Erro ao excluir produto: ${data.detail || 'Erro desconhecido.'}`);
            }
        } catch (error) {
            console.error('Erro na comunicação ao excluir produto:', error);
            alert('Não foi possível conectar para excluir o produto.');
        }
    };

    const toggleMenuProductActive = async (productId, currentIsActive) => {
        const newActiveState = !currentIsActive;
        const actionText = newActiveState ? "ativar" : "desativar";
        if (!confirm(`Tem certeza que deseja ${actionText} este produto do cardápio?`)) return;

        try {
            const response = await fetch(`${STOCK_API_URL}/menu-products/${productId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ is_active: newActiveState })
            });

            if (response.ok) {
                alert(`Produto do cardápio ${actionText} com sucesso!`);
                loadMenuProducts();
            } else {
                const data = await response.json();
                alert(`Erro ao ${actionText} produto: ${data.detail || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error(`Erro na comunicação ao ${actionText} produto:`, error);
            alert('Não foi possível conectar ao servidor.');
        }
    };

    if (menuProductForm) {
        menuProductForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const name = menuProductNameInput.value.trim();
            const stock_item = menuProductStockItemSelect.value;
            const description = menuProductDescriptionInput.value.trim();
            const sale_price = menuProductSalePriceInput.value;
            const imageFile = menuProductImageInput.files[0];
            const is_active = menuProductIsActiveCheckbox.checked;

            if (!name || !stock_item || !sale_price) {
                alert('Nome no Cardápio, Item de Estoque de Origem e Preço de Venda são obrigatórios.');
                return;
            }
            if (isNaN(parseFloat(sale_price)) || parseFloat(sale_price) <= 0) {
                alert('Preço de Venda deve ser um número positivo.');
                return;
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('stock_item', stock_item); 
            if (description) formData.append('description', description);
            formData.append('sale_price', parseFloat(sale_price));
            formData.append('is_active', is_active);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            let method = 'POST';
            let url = `${STOCK_API_URL}/menu-products/`;

            if (editingMenuProductId) {
                method = 'PATCH';
                url = `${STOCK_API_URL}/menu-products/${editingMenuProductId}/`;
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    body: formData
                });
                const data = await response.json();
                if (response.ok) {
                    alert(`Produto do cardápio ${editingMenuProductId ? 'atualizado' : 'salvo'} com sucesso!`);
                    menuProductForm.reset();
                    if(menuProductImagePreview) {
                        menuProductImagePreview.src = "#";
                        menuProductImagePreview.classList.add('hidden');
                    }
                    editingMenuProductId = null;
                    if (menuProductFormTitle) menuProductFormTitle.textContent = 'Adicionar Novo Produto ao Cardápio';
                    if (saveMenuProductButton) saveMenuProductButton.textContent = 'Salvar Produto';
                    loadMenuProducts();
                } else {
                    const errorMessages = Object.values(data).flat().join('\n');
                    alert(`Erro ao ${editingMenuProductId ? 'atualizar' : 'salvar'} produto: ${errorMessages || 'Erro desconhecido'}`);
                }
            } catch (error) {
                console.error('Erro na comunicação ao salvar/atualizar produto:', error);
                alert('Não foi possível conectar ao servidor para salvar/atualizar o produto.');
            }
        });
    }
    
    if (menuProductImageInput && menuProductImagePreview) {
        menuProductImageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    menuProductImagePreview.src = e.target.result;
                    menuProductImagePreview.classList.remove('hidden');
                }
                reader.readAsDataURL(file);
            } else {
                menuProductImagePreview.src = "#";
                menuProductImagePreview.classList.add('hidden');
            }
        });
    }

    applyRolePermissions();
    // Inicializa a primeira seção visível (o Dashboard)
    showSection('dashboard');

    if (stockItemForm) {
        stockItemForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = stockItemNameInput.value.trim();
            const category = stockItemCategorySelect.value;
            const supplier = stockItemSupplierSelect.value;
            const quantity = stockItemQuantityInput.value;
            const unit_of_measure = stockItemUnitInput.value;
            const cost_price = stockItemCostPriceInput.value;
            const minimum_stock_level = stockItemMinLevelInput.value;
            const expiry_date = stockItemExpiryDateInput.value;
            const imageFile = stockItemImageInput.files[0];

            if (!name || !category || !supplier || !quantity || !unit_of_measure) {
                alert('Por favor, preencha todos os campos obrigatórios (Nome, Categoria, Fornecedor, Quantidade, Unidade)!');
                return;
            }
            if (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) {
                alert('Quantidade deve ser um número válido e não negativo.'); return;
            }
            if (cost_price && (isNaN(parseFloat(cost_price)) || parseFloat(cost_price) < 0)) {
                alert('Preço de custo deve ser um número válido e não negativo.'); return;
            }
            if (minimum_stock_level && (isNaN(parseFloat(minimum_stock_level)) || parseFloat(minimum_stock_level) < 0)) {
                alert('Estoque mínimo deve ser um número válido e não negativo.'); return;
            }
            const formData = new FormData();
            formData.append('name', name);
            formData.append('category', category);
            formData.append('supplier', supplier);
            formData.append('quantity', parseFloat(quantity));
            formData.append('unit_of_measure', unit_of_measure);
            if (cost_price) formData.append('cost_price', parseFloat(cost_price));
            formData.append('profit_percentage', document.getElementById('stockItemProfitPercentage').value);
            if (minimum_stock_level) formData.append('minimum_stock_level', parseFloat(minimum_stock_level));
            if (expiry_date) formData.append('expiry_date', expiry_date);
            if (imageFile) formData.append('image', imageFile);
            let method = 'POST';
            let url = `${STOCK_API_URL}/items/`;
            if (editingItemId) {
                method = 'PATCH';
                url = `${STOCK_API_URL}/items/${editingItemId}/`;
            }
            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    body: formData
                });
                const data = await response.json();
                if (response.ok) {
                    alert(`Item de estoque ${editingItemId ? 'atualizado' : 'salvo'} com sucesso!`);
                    stockItemForm.reset();
                    editingItemId = null;
                    if (stockFormTitle) stockFormTitle.textContent = 'Adicionar Novo Item ao Estoque';
                    if (stockFormSubmitButton) stockFormSubmitButton.textContent = 'Salvar Item';
                    loadStockItems();
                } else {
                    const errorMessages = Object.values(data).flat().join('\n');
                    alert(`Erro ao ${editingItemId ? 'atualizar' : 'salvar'} item de estoque: ${errorMessages || 'Erro desconhecido'}`);
                }
            } catch (error) {
                console.error('Erro na comunicação ao salvar/atualizar item de estoque:', error);
                alert('Não foi possível conectar para salvar/atualizar o item de estoque.');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            alert('Saindo do painel de controle...');
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
    navItems.forEach(item => {
        item.addEventListener('click', (event) => {
            // Pega o atributo 'data-section' do link clicado
            const sectionId = event.currentTarget.dataset.section;

            // Se o link tiver o atributo 'data-section', ele é um link interno
            // da página admin.html.
            if (sectionId) {
                // Impede a navegação padrão para que possamos mostrar a seção com JavaScript.
                event.preventDefault();
                showSection(sectionId);
            }
            
            // Se o link NÃO tiver 'data-section' (como o link para pedidos.html),
            // o JavaScript não faz nada, permitindo que o navegador siga o 'href'
            // e vá para a nova página normalmente.
        });
    });
});