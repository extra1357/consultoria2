<?php
/**
 * 123 Consultoria — API de Leads (leitura e atualização)
 * Coloque em: /public_html/api/leads.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.123consultoria.com.br');
header('Access-Control-Allow-Methods: GET, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$ARQUIVO_LEADS = __DIR__ . '/../data/leads.json';

function lerLeads($arquivo) {
    if (!file_exists($arquivo)) return [];
    return json_decode(file_get_contents($arquivo), true) ?: [];
}

function salvarLeads($arquivo, $leads) {
    $dir = dirname($arquivo);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($arquivo, json_encode($leads, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// GET — retorna todos os leads
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(lerLeads($ARQUIVO_LEADS));
    exit;
}

// PATCH — atualiza campo de um lead
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id    = $input['id']    ?? null;
    $campo = $input['campo'] ?? null;
    $valor = $input['valor'] ?? '';

    $camposPermitidos = ['status', 'notas'];
    if (!$id || !in_array($campo, $camposPermitidos)) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados inválidos.']);
        exit;
    }

    $leads = lerLeads($ARQUIVO_LEADS);
    $found = false;
    foreach ($leads as &$lead) {
        if ($lead['id'] === $id) {
            $lead[$campo] = htmlspecialchars(strip_tags(trim($valor)));
            $found = true;
            break;
        }
    }
    unset($lead);

    if (!$found) { http_response_code(404); echo json_encode(['error'=>'Lead não encontrado.']); exit; }

    salvarLeads($ARQUIVO_LEADS, $leads);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido.']);
