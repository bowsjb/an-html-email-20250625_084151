<?php
declare(strict_types=1);
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/init.php';
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
$request = Request::fromGlobals();
$response = new Response();
$router = new Router($request, $response);
require __DIR__ . '/../app/routes.php';
try {
    $router->dispatch();
} catch (\Throwable $e) {
    http_response_code(500);
    if (getenv('APP_DEBUG') === 'true') {
        echo '<h1>Server Error</h1><pre>' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . "\n" . htmlspecialchars($e->getTraceAsString(), ENT_QUOTES, 'UTF-8') . '</pre>';
    } else {
        echo 'Internal Server Error';
    }
}