<?php

// router.php

/**
 * Sistema de roteamento simples para a aplicação MealFlow.
 * Mapeia URLs para controladores e ações.
 */

// Inicia a sessão PHP para gerenciar o estado do usuário
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Inclui os controladores e middlewares necessários
require_once __DIR__ . '/app/controllers/AuthController.php';
require_once __DIR__ . '/app/controllers/AdminController.php';
require_once __DIR__ . '/app/controllers/GarcomController.php';
require_once __DIR__ . '/app/controllers/CozinhaController.php';

require_once __DIR__ . '/app/middlewares/AuthMiddleware.php';
require_once __DIR__ . '/app/middlewares/RoleMiddleware.php';

// Obtém a URI da requisição e remove a barra inicial/final
$requestUri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

// Define as rotas
switch ($requestUri) {
    // Rotas de Autenticação
    case 'login':
        $controller = new AuthController();
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller->login();
        } else {
            $controller->showLogin();
        }
        break;
    case 'logout':
        $controller = new AuthController();
        $controller->logout();
        break;
    case 'register':
        // Implementar showRegister e register POST
        echo "Página de Registro (a ser implementada)";
        break;

    // Rotas do Painel Administrativo
    case 'admin/painel':
        AuthMiddleware::handle();
        RoleMiddleware::handle(['Admin']);
        $controller = new AdminController();
        $controller->showPainel();
        break;

    // Rotas do Painel do Garçom
    case 'garcom/painel':
        AuthMiddleware::handle();
        RoleMiddleware::handle(['Garçom']);
        $controller = new GarcomController();
        $controller->showPainel();
        break;

    // ... outras rotas para cozinha, visitante, APIs, etc.

    default:
        // Rota padrão, talvez uma página inicial ou redirecionamento para login
        header('Location: /login');
        break;
}