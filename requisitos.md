Nome do Projeto: MealFlow
Documento: DRF-2026-001 Versão: 1.0 Status: Especificação Inicial Autor: Analista de Requisitos (IA)

1. Contexto
Problema: Erros e lentidão em processos manuais (papel) em estabelecimentos alimentícios, gerando falhas de comunicação entre garçom e cozinha e perda de dados de vendas.

Usuários: * Administrador: Gerencia cardápio, usuários, atribui funções e acessa relatórios.

Garçom: Registra pedidos, gerencia quantidades e entrega produtos.

Cozinha: Visualiza fila de pedidos e atualiza o status de preparo.

Padrão: Usuário recém-cadastrado sem permissões de acesso.

Valor: Digitalização acessível para pequenos estabelecimentos, garantindo organização, rastreabilidade via ID único e controle financeiro básico.

2. Requisitos Funcionais (RF)
RF01 - Gestão de Perfis e Acesso
Descrição: O sistema deve permitir o cadastro de funcionários e a atribuição de funções pelo administrador. Regras:

O acesso às abas (Garçom, Cozinha, Admin) é bloqueado até que o Administrador atribua uma função.

Cada funcionário possui login e senha individuais. Critério de Aceite:

[ ] Validar bloqueio de abas para perfil "Padrão".

[ ] Validar login individual por CPF ou E-mail.

RF02 - Gerenciamento de Cardápio
Descrição: O Administrador deve cadastrar itens oferecidos pelo estabelecimento. Regras:

Atributos: Nome, Preço (obrigatórios); Descrição/Ingredientes e Foto (opcionais).

Organização: Os itens devem ser agrupados por categorias (Bebidas, Pratos, Porções, etc.).

Controle: Possibilidade de marcar itens como "Indisponível" sem excluí-los. Critério de Aceite:

[ ] Itens marcados como indisponíveis não devem aparecer para o garçom.

RF03 - Registro de Pedidos

Descrição: O garçom deve registrar os pedidos através de uma interface de seleção. Regras:

Seleção via checkbox com campo de "quantidade" (padrão 1).

Campo de "observação individual" para cada item selecionado.

Geração automática de ID único para cada pedido.

A cozinha visualiza pedidos "Em Preparo".
Somente a cozinha pode gerar o cancelamento de pedidos em fase de preparo após aviso do garçom. Critério de Aceite:

[ ] Validar disparo da notificação push/pop-up no perfil do garçom.

RF05 - Levantamento e Exportação de Dados
Descrição: O administrador deve acessar métricas e exportar o histórico. Regras:

Exibir valor total arrecadado (dia/mês) e itens mais vendidos por período.

Permitir download do histórico em formato offline (ex: CSV ou PDF). Critério de Aceite:

[ ] Verificar se o download contém os dados filtrados em tela.

3. Regras de Negócio (RN)
RN01 (Cancelamento): Pedidos já marcados como "Pronto" ou "Entregue" não podem ser cancelados no sistema para fins de auditoria.

RN02 (Descarte): Itens com erro de produção que já saíram da cozinha devem ser registrados como perda, mas o novo pedido pode ser isento de cobrança conforme decisão do administrador.

RN03 (Finalização): Ao finalizar um pedido, o status deve ser obrigatoriamente classificado como "Pago" ou "Não Pago" antes de ir para o histórico.

4. Requisitos Não-Funcionais (RNF)
RNF01 (Disponibilidade): A aplicação deve ser Web e acessível via dispositivos móveis (Design Responsivo).

RNF02 (Segurança): Dados de faturamento devem ser visíveis apenas para o perfil "Administrador".

RNF03 (Performance): A atualização de status entre cozinha e garçom deve ocorrer em tempo real (baixa latência).
Ao marcar como "Pronto", o garçom recebe notificação visual (Pop-up) e sonora/vibratória.

RF04 - Gestão de Status e Notificações
Descrição: O fluxo do pedido deve seguir os estados: Criado -> Em Preparo -> Pronto -> Entregue -> Finalizado. Regras:

Campos opcionais de identificação: Mesa, Nome do Cliente e Telefone. Critério de Aceite:

[ ] Validar geração de ID único sequencial ou aleatório não repetível.
