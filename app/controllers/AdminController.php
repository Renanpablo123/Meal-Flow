<?php

class AdminController {
    public function showPainel() {
        // Em um sistema real, aqui você carregaria uma view
        echo "<h1>Painel Administrativo</h1>";
        echo "<p>Bem-vindo ao centro de controle do MealFlow.</p>";
        echo "<a href='/logout'>Sair</a>";
    }
}