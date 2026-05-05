<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>MealFlow - Pedidos</title>
</head>
<body>
    <h1>Lançar Novo Pedido</h1>
    
    <?php if (isset($error)): ?>
        <p style="color: red;"><?php echo $error; ?></p>
    <?php endif; ?>

    <?php if (isset($_GET['success'])): ?>
        <p style="color: green;">Pedido realizado com sucesso!</p>
    <?php endif; ?>

    <form action="index.php?action=store" method="POST">
        <label>Mesa:</label>
        <input type="number" name="mesa">
        <br>
        <label>Cliente:</label>
        <input type="text" name="nome_cliente">
        <br>
        <button type="submit">Enviar Pedido</button>
    </form>

    <hr>

    <h2>Fila de Pedidos</h2>
    <ul>
        <?php foreach ($pedidos as $pedido): ?>
            <li>
                Pedido #<?php echo $pedido->id; ?> - 
                Mesa: <?php echo $pedido->mesa; ?> - 
                Status: <?php echo $pedido->status; ?>
            </li>
        <?php endforeach; ?>
    </ul>
</body>
</html>
