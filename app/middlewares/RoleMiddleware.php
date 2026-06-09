<?php

class RoleMiddleware {
    public static function handle(array $allowedRoles) {
        $userRole = $_SESSION['user']['funcao'] ?? '';
        if (!in_array($userRole, $allowedRoles)) {
            die("Acesso negado para o seu nível de permissão.");
        }
    }
}