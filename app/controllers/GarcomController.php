<?php

class GarcomController {
    public function showPainel() {
        echo "<h1>Painel do Garçom</h1>";
        echo "<p>Aqui você pode gerenciar pedidos e mesas.</p>";
        echo "<a href='/logout'>Sair</a>";
    }
}