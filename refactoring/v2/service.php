<?php

require_once 'BusinessRuleException.php';

class PedidoService {
    private $repository;

    public function __construct(IPedidoRepository $repository) {
        $this->repository = $repository;
    }

    public function criarPedido($dados) {
        if (empty($dados['mesa'])) {
            throw new BusinessRuleException("A mesa deve ser informada.");
        }

        $pedido = new Pedido();
        $pedido->mesa = $dados['mesa'];
        $pedido->nome_cliente = $dados['nome_cliente'] ?? 'Cliente';
        $pedido->status = 'Aguardando';
        $pedido->pago = false;

        return $this->repository->save($pedido);
    }

    public function listarPedidos() {
        return $this->repository->all();
    }

    public function finalizarPreparo($id) {
        $pedido = $this->repository->find($id);
        if (!$pedido) {
            throw new BusinessRuleException("Pedido não encontrado.");
        }

        if ($pedido->status !== 'Em Preparo') {
            throw new BusinessRuleException("O pedido deve estar 'Em Preparo' para ser finalizado.");
        }

        $pedido->status = 'Pronto';
        return $this->repository->save($pedido);
    }
}
