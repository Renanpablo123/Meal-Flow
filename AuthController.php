<?php

// app/controllers/AuthController.php

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../views/auth/login.php';
require_once __DIR__ . '/../views/auth/register.php';

/**
 * Controlador para gerenciar a autenticação e registro de usuários.
 * Lida com as requisições HTTP relacionadas a login e cadastro.
 */
class AuthController {
    private $authService;

    public function __construct() {
        $this->authService = new AuthService();
    }

    /**
     * Exibe a página de login.
     */
    public function showLogin() {
        renderLoginView(); // Função auxiliar para renderizar a view
    }

    /**
     * Processa a tentativa de login.
     */
    public function login() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $email = $_POST['email'] ?? '';
            $senha = $_POST['senha'] ?? '';

            $usuario = $this->authService->login($email, $senha);

            if ($usuario) {
                $_SESSION['user'] = $usuario; // Armazena o usuário na sessão
                // Redireciona com base na função do usuário
                switch ($usuario['funcao']) {
                    case 'Admin': header('Location: /admin/painel'); break;
                    case 'Garçom': header('Location: /garcom/painel'); break;
                    case 'Cozinha': header('Location: /cozinha/painel'); break;
                    default: header('Location: /visitante/painel'); break;
                }
                exit();
            } else {
                // Erro de login
                renderLoginView(['error' => 'Email ou senha inválidos.']);
            }
        }
    }

    /**
     * Realiza o logout do usuário.
     */
    public function logout() {
        session_destroy();
        header('Location: /login');
        exit();
    }
}