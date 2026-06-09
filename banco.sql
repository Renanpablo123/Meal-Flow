-- Criar o banco de dados se não existir
CREATE DATABASE IF NOT EXISTS mealflow_db;
USE mealflow_db;

-- 1. Tabela de Restaurantes (Estabelecimentos)
CREATE TABLE IF NOT EXISTS restaurantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_fantasia VARCHAR(255) NOT NULL,
    responsavel VARCHAR(255) NOT NULL,
    documento VARCHAR(50), -- CNPJ ou CPF
    endereco TEXT NOT NULL,
    tipo_cozinha VARCHAR(100),
    telefone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, ativo, suspenso, rejeitado
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabela de Usuários (Funcionários e Visitantes)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurante_id INT DEFAULT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    funcao VARCHAR(50) DEFAULT 'Visitante', -- Visitante, Admin, Garçom, Cozinha
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabela de Categorias do Cardápio
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurante_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabela de Produtos (Itens do Cardápio)
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    esgotado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurante_id INT NOT NULL,
    mesa VARCHAR(50),
    cliente VARCHAR(255),
    telefone_cliente VARCHAR(20),
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'aguardando', -- aguardando, preparando, pronto, entregue, cancelado
    status_pagamento VARCHAR(50) DEFAULT 'pendente', -- pago, nao_pago
    motivo_cancelamento TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_entrega TIMESTAMP NULL,
    FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabela de Itens do Pedido (Relacional muitos-para-muitos)
CREATE TABLE IF NOT EXISTS pedido_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    observacao TEXT,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================
-- DADOS INICIAIS PARA TESTE
-- ==========================================================

-- Inserir um restaurante de teste aprovado
INSERT INTO restaurantes (nome_fantasia, responsavel, endereco, status) 
VALUES ('Restaurante Modelo', 'Admin Principal', 'Rua Central, 01', 'ativo');

-- Inserir o Super Usuário (Admin) vinculado ao restaurante 1
-- Nota: Em produção, as senhas devem ser criptografadas (password_hash)
INSERT INTO usuarios (restaurante_id, nome, email, senha, funcao) 
VALUES (1, 'Administrador do Sistema', 'admin@mealflow.com', 'admin123', 'Admin');

-- Inserir algumas categorias e produtos para o Garçom testar
INSERT INTO categorias (restaurante_id, nome) VALUES (1, 'Bebidas'), (1, 'Pratos Principais');

INSERT INTO produtos (categoria_id, nome, preco) VALUES 
(1, 'Suco de Laranja 500ml', 12.00),
(1, 'Água Mineral', 5.00),
(2, 'Almoço Executivo', 35.50);