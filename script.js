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

    // --- Lógica de Cardápio Dinâmico e Unificado ---
    async function atualizarCardapioDinamico() {
        const containerGarcom = document.getElementById('cardapio-garcom');
        const containerAdmin = document.getElementById('cardapio-admin');
        if (!containerGarcom && !containerAdmin) return;

        const categorias = await buscarTodos('categorias');
        const produtos = await buscarTodos('produtos');

        const renderizar = (container, perfil) => {
            container.innerHTML = '';
            if (categorias.length === 0) {
                container.innerHTML = '<p>Nenhuma seção cadastrada no cardápio.</p>';
                return;
            }

            categorias.forEach(cat => {
                const section = document.createElement('section');
                section.innerHTML = `<h3>📂 ${cat.nome}</h3>`;
                const itens = produtos.filter(p => p.categoriaId === cat.id);

                itens.forEach(prod => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'menu-item-row';
                    itemDiv.style.borderBottom = "1px solid #eee";
                    itemDiv.style.padding = "10px 0";

                    if (perfil === 'garcom') {
                        itemDiv.innerHTML = `
                            <label>
                                <input type="checkbox" class="checkbox-pedido" id="prod-${prod.id}" name="item${prod.id}" value="${prod.id}">
                                <strong>${prod.nome}</strong> - R$ ${prod.preco.toFixed(2)}
                            </label>
                            <div id="detalhes-prod-${prod.id}" class="hidden" style="margin-top:5px; padding-left:25px;">
                                <input type="number" name="qtd_item${prod.id}" value="1" min="1" style="width:60px">
                                <input type="text" name="obs_item${prod.id}" placeholder="Observação...">
                            </div>
                        `;
                    } else {
                        itemDiv.innerHTML = `
                            <span><strong>${prod.nome}</strong> - R$ ${prod.preco.toFixed(2)}</span>
                            <div style="float:right">
                                <button type="button" class="btn-small">Editar</button>
                                <button type="button" class="btn-small btn-cancelar">Remover</button>
                            </div>
                        `;
                    }
                    section.appendChild(itemDiv);
                });
                container.appendChild(section);
            });

            if (perfil === 'garcom') {
                container.querySelectorAll('.checkbox-pedido').forEach(cb => {
                    cb.addEventListener('change', () => {
                        const detalhes = document.getElementById('detalhes-' + cb.id);
                        if (detalhes) detalhes.classList.toggle('hidden', !cb.checked);
                    });
                });
            }
        };

        if (containerGarcom) renderizar(containerGarcom, 'garcom');
        if (containerAdmin) renderizar(containerAdmin, 'admin');
    }

    // --- Lógica de Histórico de Pedidos (Admin) ---
    async function atualizarHistoricoAdmin() {
        const containerHistorico = document.getElementById('historico-pedidos-admin');
        if (!containerHistorico) return;

        const pedidos = await buscarTodos('pedidos');
        containerHistorico.innerHTML = '';

        const entregues = pedidos.filter(p => p.status === 'entregue');
        if (entregues.length === 0) {
            containerHistorico.innerHTML = '<p>Nenhum pedido finalizado no histórico.</p>';
            return;
        }

        entregues.reverse().forEach(p => {
            const card = document.createElement('article');
            card.className = 'history-card';
            card.style.borderLeft = "5px solid var(--secondary-color)";
            card.innerHTML = `
                <h3>Pedido #${p.id}</h3>
                <p><strong>Mesa:</strong> ${p.mesa} | <strong>Cliente:</strong> ${p.cliente}</p>
                <p><strong>Total:</strong> R$ ${p.total.toFixed(2)} | <strong>Pagamento:</strong> ${p.statusPagamento || 'Confirmado'}</p>
                <p><small>Entregue em: ${new Date(p.dataEntrega).toLocaleString()}</small></p>
            `;
            containerHistorico.appendChild(card);
        });
    }

    // Chamadas Iniciais
    atualizarCardapioDinamico();
    atualizarHistoricoAdmin();

    // --- Lógica de Detalhes do Restaurante (Página do Programador) ---
    async function carregarDetalhesRestaurante() {
        const urlParams = new URLSearchParams(window.location.search);
        const restId = parseInt(urlParams.get('id'));
        if (!restId || !document.getElementById('info-titulo-nome')) return;

        const restaurantes = await buscarTodos('restaurantes');
        const rest = restaurantes.find(r => r.id === restId);

        if (rest) {
            document.getElementById('info-id-topo').textContent = `#${rest.id}`;
            document.getElementById('info-titulo-nome').textContent = `🏢 ${rest.nomeFantasia}`;
            document.getElementById('info-documento').textContent = rest.documento || 'Não informado';
            document.getElementById('info-endereco').textContent = rest.endereco || 'Não informado';
            document.getElementById('info-data').textContent = rest.dataSolicitacao ? new Date(rest.dataSolicitacao).toLocaleDateString() : '---';
            document.getElementById('info-responsavel').textContent = rest.responsavel;
            document.getElementById('info-telefone').textContent = rest.telefone;
            document.getElementById('info-status').textContent = rest.status.toUpperCase();

            // Configura botões de ação
            const btnExcluir = document.getElementById('btn-excluir-restaurante');
            if (btnExcluir) {
                btnExcluir.onclick = async () => {
                    if (confirm(`Tem certeza que deseja EXCLUIR o restaurante ${rest.nomeFantasia}?`)) {
                        await deletarItem('restaurantes', rest.id);
                        alert("Restaurante removido com sucesso.");
                        window.location.href = 'programer.html';
                    }
                };
            }

            const btnSuspender = document.getElementById('btn-suspender');
            if (btnSuspender) {
                btnSuspender.onclick = async () => {
                    rest.status = rest.status === 'suspenso' ? 'ativo' : 'suspenso';
                    await atualizarItem('restaurantes', rest);
                    alert(`Status alterado para: ${rest.status}`);
                    location.reload();
                };
            }
        }
    }
    carregarDetalhesRestaurante();

    // --- Lógica de Redirecionamento Automático (Visitante -> Admin) ---
    // Verifica se o restaurante que o usuário cadastrou foi aprovado
    async function verificarStatusAprovacao() {
        const msgAlerta = document.querySelector('.mensagem-alerta');
        if (!msgAlerta) return; // Só executa se estiver na página de visitante/espera

        const restaurantes = await buscarTodos('restaurantes');
        
        // Como não temos sistema de login real vinculado a ID, 
        // pegamos o último restaurante pendente/ativo para simular o do usuário atual
        if (restaurantes.length > 0) {
            // Procura se existe algum restaurante que era pendente e agora está ativo
            const meuRestauranteAtivo = restaurantes.find(r => r.status === 'ativo');
            
            if (meuRestauranteAtivo) {
                // Se encontrar um ativo, redireciona para o painel administrativo
                msgAlerta.innerHTML = `
                    <p style="color: var(--secondary-color); font-weight: bold;">✅ Seu restaurante foi APROVADO!</p>
                    <p>Redirecionando para o painel administrativo...</p>
                `;
                setTimeout(() => {
                    window.location.href = '../administrativo/admin_painel.html';
                }, 2000);
            }
        }
    }

    // Se estiver na tela de visitante, verifica a cada 3 segundos
    if (window.location.href.includes('visitante.html')) {
        setInterval(verificarStatusAprovacao, 3000);
    }

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

    // --- Lógica de Solicitação de Cadastro de Restaurante (Onboarding) ---
    // Esta função captura os dados do formulário de cadastro e os salva como 'pendente'
    const formCadastroRestaurante = document.getElementById('form-cadastro-restaurante');
    if (formCadastroRestaurante) {
        formCadastroRestaurante.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const novoRestaurante = {
                id: Date.now(), // Gera um ID único baseado no timestamp
                nomeFantasia: document.getElementById('nome_restaurante').value,
                responsavel: document.getElementById('nome_responsavel').value,
                documento: document.getElementById('cnpj').value, // CNPJ ou CPF
                telefone: document.getElementById('telefone').value,
                endereco: document.getElementById('endereco').value,
                status: 'pendente', // Status crucial para aparecer no Painel do Programador
                dataSolicitacao: new Date().toISOString()
            };

            try {
                if (typeof salvar === 'function') {
                    await salvar('restaurantes', novoRestaurante);
                    alert("✅ Solicitação enviada! Aguarde a moderação do programador.");
                    // Redireciona para a tela de login ou uma página de aviso
                    window.location.href = 'login_aba.html'; 
                } else {
                    alert("Erro técnico: Banco de dados não inicializado corretamente.");
                }
            } catch (err) {
                console.error("Erro ao solicitar cadastro:", err);
                alert("Houve um erro ao processar seu cadastro. Tente novamente.");
            }
        });
    }

    // --- Lógica Dinâmica do Painel do Programador ---
    async function atualizarPainelProgramador() {
        const solicitacoesContainer = document.getElementById('solicitacoes-cadastro-container');
        const bodyAtivos = document.getElementById('restaurantes-ativos-body');

        if (!solicitacoesContainer || !bodyAtivos) return;

        const restaurantes = await buscarTodos('restaurantes');

        // Renderizar Solicitações
        solicitacoesContainer.innerHTML = '';
        const pendentes = restaurantes.filter(r => r.status === 'pendente');
        if (pendentes.length === 0) solicitacoesContainer.innerHTML = '<p>Nenhuma solicitação pendente.</p>';
        
        pendentes.forEach(rest => {
            const card = document.createElement('article');
            card.className = 'moderation-card';
            card.innerHTML = `
                <h3>Restaurante "${rest.nomeFantasia}"</h3>
                <ul>
                    <li><strong>Responsável:</strong> ${rest.responsavel}</li>
                    <li><strong>Documento:</strong> ${rest.documento}</li>
                    <li><strong>Telefone:</strong> ${rest.telefone}</li>
                </ul>
                <div class="action-buttons">
                    <button type="button" class="btn-aprovar" data-id="${rest.id}" data-action="ativo">Aprovar Acesso</button>
                    <button type="button" class="btn-cancelar" data-id="${rest.id}" data-action="rejeitado">Rejeitar</button>
                </div>
            `;
            solicitacoesContainer.appendChild(card);
        });

        // Renderizar Ativos
        bodyAtivos.innerHTML = '';
        restaurantes.filter(r => r.status === 'ativo').forEach(rest => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${rest.id}</td>
                <td>${rest.nomeFantasia}</td>
                <td class="status-ativo">Ativo</td>
                <td>
                    <a href="programador_detalhes_restaurante.html?id=${rest.id}">
                        <button type="button" class="btn-small">Ver Detalhes</button>
                    </a>
                </td>
            `;
            bodyAtivos.appendChild(tr);
        });
    }

    // --- Lógica de Autenticação e Visibilidade ---
    // Função para verificar o estado de autenticação do programador
    function checkProgrammerAuthentication() {
        // Verifica se o usuário já está autenticado nesta sessão (usando sessionStorage)
        if (sessionStorage.getItem('isProgrammerAuthenticated') === 'true') {
            if (programmerAuthSection) programmerAuthSection.classList.add('hidden'); // Esconde a seção de autenticação
            if (programmerSidebar) programmerSidebar.classList.remove('hidden'); // Mostra a sidebar
            if (programmerContent) programmerContent.classList.remove('hidden'); // Mostra o conteúdo do painel
            atualizarPainelProgramador();
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

    // Event Delegation para ações de moderação
    const pContent = document.getElementById('programmer-content');
    if (pContent) {
        pContent.addEventListener('click', async (e) => {
            if (e.target.dataset.id && e.target.dataset.action) {
                const id = parseInt(e.target.dataset.id);
                const acao = e.target.dataset.action;
                
                const restaurantes = await buscarTodos('restaurantes');
                const rest = restaurantes.find(r => r.id === id);
                if (rest) {
                    rest.status = acao;
                    await atualizarItem('restaurantes', rest);
                    alert(`Restaurante ${acao === 'ativo' ? 'aprovado' : 'rejeitado'}!`);
                    atualizarPainelProgramador();
                }
            }
        });
    }

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