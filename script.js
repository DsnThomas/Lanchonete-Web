document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const registerForm = document.getElementById('registerForm');
    const regFirstNameInput = document.getElementById('reg-first-name');
    const regEmailInput = document.getElementById('reg-email');
    const regPasswordInput = document.getElementById('reg-password');
    const regPassword2Input = document.getElementById('reg-password2');
    const requestPasswordResetForm = document.getElementById('requestPasswordResetForm');
    const resetEmailInput = document.getElementById('resetEmail');
    const confirmPasswordResetForm = document.getElementById('confirmPasswordResetForm');
    const emailForConfirmResetInput = document.getElementById('emailForConfirmReset');
    const resetCodeInput = document.getElementById('resetCode');
    const newResetPasswordInput = document.getElementById('newResetPassword');
    const confirmNewResetPasswordInput = document.getElementById('confirmNewResetPassword');
    const funcionarioBtn = document.getElementById('btn-funcionario');
    const clienteBtn = document.getElementById('btn-cliente');
    const toggleToRegisterLink = document.getElementById('toggleToRegister');
    const toggleToLoginLink = document.getElementById('toggleToLogin');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
    const backToLoginFromRequestLink = document.getElementById('backToLoginFromRequest');
    const backToLoginFromConfirmLink = document.getElementById('backToLoginFromConfirm');
    const toggleEmployeeOption = document.getElementById('toggleEmployeeOption');
    const employeeRoleContainer = document.getElementById('employee-role-container');
    const roleSelectionContainer = document.getElementById('roleSelection');

    const API_URL = 'http://localhost:8000/api/auth';
    let currentSelectedRole = 'estudante';

    const activateButton = (buttonToActivate, buttonToDeactivate, role) => {
        if (buttonToActivate && buttonToDeactivate) {
            buttonToActivate.classList.add('active');
            buttonToDeactivate.classList.remove('active');
        }
        currentSelectedRole = role;
    };

    const showAuthForm = (formIdToShow) => {
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        requestPasswordResetForm.classList.add('hidden');
        confirmPasswordResetForm.classList.add('hidden');
        toggleToRegisterLink.classList.add('hidden');
        toggleToLoginLink.classList.add('hidden');
        if (forgotPasswordContainer) forgotPasswordContainer.classList.add('hidden');

        const formToShow = document.getElementById(formIdToShow);
        if (formToShow) {
            formToShow.classList.remove('hidden');
        }

        if (formIdToShow === 'loginForm') {
            toggleToRegisterLink.classList.remove('hidden');
            if (forgotPasswordContainer) forgotPasswordContainer.classList.remove('hidden');
            if (roleSelectionContainer) roleSelectionContainer.classList.remove('hidden');
            if (employeeRoleContainer && employeeRoleContainer.classList.contains('hidden')) {
                if (toggleEmployeeOption) toggleEmployeeOption.classList.remove('hidden');
            } else {
                if (toggleEmployeeOption) toggleEmployeeOption.classList.add('hidden');
            }
            activateButton(clienteBtn, funcionarioBtn, 'estudante');
        } else if (formIdToShow === 'registerForm') {
            toggleToLoginLink.classList.remove('hidden');
            if (roleSelectionContainer) roleSelectionContainer.classList.add('hidden');
            if (toggleEmployeeOption) toggleEmployeeOption.classList.add('hidden');
            if (employeeRoleContainer) employeeRoleContainer.classList.add('hidden');
        } else if (formIdToShow === 'requestPasswordResetForm' || formIdToShow === 'confirmPasswordResetForm') {
            if (roleSelectionContainer) roleSelectionContainer.classList.add('hidden');
            if (toggleEmployeeOption) toggleEmployeeOption.classList.add('hidden');
            if (employeeRoleContainer) employeeRoleContainer.classList.add('hidden');
        }
    };

    if (clienteBtn && funcionarioBtn) {
        activateButton(clienteBtn, funcionarioBtn, 'estudante');
    }
    showAuthForm('loginForm');

    if (toggleEmployeeOption) {
        toggleEmployeeOption.addEventListener('click', (event) => {
            event.preventDefault();
            if (employeeRoleContainer) employeeRoleContainer.classList.remove('hidden');
            toggleEmployeeOption.classList.add('hidden');
            activateButton(funcionarioBtn, clienteBtn, 'equipe');
        });
    }

    if (funcionarioBtn) {
        funcionarioBtn.addEventListener('click', () => activateButton(funcionarioBtn, clienteBtn, 'equipe'));
    }

    if (clienteBtn) {
        clienteBtn.addEventListener('click', () => activateButton(clienteBtn, funcionarioBtn, 'estudante'));
    }

    if (toggleToRegisterLink.querySelector('a')) {
        toggleToRegisterLink.querySelector('a').addEventListener('click', (event) => {
            event.preventDefault();
            showAuthForm('registerForm');
        });
    }
    
    if (toggleToLoginLink.querySelector('a')) {
        toggleToLoginLink.querySelector('a').addEventListener('click', (event) => {
            event.preventDefault();
            showAuthForm('loginForm');
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (event) => {
            event.preventDefault();
            showAuthForm('requestPasswordResetForm');
        });
    }

    if (backToLoginFromRequestLink) {
        backToLoginFromRequestLink.addEventListener('click', (event) => {
            event.preventDefault();
            showAuthForm('loginForm');
        });
    }

    if (backToLoginFromConfirmLink) {
        backToLoginFromConfirmLink.addEventListener('click', (event) => {
            event.preventDefault();
            showAuthForm('loginForm');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            const role = currentSelectedRole;

            if (email === '' || password === '') {
                alert('Por favor, preencha todos os campos!');
                return;
            }
            const formData = { email, password, role };
            try {
                const loginResponse = await fetch(`${API_URL}/login/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const loginData = await loginResponse.json();
                if (loginResponse.ok) {
                    if (loginData.access_token) {
                        localStorage.setItem('accessToken', loginData.access_token);
                        localStorage.setItem('refreshToken', loginData.refresh_token);
                        localStorage.setItem('userRole', loginData.user.role);
                        localStorage.setItem('userEmail', loginData.user.email);
                        localStorage.setItem('userName', loginData.user.first_name || loginData.user.username);
                        localStorage.setItem('userFunction', loginData.user.function_name);
                        localStorage.setItem('userPermissions', JSON.stringify(loginData.user.permissions || []));
                    }
                    
                    // --- ALTERAÇÃO PRINCIPAL AQUI ---
                    if (loginData.user.role === 'estudante') {
                        // Redireciona para a página principal do cardápio
                        window.location.href = 'cardapio.html'; 
                    } else if (loginData.user.role === 'equipe' || loginData.user.role === 'admin') {
                        // Redireciona para o painel administrativo
                        window.location.href = 'admin.html';
                    }
                } else {
                    alert(`Erro ao tentar login: ${loginData.detail || loginData.message || 'Verifique suas credenciais e função.'}`);
                }
            } catch (error) {
                console.error('Erro na comunicação com o servidor (login):', error);
                alert('Não foi possível conectar ao servidor para login.');
            }
        });
    }

    // --- Lógica de Envio do Formulário de Registro (existente) ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const firstName = regFirstNameInput.value;
            const email = regEmailInput.value;
            const password = regPasswordInput.value;
            const password2 = regPassword2Input.value;
            const role = 'estudante';

            if (firstName === '' || email === '' || password === '' || password2 === '') {
                alert('Por favor, preencha todos os campos para registro!');
                return;
            }
            if (password !== password2) {
                alert('As senhas não conferem!');
                return;
            }
            if (!email.endsWith('@unifucamp.edu.br')) {
                alert('Por favor, utilize um e-mail com o domínio @unifucamp.edu.br para o registro.');
                return;
            }

            const formData = { first_name: firstName, email, password, password2, role };
            try {
                const registerResponse = await fetch(`${API_URL}/register/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const registerData = await registerResponse.json();
                if (registerResponse.ok) {
                    alert(registerData.message || 'Registro bem-sucedido! Faça o login.');
                    registerForm.reset();
                    showAuthForm('loginForm'); // Mostra o formulário de login após registro
                } else {
                    const errorMessages = Object.values(registerData).flat().join('\n');
                    alert(`Erro ao registrar: ${errorMessages || 'Erro desconhecido'}`);
                }
            } catch (error) {
                console.error('Erro na comunicação com o servidor (registro):', error);
                alert('Não foi possível realizar o registro.');
            }
        });
    }

    // --- NOVOS EVENT LISTENERS PARA OS FORMULÁRIOS DE REDEFINIÇÃO DE SENHA ---
    if (requestPasswordResetForm) {
        requestPasswordResetForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = resetEmailInput.value.trim();
            if (!email) {
                alert('Por favor, insira seu endereço de e-mail.');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/password-reset/request/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message || 'Se o e-mail estiver cadastrado, você receberá um código de redefinição.');
                    emailForPasswordReset = email; // Salva o email para a próxima etapa
                    if(emailForConfirmResetInput) emailForConfirmResetInput.value = email; // Coloca no campo oculto
                    showAuthForm('confirmPasswordResetForm');
                } else {
                    alert(`Erro: ${data.detail || data.email || data.message || 'Não foi possível solicitar a redefinição.'}`);
                }
            } catch (error) {
                console.error('Erro ao solicitar redefinição de senha:', error);
                alert('Ocorreu um erro de comunicação. Tente novamente.');
            }
        });
    }

    if (confirmPasswordResetForm) {
        confirmPasswordResetForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const code = resetCodeInput.value.trim();
            const newPassword = newResetPasswordInput.value;
            const confirmNewPassword = confirmNewResetPasswordInput.value;
            // Pega o email do campo oculto ou da variável global
            const email = emailForConfirmResetInput.value || emailForPasswordReset; 

            if (!email || !code || !newPassword || !confirmNewPassword) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                alert('As novas senhas não conferem.');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/password-reset/confirm/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email,
                        code: code,
                        password: newPassword,
                        password2: confirmNewPassword
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message || 'Senha redefinida com sucesso! Você já pode fazer login.');
                    confirmPasswordResetForm.reset();
                    resetEmailInput.value = ''; // Limpa o email da etapa anterior também
                    emailForPasswordReset = '';
                    showAuthForm('loginForm');
                } else {
                    const errorMessages = Object.values(data).flat().join('\n');
                    alert(`Erro ao redefinir senha: ${errorMessages || 'Código inválido, expirado ou e-mail não corresponde.'}`);
                }
            } catch (error) {
                console.error('Erro ao confirmar redefinição de senha:', error);
                alert('Ocorreu um erro de comunicação ao redefinir a senha. Tente novamente.');
            }
        });
    }
});