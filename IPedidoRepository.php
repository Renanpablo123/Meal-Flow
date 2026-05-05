<?php

interface IPedidoRepository {
    public function save(Pedido $pedido);
    public function find($id);
    public function delete($id);
    public function all();
}
