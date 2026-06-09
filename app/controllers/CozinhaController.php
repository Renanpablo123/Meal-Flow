<?php

class CozinhaController {
    public function showPainel() {
        echo "<h1>Painel da Cozinha</h1>";
        echo "<p>Fila de pedidos em tempo real.</p>";
        echo "<a href='/logout'>Sair</a>";
    }
}