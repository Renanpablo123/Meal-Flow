<?php

// app/middlewares/RoleMiddleware.php

/**
 * Middleware para verificar as permissões (função) do usuário.
 */
class RoleMiddleware {
    /**
     * Verifica se o usuário logado possui uma das funções permitidas.
     * @param array $allowedRoles Array de strings com as funções permitidas (ex: ['Admin', 'Garçom']).
     */
    public static function handle(array $allowedRoles) {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['user']) || !in_array($_SESSION['user']['funcao'], $allowedRoles)) {
            // Se a requisição for AJAX, retorna um status de erro
            if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
                http_response_code(403); // Forbidden
                echo json_encode(['error' => 'Acesso negado. Você não tem permissão para esta ação.']);
                exit();
            }
            // Redireciona para uma página de erro ou para o painel do usuário
            error_log("Tentativa de acesso não autorizado. Usuário: " . ($_SESSION['user']['email'] ?? 'N/A') . ", Função: " . ($_SESSION['user']['funcao'] ?? 'N/A') . ", Rotas permitidas: " . implode(', ', $allowedRoles));
            header('Location: /'); // Redireciona para a home ou painel padrão
            exit();
        }
    }
}