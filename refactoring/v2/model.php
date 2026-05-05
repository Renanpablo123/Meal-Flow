<?php

class Pedido {
    private $data = [];

    public function __set($name, $value) {
        $this->data[$name] = $value;
    }

    public function __get($name) {
        return $this->data[$name] ?? null;
    }

    public function __isset($name) {
        return isset($this->data[$name]);
    }

    public function toArray() {
        return $this->data;
    }
}
