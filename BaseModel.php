<?php

// app/models/BaseModel.php

require_once __DIR__ . '/../config/database.php';

/**
 * Classe base abstrata para todos os modelos.
 * Fornece métodos CRUD genéricos para interagir com o banco de dados.
 */
abstract class BaseModel {
    protected $table; // Nome da tabela no banco de dados
    protected $conn;  // Conexão PDO

    public function __construct($table) {
        $this->table = $table;
        $this->conn = Database::getConnection();
    }

    /**
     * Busca todos os registros da tabela.
     * @return array Array de registros.
     */
    public function findAll() {
        $stmt = $this->conn->prepare("SELECT * FROM " . $this->table);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Busca um registro pelo ID.
     * @param int $id O ID do registro.
     * @return array|false O registro encontrado ou false se não existir.
     */
    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM " . $this->table . " WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }

    /**
     * Insere um novo registro na tabela.
     * @param array $data Array associativo com os dados a serem inseridos.
     * @return int O ID do último registro inserido.
     */
    public function create(array $data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        $sql = "INSERT INTO " . $this->table . " ($columns) VALUES ($placeholders)";
        $stmt = $this->conn->prepare($sql);
        foreach ($data as $key => &$value) {
            $stmt->bindParam(':' . $key, $value);
        }
        $stmt->execute();
        return $this->conn->lastInsertId();
    }

    /**
     * Atualiza um registro existente.
     * @param int $id O ID do registro a ser atualizado.
     * @param array $data Array associativo com os dados a serem atualizados.
     * @return bool True em caso de sucesso, false caso contrário.
     */
    public function update($id, array $data) {
        $setClause = [];
        foreach ($data as $key => $value) {
            $setClause[] = "$key = :$key";
        }
        $sql = "UPDATE " . $this->table . " SET " . implode(', ', $setClause) . " WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id);
        foreach ($data as $key => &$value) {
            $stmt->bindParam(':' . $key, $value);
        }
        return $stmt->execute();
    }

    /**
     * Deleta um registro pelo ID.
     * @param int $id O ID do registro a ser deletado.
     * @return bool True em caso de sucesso, false caso contrário.
     */
    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM " . $this->table . " WHERE id = :id");
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}