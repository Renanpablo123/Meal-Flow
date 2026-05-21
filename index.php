<?php

require_once 'model.php';
require_once 'database/IPedidoRepository.php';
require_once 'database/PedidoRepository.php';
require_once 'service.php';
require_once 'controller.php';
require_once 'middleware.php';

// Simulação de Container de Injeção de Dependência
$repository = new PedidoRepository();
$service = new PedidoService($repository);
$controller = new PedidoController($service);

// Roteamento simples
$action = $_GET['action'] ?? 'index';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'store') {
    $controller->store($_POST);
} else {
    $controller->index();
}
