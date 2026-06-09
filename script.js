// Espera o DOM carregar completamente para garantir que os elementos existam
document.addEventListener('DOMContentLoaded', function() {

    // Seleciona a seção que contém todos os cards de pedido
    const filaPedidos = document.getElementById('fila-pedidos');

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
    async function atualizarCardapioAdmin() {
        const containerAdmin = document.getElementById('cardapio-admin');
        if (!containerAdmin) return;

        const categorias = await buscarTodos('categorias');
        const produtos = await buscarTodos('produtos');

        containerAdmin.innerHTML = '';
        if (categorias.length === 0) {
            containerAdmin.innerHTML = '<p>Nenhuma seção cadastrada no cardápio.</p>';
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

                itemDiv.innerHTML = `
                    <span><strong>${prod.nome}</strong> - R$ ${prod.preco.toFixed(2)}</span>
                    <div style="float:right">
                        <button type="button" class="btn-small">Editar</button>
                        <button type="button" class="btn-small btn-cancelar">Remover</button>
                    </div>
                `;
                section.appendChild(itemDiv);
            });
            containerAdmin.appendChild(section);
        });
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
    atualizarCardapioAdmin();
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
                <div onclick="abrirModalRetirada(${pedido.id})" style="cursor:pointer; padding: 20px; background: inherit; border-radius: 8px;">
                    <strong>Pedido #${pedido.id}</strong> - Mesa ${pedido.mesa || 'N/A'} 
                    <span class="status-tag" style="float:right">${statusTexto}</span>
                </div>
            `;
            listaPedidosGarcom.appendChild(li);
        });
    }

    // Inicializa e define atualização automática (polling) para simular tempo real
    if (listaPedidosGarcom) {
        atualizarListaPedidosGarcom();
        setInterval(atualizarListaPedidosGarcom, 3000); // Atualiza a cada 3 segundos
    }

    // --- Sistema de Fluxo em Modal (SPA Garçom) ---

    function getOrCreateModal() {
        let modal = document.getElementById('modal-fluxo-garcom');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-fluxo-garcom';
            modal.className = 'modal-overlay hidden';
            document.body.appendChild(modal);
        }
        return modal;
    }

    window.fecharModal = function() {
        const modal = getOrCreateModal();
        modal.classList.add('hidden');
        modal.innerHTML = '';
        document.body.classList.remove('no-scroll');
    };

    // PASSO 1: Seleção de Itens
    window.abrirModalNovoPedido = async function() {
        const modal = getOrCreateModal();
        
        // Busca categorias e produtos reais do banco de dados
        const categoriasDb = await buscarTodos('categorias') || [];
        const produtosDb = await buscarTodos('produtos') || [];

        let conteudoCardapio = '';
        
        if (categoriasDb.length === 0) {
            conteudoCardapio = '<p style="text-align:center; color:#666; margin: 20px 0;">O cardápio está vazio. Peça ao administrador para cadastrar produtos.</p>';
        } else {
            conteudoCardapio = categoriasDb.map(cat => {
                // Filtra para não mostrar itens esgotados no cardápio do garçom
                const produtosDaCategoria = produtosDb.filter(p => p.categoriaId === cat.id && !p.esgotado);
                
                if (produtosDaCategoria.length === 0) return ''; // Pula categorias vazias

                return `
                    <h4 style="border-bottom: 2px solid #000; margin-top:20px; color: #000; padding-bottom: 5px;">📂 ${cat.nome}</h4>
                    ${produtosDaCategoria.map(prod => `
                <div class="menu-item-row" style="display:flex; flex-direction: column; padding:12px 0; border-bottom: 1px solid #eee;">
                    <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; font-weight: 500;">
                        <input type="checkbox" class="cb-item" 
                            data-id="${prod.id}" 
                            data-nome="${prod.nome}" 
                            data-preco="${prod.preco}" style="transform: scale(1.3);">
                        <span>${prod.nome} <span style="color: #666; font-weight: 400;">- R$ ${prod.preco.toFixed(2)}</span></span>
                    </label>
                    <div class="detalhes-item hidden" id="det-modal-${prod.id}" style="margin-top: 10px; background: #e9edef; padding: 12px; border-radius: 12px; position: relative;">
                        <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 10px;">
                            <label style="font-size: 0.9rem;">Quantidade:</label>
                            <input type="number" class="qtd-modal" value="1" min="1" style="width:60px; padding: 5px;">
                        </div>
                        <textarea class="obs-modal" placeholder="Escreva uma observação para este item..." style="width: 100%; height: 70px; border-radius: 8px; border: 1px solid #ccc; padding: 10px; box-sizing: border-box; resize: none; font-family: inherit;"></textarea>
                    </div>
                </div>
            `).join('')}
                `;
            }).join('');
        }

        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>🛒 Novo Pedido: Itens</h2>
                    <button onclick="fecharModal()">&times;</button>
                </div>
                <div id="modal-content-step1" style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                    ${conteudoCardapio}
                </div>
                <div style="margin-top:20px; text-align:right;">
                    <button class="btn-secondary" onclick="fecharModal()">Cancelar</button>
                    <button onclick="irParaRevisao()">Revisar Pedido ➡</button>
                </div>
            </div>
        `;
        document.body.classList.add('no-scroll');
        modal.classList.remove('hidden');

        // Listener para exibir campos de QTD/OBS ao marcar checkbox
        modal.querySelectorAll('.cb-item').forEach(cb => {
            cb.onchange = () => {
                document.getElementById(`det-modal-${cb.dataset.id}`).classList.toggle('hidden', !cb.checked);
            };
        });
    };

    // PASSO 2: Revisão e Identificação
    window.irParaRevisao = function() {
        const selecionados = [];
        let total = 0;
        document.querySelectorAll('.cb-item:checked').forEach(cb => {
            const id = cb.dataset.id;
            const qtd = parseInt(document.querySelector(`#det-modal-${id} .qtd-modal`).value);
            const obs = document.querySelector(`#det-modal-${id} .obs-modal`).value;
            const preco = parseFloat(cb.dataset.preco);
            const subtotal = preco * qtd;
            total += subtotal;
            selecionados.push({ nome: cb.dataset.nome, quantidade: qtd, observacao: obs, subtotal });
        });

        if (selecionados.length === 0) return alert("Selecione pelo menos um item!");

        const modal = getOrCreateModal();
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>📝 Revisão do Pedido</h2>
                    <button onclick="fecharModal()">&times;</button>
                </div>
                <ul>${selecionados.map(i => `<li>${i.quantidade}x ${i.nome} (R$ ${i.subtotal.toFixed(2)})</li>`).join('')}</ul>
                <p><strong>Total: R$ ${total.toFixed(2)}</strong></p>
                <hr>
                <div style="display:grid; gap:10px;">
                    <input type="text" id="m-mesa" placeholder="Nº da Mesa">
                    <input type="text" id="m-cliente" placeholder="Nome do Cliente">
                    <input type="tel" id="m-telefone" placeholder="Telefone do Cliente (Opcional)">
                </div>
                <div style="margin-top:20px; text-align:right;">
                    <button class="btn-secondary" onclick="abrirModalNovoPedido()">⬅ Voltar</button>
                    <button onclick="confirmarPedidoFinal(${JSON.stringify(selecionados).replace(/"/g, '&quot;')}, ${total})">Confirmar e Enviar 🚀</button>
                </div>
            </div>
        `;
    };

    // PASSO 3: Sucesso
    window.confirmarPedidoFinal = async function(itens, total) {
        const novoPedido = {
            id: Math.floor(1000 + Math.random() * 9000),
            mesa: document.getElementById('m-mesa').value || 'N/A',
            cliente: document.getElementById('m-cliente').value || 'Anônimo',
            telefone: document.getElementById('m-telefone').value || 'N/A',
            itens: itens,
            total: total,
            status: 'aguardando',
            dataCriacao: new Date().toISOString()
        };

        await salvar('pedidos', novoPedido);
        
        const modal = getOrCreateModal();
        modal.innerHTML = `
            <div class="modal-container" style="text-align:center;">
                <h2 style="color:var(--secondary-color)">✅ Pedido Enviado!</h2>
                <p>O ID do pedido é:</p>
                <h1 style="font-size:3rem; margin:10px 0; color:var(--primary-color)">#${novoPedido.id}</h1>
                <button onclick="fecharModal(); atualizarListaPedidosGarcom();" style="width:100%">Voltar ao Painel</button>
            </div>
        `;
    };

    // POP-UP DE DETALHES E RETIRADA
    window.abrirModalRetirada = async function(id) {
        const pedidos = await buscarTodos('pedidos');
        const pedido = pedidos.find(p => p.id === id);
        if (!pedido) return;

        const modal = getOrCreateModal();
        
        let statusInfo = '';
        if (pedido.status === 'aguardando' || !pedido.status) {
            statusInfo = '<p style="color: #666; font-style: italic; text-align:center;">Aguardando preparo iniciar</p>';
        } else if (pedido.status === 'preparando') {
            statusInfo = '<p style="color: #666; font-style: italic; text-align:center;">Aguardando término do preparo</p>';
        }

        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>📦 Pedido #${pedido.id}</h2>
                    <button onclick="fecharModal()">&times;</button>
                </div>
                <p><strong>Mesa:</strong> ${pedido.mesa} | <strong>Cliente:</strong> ${pedido.cliente}</p>
                <p><strong>Telefone:</strong> ${pedido.telefone || 'N/A'} | <strong>Total:</strong> R$ ${pedido.total.toFixed(2)}</p>
                <ul style="background:#f9f9f9; padding:15px; border-radius:8px; list-style:none;">
                    ${pedido.itens.map(i => `<li>${i.quantidade}x ${i.nome}</li>`).join('')}
                </ul>
                <hr>
                <div id="secao-status-entrega">
                    ${statusInfo}
                    ${pedido.status === 'pronto' ? '<button type="button" id="btn-pronto-entrega" style="width:100%;">Pedido pronto pra entrega</button>' : ''}
                </div>

                <form id="form-finalizar-modal" class="hidden">
                    <label>Status do Pagamento:</label>
                    <select id="sel-pagamento-modal" required>
                        <option value="pago">Pago</option>
                        <option value="nao_pago">Pendente</option>
                    </select>
                    <button type="submit" style="width:100%; margin-top:15px;">Finalizar e Entregar</button>
                </form>
            </div>
        `;

        document.body.classList.add('no-scroll');
        modal.classList.remove('hidden');

        const btnPronto = document.getElementById('btn-pronto-entrega');
        if (btnPronto) {
            btnPronto.onclick = () => {
                document.getElementById('secao-status-entrega').classList.add('hidden');
                document.getElementById('form-finalizar-modal').classList.remove('hidden');
            };
        }

        const formModal = document.getElementById('form-finalizar-modal');
        formModal.onsubmit = async (e) => {
            e.preventDefault();
            
            if (pedido.status === 'pronto') {
                pedido.status = 'entregue';
                pedido.statusPagamento = document.getElementById('sel-pagamento-modal').value;
                pedido.dataEntrega = new Date().toISOString();

                await atualizarItem('pedidos', pedido);
                alert("✅ Pedido finalizado com sucesso!");
                fecharModal();
                atualizarListaPedidosGarcom();
            }
        };
    }

    // --- Sistema de Gestão de Equipe em Modal (Admin) ---
    window.abrirModalGerenciarEquipe = async function() {
        const modal = getOrCreateModal();
        
        // Busca todos os usuários vinculados (ajuste o nome da store no IndexedDB se necessário)
        const funcionarios = await buscarTodos('usuarios') || []; 
        
        const listaHtml = funcionarios.length > 0 ? `
            <div style="max-height: 200px; overflow-y: auto; margin-top: 15px;">
                <table style="width:100%; border-collapse: collapse; font-size: 0.9rem; text-align: left;">
                    <thead style="background: #f4f4f4;">
                        <tr>
                            <th style="padding: 10px; border: 1px solid #ddd;">Nome</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Função</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${funcionarios.map(f => `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;">${f.nome}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${f.funcao}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">
                                    <button class="btn-small btn-cancelar" onclick="removerFuncionario(${f.id})">Remover</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : '<p style="text-align:center; color:#666; margin-top:15px;">Nenhum funcionário cadastrado.</p>';

        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>👥 Gerenciar Equipe</h2>
                    <button onclick="fecharModal()">&times;</button>
                </div>
                
                <div style="display:grid; gap:10px; background: #f9f9f9; padding: 15px; border-radius: 8px; text-align: left;">
                    <h4 style="margin:0 0 5px 0;">Cadastrar Novo Funcionário</h4>
                    <input type="text" id="f-nome" placeholder="Nome Completo">
                    <input type="email" id="f-email" placeholder="E-mail da Conta">
                    <select id="f-funcao">
                        <option value="" disabled selected>Escolha a função...</option>
                        <option value="Garçom">Garçom</option>
                        <option value="Cozinha">Cozinha</option>
                        <option value="Administrador">Administrador</option>
                    </select>
                    <button onclick="salvarFuncionario()">Cadastrar Funcionário</button>
                </div>

                <hr style="margin: 20px 0;">
                
                <h4 style="margin-bottom: 10px; text-align: left;">Funcionários Ativos</h4>
                ${listaHtml}
            </div>
        `;
        modal.classList.remove('hidden');
    };

    window.salvarFuncionario = async function() {
        const nome = document.getElementById('f-nome').value;
        const email = document.getElementById('f-email').value;
        const funcao = document.getElementById('f-funcao').value;

        if (!nome || !email || !funcao) return alert("Por favor, preencha todos os campos!");

        const novoFunc = {
            id: Date.now(),
            nome,
            email,
            funcao,
            dataCadastro: new Date().toISOString()
        };

        await salvar('usuarios', novoFunc);
        alert("✅ Funcionário cadastrado com sucesso!");
        abrirModalGerenciarEquipe(); // Recarrega o modal com a lista atualizada
    };

    window.removerFuncionario = async function(id) {
        if (confirm("Tem certeza que deseja remover este funcionário?")) {
            await deletarItem('usuarios', id);
            abrirModalGerenciarEquipe();
        }
    };

    // --- Sistema de Gestão de Cardápio em Modal (Admin) ---
    window.abrirModalEditarCardapio = async function() {
        const modal = getOrCreateModal();
        const categorias = await buscarTodos('categorias') || [];
        const produtos = await buscarTodos('produtos') || [];

        let cardapioHtml = '';
        if (categorias.length === 0) {
            cardapioHtml = '<p style="text-align:center; color:#666; margin-top:10px;">Crie sua primeira seção abaixo para começar.</p>';
        } else {
            cardapioHtml = categorias.map(cat => {
                const itens = produtos.filter(p => p.categoriaId === cat.id);
                return `
                    <div style="margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; text-align: left;">
                        <div style="display:flex; justify-content: space-between; align-items: center; background: #f4f4f4; padding: 8px 12px; border-radius: 6px;">
                            <h4 style="margin:0;">📂 ${cat.nome}</h4>
                            <button class="btn-small btn-cancelar" onclick="removerSecao(${cat.id})">Apagar Seção</button>
                        </div>
                        <ul style="list-style:none; padding: 0; margin-top: 10px; font-size: 0.9rem;">
                            ${itens.map(p => `
                                <li style="display:flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                    <span><strong>${p.nome}</strong> <br> <small style="color: #666;">R$ ${p.preco.toFixed(2)}</small></span>
                                    <button class="btn-small btn-cancelar" style="padding: 2px 8px;" onclick="removerProduto(${p.id})">×</button>
                                </li>
                            `).join('')}
                        </ul>
                        ${itens.length === 0 ? '<p style="font-size: 0.8rem; color:#999; margin: 5px 0 0 10px;">Sem itens nesta seção.</p>' : ''}
                    </div>
                `;
            }).join('');
        }

        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>🛠️ Gestão do Cardápio</h2>
                    <button onclick="fecharModal()">&times;</button>
                </div>
                
                <div style="max-height: 500px; overflow-y: auto; padding-right: 5px;">
                    <!-- Bloco: Criar Categoria -->
                    <div style="display:grid; gap:10px; background: #eef2f3; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                        <h4 style="margin:0;">1. Criar Nova Seção (ex: Bebidas)</h4>
                        <div style="display:flex; gap:10px;">
                            <input type="text" id="cat-nome" placeholder="Nome da Seção">
                            <button onclick="salvarNovaSecao()">Criar</button>
                        </div>
                    </div>

                    <!-- Bloco: Adicionar Item -->
                    <div style="display:grid; gap:10px; background: #eef2f3; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                        <h4 style="margin:0;">2. Cadastrar Novo Item</h4>
                        <select id="p-categoria">
                            <option value="" disabled selected>Escolha a seção...</option>
                            ${categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('')}
                        </select>
                        <input type="text" id="p-nome" placeholder="Nome do prato ou bebida">
                        <textarea id="p-desc" placeholder="Ingredientes (opcional)" style="height: 50px;"></textarea>
                        <input type="number" id="p-preco" step="0.01" placeholder="Preço (R$)">
                        <button onclick="salvarNovoItem()" style="width:100%;">Salvar Item no Cardápio</button>
                    </div>

                    <hr style="margin: 20px 0;">
                    <h4 style="margin-bottom: 15px; text-align: left;">Visualização e Exclusão</h4>
                    ${cardapioHtml}
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    };

    window.salvarNovaSecao = async function() {
        const nome = document.getElementById('cat-nome').value;
        if (!nome) return alert("Por favor, digite o nome da seção!");
        await salvar('categorias', { id: Date.now(), nome });
        abrirModalEditarCardapio();
    };

    window.salvarNovoItem = async function() {
        const catId = parseInt(document.getElementById('p-categoria').value);
        const nome = document.getElementById('p-nome').value;
        const desc = document.getElementById('p-desc').value;
        const preco = parseFloat(document.getElementById('p-preco').value);
        if (!catId || !nome || isNaN(preco)) return alert("Preencha todos os campos obrigatórios!");
        await salvar('produtos', { id: Date.now(), categoriaId: catId, nome, descricao: desc, preco });
        abrirModalEditarCardapio();
    };

    window.removerSecao = async function(id) {
        if (confirm("Atenção: Isso apagará a seção e todos os itens vinculados a ela. Continuar?")) {
            await deletarItem('categorias', id);
            abrirModalEditarCardapio();
        }
    };

    window.removerProduto = async function(id) {
        if (confirm("Deseja remover este item do cardápio?")) {
            await deletarItem('produtos', id);
            abrirModalEditarCardapio();
        }
    };

    // --- Sistema de Visualização de Cardápio em Modal (Admin) ---
    window.abrirModalVisualizarCardapio = async function() {
        const modal = getOrCreateModal();
        const categorias = await buscarTodos('categorias') || [];
        const produtos = await buscarTodos('produtos') || [];

        let cardapioHtml = '';
        if (categorias.length === 0) {
            cardapioHtml = '<p style="text-align:center; color:#666; margin-top:20px;">O cardápio ainda está vazio.</p>';
        } else {
            cardapioHtml = categorias.map(cat => {
                const itens = produtos.filter(p => p.categoriaId === cat.id);
                return `
                    <div style="margin-top: 20px; text-align: left;">
                        <h3 style="background: #f4f4f4; padding: 10px; border-radius: 5px; margin-bottom: 10px; border-left: 5px solid var(--primary-color);">📂 ${cat.nome}</h3>
                        <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: #fdfdfd;">
                                    <th style="padding: 10px; border-bottom: 2px solid #eee; text-align: left;">Item</th>
                                    <th style="padding: 10px; border-bottom: 2px solid #eee; text-align: right;">Preço</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itens.length > 0 ? itens.map(p => `
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                            <strong>${p.nome}</strong><br>
                                            <small style="color: #777;">${p.descricao || ''}</small>
                                        </td>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top;">
                                            R$ ${p.preco.toFixed(2)}
                                        </td>
                                    </tr>
                                `).join('') : '<tr><td colspan="2" style="padding: 10px; text-align:center; color: #999;">Nenhum item cadastrado nesta seção.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                `;
            }).join('');
        }

        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>📖 Cardápio Digital</h2>
                    <button onclick="fecharModal()">&times;</button>
                </div>
                <div style="max-height: 550px; overflow-y: auto; padding-right: 10px;">
                    ${cardapioHtml}
                </div>
                <div style="margin-top:20px; display: flex; gap: 10px;">
                    <button class="btn-secondary" style="flex:1" onclick="fecharModal()">Fechar</button>
                    <button style="flex:1" onclick="abrirModalEditarCardapio()">Editar Cardápio</button>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    };

    // --- Sistema de Cadastro de Usuário em Modal ---
    window.abrirModalCadastro = function() {
        const modal = getOrCreateModal();
        
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>📝 Crie sua Conta</h2>
                    <button onclick="fecharModal()">&times;</button>
                </div>
                <form id="form-cadastro-modal" style="text-align: left;">
                    <div>
                        <label for="m-nome">Nome Completo:</label>
                        <input type="text" id="m-nome" placeholder="Seu nome" required>
                    </div>
                    <br>
                    <div>
                        <label for="m-email">E-mail:</label>
                        <input type="email" id="m-email" placeholder="seu@email.com" required>
                    </div>
                    <br>
                    <div>
                        <label for="m-senha">Senha:</label>
                        <input type="password" id="m-senha" placeholder="Mínimo 6 caracteres" required minlength="6">
                    </div>
                    <br>
                    <div>
                        <label for="m-repetir-senha">Repetir Senha:</label>
                        <input type="password" id="m-repetir-senha" placeholder="Confirme sua senha" required>
                    </div>
                    <br>
                    <button type="submit" style="background-color: #28a745; width: 100%;">Finalizar Cadastro</button>
                    <button type="button" class="btn-secondary" onclick="fecharModal()" style="width: 100%; margin-top: 10px;">Voltar</button>
                </form>
            </div>
        `;

        document.body.classList.add('no-scroll');
        modal.classList.remove('hidden');

        const form = document.getElementById('form-cadastro-modal');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const nome = document.getElementById('m-nome').value;
            const email = document.getElementById('m-email').value;
            const senha = document.getElementById('m-senha').value;
            const repetir = document.getElementById('m-repetir-senha').value;

            if (senha !== repetir) {
                alert("❌ Erro: As senhas não coincidem.");
                return;
            }

            await salvar('usuarios', { id: Date.now(), nome, email, senha, funcao: 'Visitante', dataCadastro: new Date().toISOString() });
            alert("✅ Conta criada com sucesso! Use seu e-mail e senha para logar.");
            fecharModal();
        };
    };

    // --- Sistema de Cadastro de Restaurante em Modal ---
    window.abrirModalCadastroRestaurante = function() {
        const modal = getOrCreateModal();
        
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>🏢 Cadastre seu Restaurante</h2>
                    <button onclick="fecharModal()">&times;</button>
                </div>
                <form id="form-cadastro-restaurante-modal" style="text-align: left;">
                    <div>
                        <label for="m-rest-nome">Nome do Restaurante (obrigatório):</label>
                        <input type="text" id="m-rest-nome" placeholder="Ex: Sabor & Cia" required>
                    </div>
                    <br>
                    <div>
                        <label for="m-rest-resp">Nome do Responsável (obrigatório):</label>
                        <input type="text" id="m-rest-resp" placeholder="Seu nome completo" required>
                    </div>
                    <br>
                    <div>
                        <label for="m-rest-cnpj">CNPJ / MEI (opcional):</label>
                        <input type="text" id="m-rest-cnpj" placeholder="00.000.000/0000-00">
                    </div>
                    <br>
                    <div>
                        <label for="m-rest-end">Endereço Completo (obrigatório):</label>
                        <input type="text" id="m-rest-end" placeholder="Rua, Número, Bairro, Cidade" required>
                    </div>
                    <br>
                    <div>
                        <p style="margin-bottom: 5px; font-weight: bold;">Tipo de Cozinha (obrigatório):</p>
                        <label><input type="radio" name="m-tipo-cozinha" value="brasileira" required> Brasileira</label><br>
                        <label><input type="radio" name="m-tipo-cozinha" value="italiana"> Italiana</label><br>
                        <label><input type="radio" name="m-tipo-cozinha" value="japonesa"> Japonesa</label><br>
                        <label><input type="radio" name="m-tipo-cozinha" value="lanchonete"> Lanchonete/Fast Food</label><br>
                        <label><input type="radio" name="m-tipo-cozinha" value="outros"> Outros</label>
                    </div>
                    <br>
                    <div>
                        <label for="m-rest-tel">Telefone de Contato (obrigatório):</label>
                        <input type="tel" id="m-rest-tel" placeholder="(00) 00000-0000" required>
                    </div>
                    <br>
                    <button type="submit" style="width: 100%;">Finalizar Cadastro</button>
                    <button type="button" class="btn-secondary" onclick="fecharModal()" style="width: 100%; margin-top: 10px;">Voltar</button>
                </form>
            </div>
        `;

        document.body.classList.add('no-scroll');
        modal.classList.remove('hidden');

        const form = document.getElementById('form-cadastro-restaurante-modal');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const novoRestaurante = {
                id: Date.now(),
                nomeFantasia: document.getElementById('m-rest-nome').value,
                responsavel: document.getElementById('m-rest-resp').value,
                documento: document.getElementById('m-rest-cnpj').value,
                endereco: document.getElementById('m-rest-end').value,
                tipoCozinha: document.querySelector('input[name="m-tipo-cozinha"]:checked').value,
                telefone: document.getElementById('m-rest-tel').value,
                status: 'pendente',
                dataSolicitacao: new Date().toISOString()
            };

            await salvar('restaurantes', novoRestaurante);
            alert("✅ Solicitação enviada! Aguarde a moderação do programador.");
            fecharModal();
        };
    };

    // --- Sistema de Gestão de Estoque em Modal (Cozinha) ---
    window.abrirModalEstoque = async function() {
        const modal = getOrCreateModal();
        const produtos = await buscarTodos('produtos') || [];

        const listaHtml = produtos.length > 0 ? `
            <ul class="lista-controle" style="text-align: left; margin-top: 15px;">
                ${produtos.map(p => `
                    <li class="${p.esgotado ? 'item-esgotado' : ''}">
                        <span>${p.nome}</span>
                        <button type="button" class="btn-small ${p.esgotado ? 'btn-reativar' : 'btn-esgotado'}" 
                            onclick="toggleStatusProduto(${p.id})">
                            ${p.esgotado ? 'Reativar' : 'Marcar Esgotado'}
                        </button>
                    </li>
                `).join('')}
            </ul>
        ` : '<p style="text-align:center; color:#666; margin-top:20px;">Nenhum produto cadastrado no cardápio.</p>';

        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>📦 Controle de Estoque</h2>
                    <button onclick="fecharModal()">&times;</button>
                </div>
                <p style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">Marque os itens indisponíveis. Eles serão ocultados automaticamente para os garçons.</p>
                <div style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
                    ${listaHtml}
                </div>
                <button type="button" class="btn-secondary" style="width:100%; margin-top:20px;" onclick="fecharModal()">Voltar ao Painel</button>
            </div>
        `;
        modal.classList.remove('hidden');
        document.body.classList.add('no-scroll');
    };

    window.toggleStatusProduto = async function(id) {
        const produtos = await buscarTodos('produtos');
        const produto = produtos.find(p => p.id === id);
        if (produto) {
            produto.esgotado = !produto.esgotado;
            await atualizarItem('produtos', produto);
            abrirModalEstoque(); // Atualiza a lista dentro do modal
        }
    };

    // --- Sistema de Testes de Visualização em Modal (Programador) ---
    window.abrirModalTestesVisualizacao = function() {
        const modal = getOrCreateModal();
        
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>🧪 Atalhos de Teste (Navegação)</h2>
                    <button onclick="fecharModal()">&times;</button>
                </div>
                <p style="margin-bottom: 20px; color: #666;">Selecione uma interface para testar o fluxo do sistema:</p>
                
                <div class="admin-nav" style="display: flex; flex-direction: column; gap: 10px;">
                    <a href="/login" style="text-decoration:none;"><button type="button" style="width:100%">🏠 Home / Login</button></a>
                    <a href="/admin/painel" style="text-decoration:none;"><button type="button" style="width:100%">💼 Painel Admin (Dono)</button></a>
                    <a href="/garcom/painel" style="text-decoration:none;"><button type="button" style="width:100%">📝 Painel Garçom</button></a>
                    <a href="/cozinha/painel" style="text-decoration:none;"><button type="button" style="width:100%">🍳 Painel Cozinha</button></a>
                </div>

                <button type="button" class="btn-secondary" style="width:100%; margin-top:20px;" onclick="fecharModal()">Fechar</button>
            </div>
        `;
        modal.classList.remove('hidden');
        document.body.classList.add('no-scroll');
    };

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