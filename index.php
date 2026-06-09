<?php

// public/index.php

/**
 * Este é o ponto de entrada único (Front Controller) da aplicação.
 * Todas as requisições são direcionadas para este arquivo via .htaccess.
 */

// Se o index.php estiver na RAIZ junto com o router.php, use:
require_once __DIR__ . '/router.php';

// Se você mover o index.php para uma pasta chamada 'public', use:
// require_once __DIR__ . '/../router.php';
?>