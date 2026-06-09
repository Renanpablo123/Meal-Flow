<?php

// app/middlewares/AuthMiddleware.php

/**
 * Middleware para verificar se o usuário está autenticado.
 */
class AuthMiddleware {
    /**
     * Verifica se há um usuário logado na sessão.
     * Se não houver, redireciona para a página de login.
     */
    public static function handle() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['user'])) {
            // Se a requisição for AJAX, retorna um status de erro
            if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
                http_response_code(401); // Unauthorized
                echo json_encode(['error' => 'Não autenticado.']);
                exit();
            }
            header('Location: /login');
            exit();
        }
    }
}