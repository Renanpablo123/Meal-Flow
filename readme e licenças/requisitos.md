Nome do Projeto: MealFlow
Documento: DRF-2026-001 Versão: 1.3 (Detalhamento Técnico) Status: Especificação Final Autor: Analista de Requisitos (IA)

1. Contexto e Perfis
O MealFlow é uma plataforma multitenant (vários estabelecimentos) focada na eficiência operacional.

Perfis de Acesso:
Visitante: Usuário logado mas sem restaurante ou sem função atribuída.

Dono (Admin): Poder total sobre o cardápio, equipe e finanças da sua unidade.

Garçom: Responsável pela abertura, acompanhamento e entrega de pedidos.

Cozinha: Foco exclusivo na fila de produção e controle de estoque (indisponibilidade).

2. Requisitos Funcionais (RF)
RF01 - Onboarding e Validação de Unidade
Descrição: Fluxo inicial de entrada no sistema.

Funcionalidades:

Seleção de Papel: O usuário escolhe entre "Cadastrar meu Restaurante" ou "Vincular-me a um Restaurante".

Cadastro do Negócio: O dono informa Nome Fantasia, Telefone e Endereço. O campo CNPJ/MEI é opcional.

Upload de Documentação: Campo para upload de foto de ID (RG/CNH) e foto do estabelecimento/cardápio para moderação.

Status de Aprovação: Enquanto a equipe MealFlow não aprovar, o usuário visualiza apenas uma tela de "Aguardando Moderação".

RF02 - Gestão de Equipe (Painel Admin)
Descrição: O Admin gerencia quem trabalha no seu restaurante.

Funcionalidades:

Aprovação de Membros: Lista de usuários que solicitaram vínculo ao restaurante.

Atribuição de Cargos: Menu dropdown para definir se o usuário aprovado será "Garçom", "Cozinha" ou "Admin".

Revogação: Opção de desativar o acesso de um funcionário.

RF03 - Gestão de Cardápio e Seções
Descrição: Cadastro de produtos organizados por categorias.

Funcionalidades:

Categorização: Criação de seções (ex: "Entradas", "Bebidas", "Sobremesas").

CRUD de Itens: Cadastro de Nome, Preço (formato decimal), Descrição/Ingredientes (opcional) e Foto (opcional).

Chave de Disponibilidade: Um botão toggle (ligar/desligar) para cada item. Se desligado, o item desaparece da lista de pedidos do garçom, mas permanece no banco de dados.

RF04 - Lançamento de Pedidos (Interface do Garçom)
Descrição: Processo de anotação digital do pedido.

Funcionalidades:

Identificação: Campos para ID da Mesa, Nome do Cliente e Telefone (opcionais).

Seleção: Lista de itens com checkbox. Ao marcar, libera o campo "Quantidade" e um campo de texto "Observação do Item" (ex: "Sem gelo", "Bem passado").

Revisão: Antes de enviar, o sistema mostra o resumo dos itens selecionados.

RF05 - Painel de Produção (Interface da Cozinha)
Descrição: Visualização e controle do que deve ser preparado.

Funcionalidades:

Fila de Pedidos: Cards contendo o ID do pedido, Horário do lançamento e os itens com suas respectivas observações.

Atualização de Status: Botão "Iniciar Preparo" e Botão "Marcar como Pronto".

Cancelamento: Botão para cancelar o pedido (apenas se estiver em preparo), exigindo uma breve justificativa.

RF06 - Central de Notificações
Descrição: Alerta para o garçom sobre pratos finalizados.

Funcionalidades:

Notificação Push/Pop-up: Quando a cozinha clica em "Pronto", o dispositivo do garçom emite um alerta visual e sonoro/vibratório.

Lista de Prontos: Uma aba onde o garçom vê todos os IDs de pedidos que aguardam retirada.

RF07 - Fechamento e Levantamento de Dados
Descrição: Finalização financeira e estatística.

Funcionalidades:

Status de Pagamento: Ao entregar o pedido, o usuário seleciona se foi "Pago" ou "Não Pago" (pendente/fiado).

Dashboard Admin: Gráficos simples ou cards com: Total vendido no dia, Média mensal e Ranking dos 5 itens mais pedidos.

Exportação: Botão para gerar arquivo (CSV/PDF) com o histórico de pedidos do período selecionado.

3. Regras de Negócio (RN)
RN01: O ID do pedido deve ser único e gerado apenas após a confirmação do garçom.

RN02: Um garçom não pode editar um pedido que a cozinha já marcou como "Pronto".

RN03: O sistema deve impedir que um usuário seja Admin de dois restaurantes diferentes simultaneamente com o mesmo e-mail.

RN04: Pedidos marcados como "Não Pago" devem ser destacados no histórico para cobrança futura.

4. Requisitos Não-Funcionais (RNF)
RNF01 (Usabilidade): O sistema deve ser responsivo, com botões grandes para facilitar o uso em telas touch (celulares).

RNF02 (Confiabilidade): As fotos enviadas para cadastro de restaurante devem ser armazenadas em servidor seguro e não ser públicas.

RNF03 (Performance): A atualização da lista da cozinha deve ocorrer de forma automática (via WebSockets ou polling curto) para evitar atrasos.