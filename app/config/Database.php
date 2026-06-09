<?php

class Database {
    private static $conn;

    public static function getConnection() {
        if (self::$conn === null) {
            try {
                // __DIR__ aponta para app/config. 
                // Precisamos subir dois níveis para chegar na raiz do Meal-Flow
                $dbPath = __DIR__ . '/../../database.sqlite';
                self::$conn = new PDO("sqlite:" . $dbPath);
                self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            } catch (PDOException $exception) {
                error_log("Erro SQLite: " . $exception->getMessage());
                die("Erro de conexão com o banco de dados.");
            }
        }
        return self::$conn;
    }
}