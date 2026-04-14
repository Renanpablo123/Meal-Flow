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

    // --- Lógica de Visualização e Controle da Cozinha ---
    async function atualizarFilaCozinha() {
        if (!filaPedidos) return;

        const pedidos = await buscarTodos('pedidos');
        filaPedidos.innerHTML = '';

        // Filtramos para mostrar apenas pedidos que não foram finalizados/entregues
        pedidos.filter(p => p.status !== 'entregue' && p.status !== 'cancelado').forEach(pedido => {
            const card = document.createElement('article');
            card.className = `card-pedido status-${pedido.status || 'aguardando'}`;
            card.dataset.id = pedido.id;

            const itensHtml = pedido.itens.map(item => 
                `<li>${item.quantidade}x ${item.nome} <br> <small>Obs: ${item.observacao}</small></li>`
            ).join('');

            let botoesHtml = '';
            if (pedido.status === 'aguardando' || !pedido.status) {
                botoesHtml = `<button type="button" class="btn-acao btn-iniciar">Iniciar Preparo</button>`;
            } else if (pedido.status === 'preparando') {
                botoesHtml = `<button type="button" class="btn-acao btn-pronto">Marcar como Pronto</button>`;
            }

            card.innerHTML = `
                <h3>Pedido #${pedido.id} ${pedido.status === 'preparando' ? '(Em Preparo)' : ''}</h3>
                <p><strong>Mesa:</strong> ${pedido.mesa || 'N/A'} | <strong>Hora:</strong> ${new Date(pedido.dataCriacao).toLocaleTimeString()}</p>
                <ul>${itensHtml}</ul>
                <div class="acoes-card">
                    ${botoesHtml}
                </div>
                <div class="form-cancelar ${pedido.status === 'preparando' ? '' : 'hidden'}">
                    <hr>
                    <input type="text" placeholder="Motivo do cancelamento..." id="motivo-${pedido.id}">
                    <button type="button" class="btn-acao btn-cancelar" style="padding: 5px 10px; font-size: 12px; margin-top:5px;">Confirmar Cancelamento</button>
                </div>
            `;
            filaPedidos.appendChild(card);
        });
    }

    // Event Delegation para os botões da cozinha
    if (filaPedidos) {
        filaPedidos.addEventListener('click', async function(event) {
            const target = event.target;
            const card = target.closest('.card-pedido');
            if (!card || !target.classList.contains('btn-acao')) return;

            const pedidoId = parseInt(card.dataset.id);
            const pedidos = await buscarTodos('pedidos');
            const pedido = pedidos.find(p => p.id === pedidoId);

            if (!pedido) return;

            if (target.classList.contains('btn-iniciar')) {
                pedido.status = 'preparando';
                await atualizarItem('pedidos', pedido);
                atualizarFilaCozinha();
            } 
            else if (target.classList.contains('btn-pronto')) {
                pedido.status = 'pronto';
                await atualizarItem('pedidos', pedido);
                atualizarFilaCozinha();
            }
            else if (target.classList.contains('btn-cancelar')) {
                const motivoInput = document.getElementById(`motivo-${pedidoId}`);
                const motivo = motivoInput ? motivoInput.value : "Não informado";
                
                if (!motivo.trim()) {
                    alert("Por favor, informe o motivo do cancelamento.");
                    return;
                }

                if (confirm(`Deseja realmente cancelar o pedido #${pedidoId}?`)) {
                    pedido.status = 'cancelado';
                    pedido.motivoCancelamento = motivo;
                    await atualizarItem('pedidos', pedido);
                    atualizarFilaCozinha();
                }
            }
        });

        // Inicializa a fila e define o polling
        atualizarFilaCozinha();
        setInterval(atualizarFilaCozinha, 3000);
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

    // --- Lógica de Visualização de Pedidos (Painel do Garçom) ---
    const listaPedidosGarcom = document.getElementById('lista-pedidos-garcom');

    async function atualizarListaPedidosGarcom() {
        if (!listaPedidosGarcom) return;

        // Busca todos os pedidos do IndexedDB
        const pedidos = await buscarTodos('pedidos');
        
        // Limpa a lista atual
        listaPedidosGarcom.innerHTML = '';

        // Filtra para esconder entregues/cancelados e inverte para os recentes
        pedidos.filter(p => p.status !== 'entregue' && p.status !== 'cancelado')
        .reverse().forEach(pedido => {
            const li = document.createElement('li');
            
            // Define a classe baseada no status
            let statusClass = '';
            let statusTexto = '';

            if (pedido.status === 'aguardando' || !pedido.status) {
                statusClass = 'order-item-aguardando';
                statusTexto = '⏳ Aguardando Preparo';
            } else if (pedido.status === 'preparando') {
                statusClass = 'order-item-preparando';
                statusTexto = '🍳 Em Preparo';
            } else if (pedido.status === 'pronto') {
                statusClass = 'order-item-pronto'; // Classe padrão verde
                statusTexto = '✅ Pronto para Retirada';
            }

            li.className = statusClass;
            li.innerHTML = `
                <a href="garcom_detalhe_retirada.html?id=${pedido.id}">
                    Pedido #${pedido.id} - Mesa ${pedido.mesa || 'N/A'} 
                    <span class="status-tag">${statusTexto}</span>
                </a>
            `;
            listaPedidosGarcom.appendChild(li);
        });
    }

    // Inicializa e define atualização automática (polling) para simular tempo real
    if (listaPedidosGarcom) {
        atualizarListaPedidosGarcom();
        setInterval(atualizarListaPedidosGarcom, 3000); // Atualiza a cada 3 segundos
    }

    // --- Lógica da Tela de Revisão (Capturar dados do Cardápio e Salvar) ---
    const listaResumo = document.getElementById('lista-resumo-itens');
    const valorTotalResumo = document.getElementById('valor-total-resumo');
    const formRevisao = document.getElementById('form-revisao-pedido');

    if (listaResumo && valorTotalResumo) {
        const params = new URLSearchParams(window.location.search);
        let itensParaSalvar = [];
        let totalGeral = 0;

        // Mapeamento simples de preços para demonstração (deve vir do cardápio no futuro)
        const precos = { "item1": 10.00, "item2": 25.00 };
        const nomes = { "item1": "Suco de Laranja", "item2": "Batata Frita" };

        // Verifica quais itens vieram na URL
        for (let i = 1; i <= 2; i++) {
            if (params.get(`item${i}`)) {
                const qtd = parseInt(params.get(`qtd_item${i}`)) || 1;
                const obs = params.get(`obs_item${i}`) || "Nenhuma";
                const subtotal = precos[`item${i}`] * qtd;
                
                totalGeral += subtotal;
                itensParaSalvar.push({ nome: nomes[`item${i}`], quantidade: qtd, observacao: obs });

                const li = document.createElement('li');
                li.textContent = `${qtd}x ${nomes[`item${i}`]} (Obs: ${obs}) - R$ ${subtotal.toFixed(2)}`;
                listaResumo.appendChild(li);
            }
        }
        valorTotalResumo.textContent = totalGeral.toFixed(2);

        // Lógica de envio final
        if (formRevisao) {
            formRevisao.addEventListener('submit', async function(e) {
                e.preventDefault();

                const novoPedido = {
                    id: Math.floor(1000 + Math.random() * 9000), // Gera um ID aleatório para teste
                    mesa: document.getElementById('mesa').value || 'N/A',
                    cliente: document.getElementById('nome_cliente').value || 'Anônimo',
                    telefone: document.getElementById('telefone_cliente').value || '',
                    itens: itensParaSalvar,
                    total: totalGeral,
                    status: 'aguardando',
                    dataCriacao: new Date().toISOString()
                };

                try {
                    // Função 'salvar' deve estar definida no seu db.js
                    if (typeof salvar === 'function') {
                        await salvar('pedidos', novoPedido);
                        window.location.href = `garcom_sucesso.html?id=${novoPedido.id}`;
                    } else {
                        alert("Erro técnico: Função de salvamento não encontrada no db.js");
                    }
                } catch (err) {
                    console.error("Erro ao salvar pedido:", err);
                    alert("Não foi possível enviar o pedido para a cozinha.");
                }
            });
        }
    }

    // --- Lógica da Tela de Sucesso (Exibir o ID real do pedido) ---
    const displayId = document.getElementById('display-pedido-id');
    if (displayId) {
        const params = new URLSearchParams(window.location.search);
        displayId.textContent = params.get('id') || '---';
    }

    // --- Lógica da Tela de Detalhes da Retirada (Finalização pelo Garçom) ---
    const detalheId = document.getElementById('detalhe-id');
    const formFinalizar = document.getElementById('form-finalizar-pedido');

    if (detalheId) {
        const params = new URLSearchParams(window.location.search);
        const orderId = parseInt(params.get('id'));

        async function carregarDetalhesPedido() {
            const pedidos = await buscarTodos('pedidos');
            const pedido = pedidos.find(p => p.id === orderId);

            if (pedido) {
                detalheId.textContent = `Pedido #${pedido.id}`;
                document.getElementById('detalhe-mesa').textContent = pedido.mesa || 'N/A';
                document.getElementById('detalhe-cliente').textContent = pedido.cliente || 'Anônimo';
                document.getElementById('detalhe-telefone').textContent = pedido.telefone || 'N/A';
                document.getElementById('detalhe-total').textContent = pedido.total.toFixed(2);

                const listaItens = document.getElementById('detalhe-itens');
                listaItens.innerHTML = pedido.itens.map(i => 
                    `<li>${i.quantidade}x ${i.nome}</li>`
                ).join('');
            } else {
                alert("Pedido não encontrado!");
                window.location.href = 'garcom_painel.html';
            }
        }

        carregarDetalhesPedido();

        if (formFinalizar) {
            formFinalizar.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                try {
                    const pedidos = await buscarTodos('pedidos');
                    const pedido = pedidos.find(p => p.id === orderId);

                    if (pedido) {
                        // Atualiza as informações finais
                        pedido.status = 'entregue';
                        pedido.statusPagamento = document.getElementById('status_pagamento').value;
                        pedido.feedback = document.getElementById('reclamacoes').value;
                        pedido.dataEntrega = new Date().toISOString();

                        await atualizarItem('pedidos', pedido);
                        alert("✅ Pedido finalizado e entregue com sucesso!");
                        window.location.href = 'garcom_painel.html';
                    }
                } catch (err) {
                    console.error("Erro ao finalizar pedido:", err);
                    alert("Erro ao salvar finalização do pedido.");
                }
            });
        }
    }

    // --- Programmer Panel Authentication --- (Código existente abaixo...)
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