<?php

class AuthService {
    public function login($email, $senha) {
        // Mock para teste inicial.
        if ($email === 'admin@mealflow.com' && $senha === 'admin123') {
            return [
                'nome' => 'Administrador',
                'funcao' => 'Admin'
            ];
        }
        return false;
    }
}