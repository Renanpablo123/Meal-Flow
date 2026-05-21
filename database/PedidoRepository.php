<?php

require_once 'IPedidoRepository.php';
require_once 'Database.php';

class PedidoRepository implements IPedidoRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function save(Pedido $pedido) {
        if ($pedido->id) {
            $stmt = $this->db->prepare("UPDATE pedidos SET mesa = ?, nome_cliente = ?, status = ?, pago = ? WHERE id = ?");
            return $stmt->execute([$pedido->mesa, $pedido->nome_cliente, $pedido->status, $pedido->pago, $pedido->id]);
        } else {
            $stmt = $this->db->prepare("INSERT INTO pedidos (mesa, nome_cliente, status, pago) VALUES (?, ?, ?, ?)");
            $result = $stmt->execute([$pedido->mesa, $pedido->nome_cliente, $pedido->status, $pedido->pago]);
            if ($result) {
                $pedido->id = $this->db->lastInsertId();
            }
            return $result;
        }
    }

    public function find($id) {
        $stmt = $this->db->prepare("SELECT * FROM pedidos WHERE id = ?");
        $stmt->execute([$id]);
        $data = $stmt->fetch();
        
        if (!$data) return null;

        $pedido = new Pedido();
        foreach ($data as $key => $value) {
            $pedido->$key = $value;
        }
        return $pedido;
    }

    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM pedidos WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function all() {
        $stmt = $this->db->query("SELECT * FROM pedidos");
        $pedidos = [];
        while ($data = $stmt->fetch()) {
            $pedido = new Pedido();
            foreach ($data as $key => $value) {
                $pedido->$key = $value;
            }
            $pedidos[] = $pedido;
        }
        return $pedidos;
    }
}
