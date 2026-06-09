<?php

// app/views/auth/login.php

/**
 * Função para renderizar a view de login.
 * @param array $data Dados a serem passados para a view (ex: mensagens de erro).
 */
function renderLoginView($data = []) {
    // Inclui o cabeçalho comum (se houver)
    // require_once __DIR__ . '/../layout/header.php';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MealFlow - Login</title>
    <link rel="stylesheet" href="/css/style.css"> <!-- Assumindo que você terá um CSS público -->
</head>
<body>
    <div class="login-container">
        <h2>Login MealFlow</h2>
        <?php if (isset($data['error'])): ?>
            <p style="color: red;"><?= htmlspecialchars($data['error']) ?></p>
        <?php endif; ?>
        <form action="/login" method="POST">
            <input type="email" name="email" placeholder="Seu e-mail" required>
            <input type="password" name="senha" placeholder="Sua senha" required>
            <button type="submit">Entrar</button>
        </form>
        <p>Não tem conta? <a href="/register">Cadastre-se</a></p>
        <p>É um restaurante? <a href="/visitante/cadastro-restaurante">Cadastre seu restaurante</a></p>
    </div>
</body>
</html>
<?php
    // Inclui o rodapé comum (se houver)
    // require_once __DIR__ . '/../layout/footer.php';
}
?>