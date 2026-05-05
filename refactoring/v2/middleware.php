<?php

function sanitizeInput($data) {
    $sanitized = [];
    foreach ($data as $key => $value) {
        $sanitized[$key] = htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
    }
    return $sanitized;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $_POST = sanitizeInput($_POST);
}
