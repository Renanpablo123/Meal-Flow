<?php

// app/controllers/AuthController.php
require_once __DIR__ . '/../services/AuthService.php';

class AuthController {
    private $authService;

    public function __construct() {
        $this->authService = new AuthService();
    }

    public function showLogin() {
        // Caminho relativo para a view de login
        $viewPath = __DIR__ . '/../views/login_aba.html';
        if (file_exists($viewPath)) {
            include $viewPath;
        } else {
            die("Erro Crítico: A view de login não foi encontrada em: " . $viewPath);
        }
    }

    public function login() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $email = $_POST['email'] ?? '';
            $senha = $_POST['senha'] ?? '';

            $usuario = $this->authService->login($email, $senha);

            if ($usuario) {
                $_SESSION['user'] = $usuario;
                $this->redirectByUserRole($usuario['funcao']);
            } else {
                echo "Credenciais inválidas.";
            }
        }
    }

    private function redirectByUserRole($role) {
        switch ($role) {
            case 'Admin': header('Location: /admin/painel'); break;
            case 'Garçom': header('Location: /garcom/painel'); break;
            case 'Cozinha': header('Location: /cozinha/painel'); break;
            default: header('Location: /login'); break;
        }
        exit();
    }

    public function logout() {
        if (session_status() == PHP_SESSION_NONE) session_start();
        session_destroy();
        header('Location: /login');
        exit();
    }
}