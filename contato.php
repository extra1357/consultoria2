<?php
/**
 * 123 Consultoria — Backend de Contatos
 * Salva leads em JSON + envia e-mail de notificação
 * 
 * Coloque este arquivo em: /public_html/api/contato.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.123consultoria.com.br');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido.']);
    exit;
}

// ── CONFIGURAÇÕES ─────────────────────────────────────────
$EMAIL_DESTINO   = 'contato@123consultoria.com.br'; // troque pelo seu e-mail
$EMAIL_REMETENTE = 'noreply@123consultoria.com.br';
$ARQUIVO_LEADS   = __DIR__ . '/../data/leads.json'; // fora do public_html idealmente
$CHAVE_SECRETA   = 'trocar_por_chave_aleatoria_123';  // usada no painel admin
// ─────────────────────────────────────────────────────────

// Lê body JSON
$input = file_get_contents('php://input');
$dados = json_decode($input, true);

if (!$dados) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados inválidos.']);
    exit;
}

// Sanitiza e valida
function limpar($v) {
    return htmlspecialchars(strip_tags(trim($v ?? '')));
}

$nome     = limpar($dados['nome'] ?? '');
$empresa  = limpar($dados['empresa'] ?? '');
$email    = filter_var(trim($dados['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$whatsapp = limpar($dados['whatsapp'] ?? '');
$servico  = limpar($dados['servico'] ?? '');
$mensagem = limpar($dados['mensagem'] ?? '');

if (!$nome || !$empresa || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$servico) {
    http_response_code(422);
    echo json_encode(['error' => 'Campos obrigatórios faltando ou inválidos.']);
    exit;
}

// Mapa de serviços legível
$servicos_map = [
    'consultoria-empresarial'  => 'Consultoria Empresarial',
    'planejamento-financeiro'  => 'Planejamento Financeiro',
    'rh-pessoas'               => 'RH & Pessoas',
    'compliance'               => 'Compliance & Governança',
    'marketing-digital'        => 'Marketing Digital',
    'fusoes-aquisicoes'        => 'Fusões & Aquisições',
    'gestao-estrategica'       => 'Gestão Estratégica',
    'outro'                    => 'Outro',
];
$servico_label = $servicos_map[$servico] ?? $servico;

// Monta objeto do lead
$lead = [
    'id'        => uniqid('lead_', true),
    'nome'      => $nome,
    'empresa'   => $empresa,
    'email'     => $email,
    'whatsapp'  => $whatsapp,
    'servico'   => $servico,
    'mensagem'  => $mensagem,
    'ip'        => $_SERVER['REMOTE_ADDR'] ?? '',
    'origem'    => $_SERVER['HTTP_REFERER'] ?? 'direto',
    'status'    => 'novo',       // novo | em_andamento | convertido | descartado
    'criadoEm'  => date('c'),    // ISO 8601
    'notas'     => '',
];

// ── SALVA NO ARQUIVO JSON ─────────────────────────────────
$dir = dirname($ARQUIVO_LEADS);
if (!is_dir($dir)) mkdir($dir, 0755, true);

$leads = [];
if (file_exists($ARQUIVO_LEADS)) {
    $conteudo = file_get_contents($ARQUIVO_LEADS);
    $leads = json_decode($conteudo, true) ?: [];
}
array_unshift($leads, $lead); // mais recente primeiro
file_put_contents($ARQUIVO_LEADS, json_encode($leads, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// ── ENVIA E-MAIL DE NOTIFICAÇÃO ───────────────────────────
$assunto = "🔔 Novo lead: {$nome} — {$empresa} [{$servico_label}]";
$corpo = "
=== NOVO LEAD — 123 Consultoria ===

Nome:      {$nome}
Empresa:   {$empresa}
E-mail:    {$email}
WhatsApp:  {$whatsapp}
Serviço:   {$servico_label}
Data/Hora: " . date('d/m/Y H:i') . "
IP:        {$lead['ip']}
Origem:    {$lead['origem']}

Mensagem:
{$mensagem}

---
Acesse o painel: https://www.123consultoria.com.br/admin/
";

$headers = implode("\r\n", [
    "From: 123 Consultoria <{$EMAIL_REMETENTE}>",
    "Reply-To: {$email}",
    "X-Mailer: 123Consultoria/1.0",
    "Content-Type: text/plain; charset=UTF-8",
]);

@mail($EMAIL_DESTINO, $assunto, $corpo, $headers);

// ── RESPOSTA ──────────────────────────────────────────────
http_response_code(201);
echo json_encode([
    'ok'      => true,
    'message' => 'Contato registrado com sucesso.',
    'id'      => $lead['id'],
]);
