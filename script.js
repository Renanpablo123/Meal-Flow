// Espera o DOM carregar completamente para garantir que os elementos existam
document.addEventListener('DOMContentLoaded', function() {

    // Seleciona a seção que contém todos os cards de pedido
    const filaPedidos = document.getElementById('fila-pedidos');

    // --- Validação de Senhas (Página de Cadastro de Usuário) ---
    // Verifica se estamos na página que tem o campo de repetir senha
    const senhaInput = document.getElementById('senha');
    const repetirSenhaInput = document.getElementById('repetir_senha');
    
    if (senhaInput && repetirSenhaInput) {
        const formCadastro = senhaInput.closest('form');
        formCadastro.addEventListener('submit', function(event) {
            if (senhaInput.value !== repetirSenhaInput.value) {
                event.preventDefault(); // Impede o envio do formulário
                alert("❌ Erro: As senhas não coincidem. Por favor, verifique.");
            }
        });
    }

    // --- Lógica para exibir formulários de cancelamento em pedidos já "Em Preparo" ao carregar a página ---
    // Isso garante que se um pedido já está em preparo (ex: após um refresh), o formulário de cancelamento esteja visível.
    if (filaPedidos) {
    const pedidosEmPreparoAoCarregar = filaPedidos.querySelectorAll('.card-pedido.status-preparando');
    pedidosEmPreparoAoCarregar.forEach(card => {
        const formCancelar = card.querySelector('.form-cancelar');
        if (formCancelar) {
            formCancelar.classList.remove('hidden');
        }
    });
    }
    // ----------------------------------------------------------------------------------------------------

    // Adiciona um "ouvinte" de eventos na seção inteira (Event Delegation)
    // Isso é mais eficiente do que adicionar um ouvinte para cada botão
    if (filaPedidos) {
    filaPedidos.addEventListener('click', function(event) {
        
        const target = event.target; // O elemento que foi clicado
        const card = target.closest('.card-pedido'); // Encontra o card-pai mais próximo do botão clicado

        // Se o clique não foi em um botão de ação ou fora de um card, ignora
        if (!target.classList.contains('btn-acao') || !card) {
            return;
        }

        // Lógica para o botão "Iniciar Preparo"
        if (target.classList.contains('btn-iniciar')) {
            // 1. Muda o status visual do card
            card.classList.remove('status-aguardando');
            card.classList.add('status-preparando');

            // 2. Atualiza o texto do cabeçalho do card
            const titulo = card.querySelector('h3');
            if (titulo && !titulo.textContent.includes('(Em Preparo)')) {
                titulo.textContent += ' (Em Preparo)';
            }

            // 3. Transforma o botão "Iniciar Preparo" em "Marcar como Pronto"
            target.classList.remove('btn-iniciar');
            target.classList.add('btn-pronto');
            target.textContent = 'Marcar como Pronto';

            // 4. Abre a seção de cancelamento
            const formCancelar = card.querySelector('.form-cancelar');
            if (formCancelar) {
                formCancelar.classList.remove('hidden');
            }
        } 
        // Lógica para o botão "Marcar como Pronto"
        else if (target.classList.contains('btn-pronto')) {
            // 1. Muda o status visual do card
            card.classList.remove('status-preparando');
            card.classList.add('status-pronto');

            // 2. Move o card para o topo da fila para dar destaque
            filaPedidos.prepend(card);

            // 3. Remove o botão de ação para indicar finalização
            target.remove();

            // 4. Oculta a seção de cancelamento (já que o pedido está pronto)
            const formCancelar = card.querySelector('.form-cancelar');
            if (formCancelar) {
                formCancelar.classList.add('hidden');
            }
        }
    });
    }

    // --- Lógica para mostrar/ocultar inputs no Cardápio (Garçom) ---
    const checkboxesPedido = document.querySelectorAll('.checkbox-pedido');
    checkboxesPedido.forEach(checkbox => {
        const toggleDetalhes = () => {
            const detalhesDiv = document.getElementById('detalhes-' + checkbox.id);
            if (detalhesDiv) {
                if (checkbox.checked) {
                    detalhesDiv.classList.remove('hidden');
                } else {
                    detalhesDiv.classList.add('hidden');
                }
            }
        };
        // Verifica estado inicial e adiciona listener
        toggleDetalhes();
        checkbox.addEventListener('change', toggleDetalhes);
    });

    // --- Programmer Panel Authentication ---
    // Seleciona os elementos relevantes para a autenticação do programador
    const programmerAuthSection = document.getElementById('programmer-auth-section');
    const programmerContent = document.getElementById('programmer-content');
    const programmerSidebar = document.getElementById('programmer-sidebar');
    const programmerKeyInput = document.getElementById('programmer-key-input');
    const authenticateProgrammerBtn = document.getElementById('authenticate-programmer-btn');
    const logoutProgrammerBtn = document.getElementById('logout-programmer-btn');

    // --- Gerenciamento da Chave do Programador ---
    const DEFAULT_PROGRAMMER_KEY = 'superadmin123';
    const PROGRAMMER_KEY_STORAGE_ITEM = 'programmerSecretKey';

    // Função para obter a chave atual do programador (do localStorage ou padrão)
    function getProgrammerKey() {
        let key = localStorage.getItem(PROGRAMMER_KEY_STORAGE_ITEM);
        if (!key) {
            // Se nenhuma chave estiver no armazenamento, define a padrão
            localStorage.setItem(PROGRAMMER_KEY_STORAGE_ITEM, DEFAULT_PROGRAMMER_KEY);
            return DEFAULT_PROGRAMMER_KEY;
        }
        return key;
    }

    // --- Lógica de Autenticação e Visibilidade ---
    // Função para verificar o estado de autenticação do programador
    function checkProgrammerAuthentication() {
        // Verifica se o usuário já está autenticado nesta sessão (usando sessionStorage)
        if (sessionStorage.getItem('isProgrammerAuthenticated') === 'true') {
            if (programmerAuthSection) programmerAuthSection.classList.add('hidden'); // Esconde a seção de autenticação
            if (programmerSidebar) programmerSidebar.classList.remove('hidden'); // Mostra a sidebar
            if (programmerContent) programmerContent.classList.remove('hidden'); // Mostra o conteúdo do painel
            return true;
        }
        // Se não autenticado, garante que o conteúdo está escondido e a seção de autenticação visível
        if (programmerAuthSection) programmerAuthSection.classList.remove('hidden');
        if (programmerContent) programmerContent.classList.add('hidden');
        if (programmerSidebar) programmerSidebar.classList.add('hidden');
        return false;
    }

    // Executa a verificação inicial ao carregar a página
    checkProgrammerAuthentication();

    // Adiciona um ouvinte de evento para o botão de autenticação
    if (authenticateProgrammerBtn) {
        authenticateProgrammerBtn.addEventListener('click', function() {
            if (programmerKeyInput.value === getProgrammerKey()) {
                sessionStorage.setItem('isProgrammerAuthenticated', 'true'); // Marca como autenticado na sessão
                alert('✅ Acesso de Programador concedido!');
                checkProgrammerAuthentication(); // Atualiza a visibilidade do conteúdo
            } else {
                alert('❌ Chave de Programador incorreta. Acesso negado.');
                programmerKeyInput.value = ''; // Limpa o campo de input
            }
        });
    }

    // Adiciona um ouvinte para a tecla "Enter" no campo de senha
    if (programmerKeyInput) {
        programmerKeyInput.addEventListener('keyup', function(event) {
            // Verifica se a tecla pressionada foi "Enter" (código 13)
            if (event.keyCode === 13) {
                event.preventDefault(); // Previne qualquer ação padrão do "Enter"
                authenticateProgrammerBtn.click(); // Simula um clique no botão de acesso
            }
        });
    }

    // Adiciona um ouvinte de evento para o botão de logout
    if (logoutProgrammerBtn) {
        logoutProgrammerBtn.addEventListener('click', function() {
            sessionStorage.removeItem('isProgrammerAuthenticated');
            alert('Sessão de programador encerrada.');
            location.reload();
        });
    }
});