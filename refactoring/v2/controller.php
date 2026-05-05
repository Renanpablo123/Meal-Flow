<?php

class PedidoController {
    private $service;

    public function __construct(PedidoService $service) {
        $this->service = $service;
    }

    public function index() {
        $pedidos = $this->service->listarPedidos();
        require 'view.php';
    }

    public function store($request) {
        try {
            $this->service->criarPedido($request);
            header('Location: index.php?success=1');
            exit;
        } catch (BusinessRuleException $e) {
            $error = $e->getMessage();
            require 'view.php';
        } catch (Exception $e) {
            $error = "Ocorreu um erro inesperado: " . $e->getMessage();
            require 'view.php';
        }
    }
}
