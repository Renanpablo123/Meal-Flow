<?php

// app/services/AuthService.php

require_once __DIR__ . '/../models/UsuarioModel.php';

/**
 * Lógica de negócio para autenticação e registro de usuários.
 * Interage com o UsuarioModel para persistência.
 */
class AuthService {
    private $usuarioModel;

    public function __construct() {
        $this->usuarioModel = new UsuarioModel();
    }

    /**
     * Tenta autenticar um usuário.
     * @param string $email O email do usuário.
     * @param string $senha A senha em texto puro.
     * @return array|false O usuário autenticado (sem a senha) ou false em caso de falha.
     */
    public function login($email, $senha) {
        $usuario = $this->usuarioModel->findByEmail($email);

        // Verificação segura usando hash (ajustar no cadastro depois)
        // Se você ainda usa texto puro do banco.sql, mantenha o === temporariamente
        if ($usuario && ($senha === $usuario['senha'] || password_verify($senha, $usuario['senha']))) {
            unset($usuario['senha']); // Remove a senha antes de retornar
            return $usuario;
        }
        return false;
    }

    /**
     * Registra um novo usuário.
     * @param string $nome Nome completo do usuário.
     * @param string $email Email do usuário.
     * @param string $senha Senha em texto puro.
     * @param string $funcao Função inicial (ex: 'Visitante').
     * @return int O ID do novo usuário ou false em caso de falha.
     */
    public function register($nome, $email, $senha, $funcao = 'Visitante') {
        // A senha deve ser hashed antes de salvar no banco de dados
        // Ex: $hashedSenha = password_hash($senha, PASSWORD_DEFAULT);
        return $this->usuarioModel->create(['nome' => $nome, 'email' => $email, 'senha' => $senha, 'funcao' => $funcao]);
    }
}