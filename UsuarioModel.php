<?php

// app/models/UsuarioModel.php

require_once 'BaseModel.php';

/**
 * Modelo para a tabela 'usuarios'.
 * Gerencia as operações de persistência para usuários e funcionários.
 */
class UsuarioModel extends BaseModel {
    public function __construct() {
        parent::__construct('usuarios');
    }

    /**
     * Busca um usuário pelo email.
     * @param string $email O email do usuário.
     * @return array|false O usuário encontrado ou false.
     */
    public function findByEmail($email) {
        $stmt = $this->conn->prepare("SELECT * FROM " . $this->table . " WHERE email = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return $stmt->fetch();
    }
    // Outros métodos específicos para usuários, como buscar por restaurante_id, etc.
}