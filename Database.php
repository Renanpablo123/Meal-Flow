<?php

// app/config/database.php

/**
 * Configuração e conexão com o banco de dados.
 * Utiliza PDO para uma conexão segura e flexível.
 */
class Database {
    private static $host = 'localhost';
    private static $db_name = 'mealflow_db'; // Nome do seu banco de dados
    private static $username = 'root';       // Seu usuário do banco de dados
    private static $password = '';           // Sua senha do banco de dados
    private static $conn;

    /**
     * Obtém a instância da conexão PDO.
     * @return PDO A conexão PDO.
     */
    public static function getConnection() {
        if (self::$conn === null) {
            try {
                self::$conn = new PDO("mysql:host=" . self::$host . ";dbname=" . self::$db_name, self::$username, self::$password);
                self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // Retorna arrays associativos por padrão
            } catch (PDOException $exception) {
                error_log("Erro de conexão com o banco de dados: " . $exception->getMessage());
                die("Erro de conexão com o banco de dados. Por favor, tente novamente mais tarde.");
            }
        }
        return self::$conn;
    }
}