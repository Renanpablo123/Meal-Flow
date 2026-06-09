# Estrutura SQL - MealFlow

Este documento representa a arquitetura de dados e as operações SQL equivalentes ao sistema atualmente baseado em IndexedDB.

## 1. Definição das Tabelas (DDL)

```sql
-- Tabela de Estabelecimentos (Multitenant)
CREATE TABLE restaurantes (
    id SERIAL PRIMARY KEY,
    nome_fantasia VARCHAR(255) NOT NULL,
    responsavel VARCHAR(255) NOT NULL,
    documento VARCHAR(50), -- CNPJ ou CPF
    endereco TEXT NOT NULL,
    tipo_cozinha VARCHAR(100),
    telefone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, ativo, suspenso, rejeitado
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários e Funcionários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    restaurante_id INT REFERENCES restaurantes(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    funcao VARCHAR(50) DEFAULT 'Visitante', -- Visitante, Admin, Garçom, Cozinha
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias do Cardápio
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    restaurante_id INT REFERENCES restaurantes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL
);

-- Tabela de Produtos (Itens do Cardápio)
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    categoria_id INT REFERENCES categorias(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    esgotado BOOLEAN DEFAULT FALSE
);

-- Tabela de Pedidos (Cabeçalho)
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    restaurante_id INT REFERENCES restaurantes(id),
    mesa VARCHAR(50),
    cliente VARCHAR(255),
    telefone_cliente VARCHAR(20),
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'aguardando', -- aguardando, preparando, pronto, entregue, cancelado
    status_pagamento VARCHAR(50) DEFAULT 'pendente', -- pago, nao_pago
    motivo_cancelamento TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_entrega TIMESTAMP
);

-- Tabela de Itens do Pedido (Relacional para o array 'itens' do IndexedDB)
CREATE TABLE pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id INT REFERENCES produtos(id),
    quantidade INT NOT NULL,
    observacao TEXT,
    subtotal DECIMAL(10, 2) NOT NULL
);
```

## 2. Operações do Sistema (DML)

### A. Fluxo do Visitante e Programador (Onboarding)
```sql
-- Visitante cadastra um novo restaurante
INSERT INTO restaurantes (nome_fantasia, responsavel, documento, endereco, tipo_cozinha, telefone)
VALUES ('Sabor & Cia', 'João Silva', '12.345.678/0001-99', 'Rua das Flores, 123', 'brasileira', '(11) 98888-7777');

-- Programador aprova um restaurante pendente
UPDATE restaurantes SET status = 'ativo' WHERE id = 1;

-- Visitante cria sua conta inicial
INSERT INTO usuarios (nome, email, senha, funcao) 
VALUES ('João Silva', 'joao@email.com', 'senha123', 'Visitante');
```

### B. Painel Administrativo (Gestão)
```sql
-- Admin cadastra um funcionário (Garçom)
INSERT INTO usuarios (restaurante_id, nome, email, senha, funcao)
VALUES (1, 'Carlos Garçom', 'carlos@restaurante.com', '123456', 'Garçom');

-- Admin cria uma categoria e um produto
INSERT INTO categorias (restaurante_id, nome) VALUES (1, 'Bebidas');
INSERT INTO produtos (categoria_id, nome, preco) VALUES (1, 'Suco de Laranja', 12.50);
```

### C. Painel do Garçom (Operação)
```sql
-- Listar produtos disponíveis (não esgotados) para o novo pedido
SELECT p.* FROM produtos p 
JOIN categorias c ON p.categoria_id = c.id 
WHERE c.restaurante_id = 1 AND p.esgotado = FALSE;

-- Criar um novo pedido
INSERT INTO pedidos (restaurante_id, mesa, cliente, total, status)
VALUES (1, 'Mesa 05', 'Maria Oliveira', 45.00, 'aguardando');

-- Adicionar itens ao pedido (Loop para cada item selecionado)
INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, observacao, subtotal)
VALUES (101, 5, 2, 'Sem gelo', 25.00);
```

### D. Painel da Cozinha (Produção)
```sql
-- Buscar fila de pedidos ativos (Polling de 3s)
SELECT * FROM pedidos 
WHERE restaurante_id = 1 AND status IN ('aguardando', 'preparando')
ORDER BY data_criacao ASC;

-- Iniciar preparo ou Marcar como pronto
UPDATE pedidos SET status = 'preparando' WHERE id = 101;
UPDATE pedidos SET status = 'pronto' WHERE id = 101;

-- Marcar produto como esgotado (Gestão de insumos)
UPDATE produtos SET esgotado = TRUE WHERE id = 5;
```

### E. Finalização e Histórico
```sql
-- Garçom finaliza entrega e define pagamento
UPDATE pedidos SET status = 'entregue', status_pagamento = 'pago', data_entrega = NOW() 
WHERE id = 101;
```