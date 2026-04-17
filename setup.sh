#!/bin/bash
# 123 Consultoria — Setup completo
# Execute: bash setup.sh

set -e
echo "🚀 Criando estrutura do projeto..."

# ── PACKAGE.JSON ─────────────────────────────────────────
cat > package.json << 'EOF'
{
  "name": "consultoria2",
  "version": "1.0.0",
  "description": "123 Consultoria — Backend de Leads",
  "dependencies": {
    "pg": "^8.11.3"
  }
}
EOF

# ── VERCEL.JSON ──────────────────────────────────────────
cat > vercel.json << 'EOF'
{
  "rewrites": [
    { "source": "/admin", "destination": "/admin/index.html" },
    { "source": "/admin/", "destination": "/admin/index.html" }
  ]
}
EOF

# ── .GITIGNORE ───────────────────────────────────────────
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
.vercel
EOF

# ── PASTAS ───────────────────────────────────────────────
mkdir -p api admin sql

# ── SQL — CRIAR TABELA ───────────────────────────────────
cat > sql/criar_leads.sql << 'EOF'
-- Execute no SQL Editor do Neon

CREATE TABLE IF NOT EXISTS leads (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(100)  NOT NULL,
  empresa     VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL,
  whatsapp    VARCHAR(20)   DEFAULT '',
  servico     VARCHAR(50)   NOT NULL,
  mensagem    TEXT          DEFAULT '',
  ip          VARCHAR(50)   DEFAULT '',
  origem      VARCHAR(255)  DEFAULT 'direto',
  status      VARCHAR(20)   NOT NULL DEFAULT 'novo'
                CHECK (status IN ('novo','em_andamento','convertido','descartado')),
  notas       TEXT          DEFAULT '',
  criado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status    ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_criado_em ON leads (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email     ON leads (email);
EOF

# ── API/CONTATO.JS ───────────────────────────────────────
cat > api/contato.js << 'EOF'
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { nome, empresa, email, whatsapp, servico, mensagem } = req.body;

  if (!nome || !empresa || !email || !servico) {
    return res.status(422).json({ error: 'Campos obrigatórios faltando.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(422).json({ error: 'E-mail inválido.' });
  }

  const servicosValidos = [
    'consultoria-empresarial','planejamento-financeiro','rh-pessoas',
    'compliance','marketing-digital','fusoes-aquisicoes','gestao-estrategica','outro'
  ];
  if (!servicosValidos.includes(servico)) {
    return res.status(422).json({ error: 'Serviço inválido.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO leads (nome, empresa, email, whatsapp, servico, mensagem, ip, origem)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        nome.trim().substring(0, 100),
        empresa.trim().substring(0, 100),
        email.trim().toLowerCase().substring(0, 150),
        (whatsapp || '').trim().substring(0, 20),
        servico,
        (mensagem || '').trim().substring(0, 2000),
        req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
        req.headers['referer'] || 'direto',
      ]
    );
    return res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Erro ao salvar lead:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}
EOF

# ── API/LEADS.JS ─────────────────────────────────────────
cat > api/leads.js << 'EOF'
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = req.headers['x-admin-key'];
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query(
        `SELECT id, nome, empresa, email, whatsapp, servico, mensagem,
                ip, origem, status, notas, criado_em
         FROM leads ORDER BY criado_em DESC`
      );
      return res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar leads.' });
    }
  }

  if (req.method === 'PATCH') {
    const { id, campo, valor } = req.body;
    const camposPermitidos = ['status', 'notas'];
    const statusPermitidos = ['novo','em_andamento','convertido','descartado'];

    if (!id || !camposPermitidos.includes(campo)) {
      return res.status(400).json({ error: 'Dados inválidos.' });
    }
    if (campo === 'status' && !statusPermitidos.includes(valor)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    try {
      const { rowCount } = await pool.query(
        `UPDATE leads SET ${campo} = $1 WHERE id = $2`,
        [valor.toString().substring(0, 1000), id]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'Lead não encontrado.' });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao atualizar lead.' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
EOF

# ── ADMIN/INDEX.HTML ─────────────────────────────────────
cat > admin/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin — Leads 123 Consultoria</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #0d0f14; --surface: #161a22; --border: #252b38;
      --accent: #00e5a0; --accent2: #0084ff;
      --danger: #ff4d6d; --text: #e8ecf4; --muted: #6b7590;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

    /* LOGIN */
    #login-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .login-box { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 48px 40px; width: 100%; max-width: 380px; text-align: center; }
    .login-box h1 { font-size: 1.4rem; font-weight: 600; margin-bottom: 8px; }
    .login-box p { color: var(--muted); font-size: .9rem; margin-bottom: 28px; }
    .login-box input { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; color: var(--text); font-family: 'DM Mono', monospace; font-size: .95rem; margin-bottom: 16px; outline: none; transition: border-color .2s; }
    .login-box input:focus { border-color: var(--accent); }
    .btn-login { width: 100%; background: var(--accent); color: #000; font-weight: 600; border: none; border-radius: 8px; padding: 13px; cursor: pointer; font-size: 1rem; transition: opacity .2s; }
    .btn-login:hover { opacity: .85; }
    #login-error { color: var(--danger); font-size: .85rem; margin-top: 12px; display: none; }

    /* MAIN */
    #main { display: none; }
    header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; }
    header h1 { font-size: 1.1rem; font-weight: 600; }
    header h1 span { color: var(--accent); }
    .header-right { display: flex; align-items: center; gap: 16px; }
    #total-badge { background: var(--border); border-radius: 20px; padding: 4px 12px; font-size: .8rem; color: var(--muted); font-family: 'DM Mono', monospace; }
    .btn-logout { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 6px; padding: 6px 14px; cursor: pointer; font-size: .85rem; transition: all .2s; }
    .btn-logout:hover { border-color: var(--danger); color: var(--danger); }

    /* FILTROS */
    .filters { padding: 20px 32px; display: flex; gap: 10px; flex-wrap: wrap; border-bottom: 1px solid var(--border); }
    .filter-btn { background: var(--surface); border: 1px solid var(--border); color: var(--muted); border-radius: 20px; padding: 6px 16px; cursor: pointer; font-size: .85rem; font-family: 'DM Sans', sans-serif; transition: all .2s; }
    .filter-btn.active, .filter-btn:hover { border-color: var(--accent); color: var(--accent); }
    .search-input { background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 20px; padding: 6px 16px; font-size: .85rem; outline: none; margin-left: auto; width: 220px; transition: border-color .2s; }
    .search-input:focus { border-color: var(--accent); }

    /* TABELA */
    .table-wrap { padding: 24px 32px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: .88rem; }
    thead th { text-align: left; color: var(--muted); font-weight: 500; font-size: .78rem; text-transform: uppercase; letter-spacing: .08em; padding: 0 12px 12px; border-bottom: 1px solid var(--border); }
    tbody tr { border-bottom: 1px solid var(--border); transition: background .15s; }
    tbody tr:hover { background: var(--surface); }
    tbody td { padding: 14px 12px; vertical-align: middle; }
    .lead-nome { font-weight: 500; }
    .lead-empresa { font-size: .82rem; color: var(--muted); margin-top: 2px; }
    .lead-email { font-family: 'DM Mono', monospace; font-size: .82rem; color: var(--muted); }
    .lead-wpp a { color: var(--accent); text-decoration: none; font-family: 'DM Mono', monospace; font-size: .82rem; }
    .lead-wpp a:hover { text-decoration: underline; }
    .servico-tag { background: var(--border); border-radius: 4px; padding: 3px 8px; font-size: .75rem; white-space: nowrap; }
    .data-str { font-family: 'DM Mono', monospace; font-size: .78rem; color: var(--muted); }
    .status-sel { background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 4px 8px; font-size: .8rem; cursor: pointer; outline: none; }
    .status-novo         { border-color: #00e5a0; color: #00e5a0; }
    .status-em_andamento { border-color: #0084ff; color: #0084ff; }
    .status-convertido   { border-color: #7c3aed; color: #7c3aed; }
    .status-descartado   { border-color: #6b7590; color: #6b7590; }
    .notas-cell { max-width: 180px; }
    .notas-input { background: var(--bg); border: 1px solid transparent; color: var(--muted); border-radius: 6px; padding: 4px 8px; font-size: .8rem; width: 100%; font-family: 'DM Sans', sans-serif; resize: none; outline: none; transition: border-color .2s, color .2s; }
    .notas-input:focus { border-color: var(--border); color: var(--text); }
    .msg-btn { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 4px; padding: 3px 8px; cursor: pointer; font-size: .75rem; transition: all .2s; }
    .msg-btn:hover { border-color: var(--accent2); color: var(--accent2); }

    /* MODAL */
    #modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 100; align-items: center; justify-content: center; }
    #modal-overlay.open { display: flex; }
    .modal-box { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 32px; max-width: 480px; width: 90%; }
    .modal-box h3 { font-size: 1rem; margin-bottom: 16px; }
    .modal-msg { color: var(--muted); font-size: .9rem; line-height: 1.6; white-space: pre-wrap; }
    .modal-close { margin-top: 20px; background: var(--border); border: none; color: var(--text); border-radius: 6px; padding: 8px 20px; cursor: pointer; }

    /* ESTADOS */
    .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
    .spinner { border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; width: 24px; height: 24px; animation: spin .7s linear infinite; margin: 60px auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>

<div id="login-screen">
  <div class="login-box">
    <h1>123 Consultoria</h1>
    <p>Painel de Leads — acesso restrito</p>
    <input type="password" id="key-input" placeholder="Chave de acesso" />
    <button class="btn-login" onclick="login()">Entrar</button>
    <div id="login-error">Chave incorreta ou erro de conexão.</div>
  </div>
</div>

<div id="main">
  <header>
    <h1>Leads <span>123</span> Consultoria</h1>
    <div class="header-right">
      <span id="total-badge">— leads</span>
      <button class="btn-logout" onclick="logout()">Sair</button>
    </div>
  </header>
  <div class="filters">
    <button class="filter-btn active" onclick="setFiltro('todos',this)">Todos</button>
    <button class="filter-btn" onclick="setFiltro('novo',this)">🟢 Novo</button>
    <button class="filter-btn" onclick="setFiltro('em_andamento',this)">🔵 Em andamento</button>
    <button class="filter-btn" onclick="setFiltro('convertido',this)">🟣 Convertido</button>
    <button class="filter-btn" onclick="setFiltro('descartado',this)">⚫ Descartado</button>
    <input class="search-input" type="text" placeholder="Buscar nome, email..." oninput="renderTabela()" id="search" />
  </div>
  <div class="table-wrap">
    <div class="spinner" id="spinner"></div>
    <table id="leads-table" style="display:none">
      <thead>
        <tr>
          <th>Lead</th><th>Contato</th><th>Serviço</th>
          <th>Mensagem</th><th>Status</th><th>Notas</th><th>Data</th>
        </tr>
      </thead>
      <tbody id="tbody"></tbody>
    </table>
    <div class="empty-state" id="empty" style="display:none"><p>Nenhum lead encontrado.</p></div>
  </div>
</div>

<div id="modal-overlay" onclick="fecharModal(event)">
  <div class="modal-box">
    <h3 id="modal-titulo"></h3>
    <div class="modal-msg" id="modal-texto"></div>
    <button class="modal-close" onclick="fecharModal()">Fechar</button>
  </div>
</div>

<script>
  const API_LEADS = '/api/leads';
  let adminKey = '', todos = [], filtroAtual = 'todos';
  const servicosMap = {
    'consultoria-empresarial':'Consultoria Empresarial','planejamento-financeiro':'Planejamento Financeiro',
    'rh-pessoas':'RH & Pessoas','compliance':'Compliance & Gov.','marketing-digital':'Marketing Digital',
    'fusoes-aquisicoes':'Fusões & Aquisições','gestao-estrategica':'Gestão Estratégica','outro':'Outro'
  };

  async function login() {
    const key = document.getElementById('key-input').value.trim();
    if (!key) return;
    adminKey = key;
    const ok = await carregarLeads();
    if (ok) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('main').style.display = 'block';
    } else {
      document.getElementById('login-error').style.display = 'block';
      adminKey = '';
    }
  }

  document.getElementById('key-input').addEventListener('keydown', e => { if (e.key==='Enter') login(); });

  function logout() {
    adminKey = ''; todos = [];
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main').style.display = 'none';
    document.getElementById('key-input').value = '';
  }

  async function carregarLeads() {
    try {
      const r = await fetch(API_LEADS, { headers: { 'x-admin-key': adminKey } });
      if (!r.ok) return false;
      todos = await r.json();
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('leads-table').style.display = 'table';
      renderTabela();
      return true;
    } catch { return false; }
  }

  function setFiltro(f, btn) {
    filtroAtual = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTabela();
  }

  function renderTabela() {
    const q = document.getElementById('search').value.toLowerCase();
    let lista = todos;
    if (filtroAtual !== 'todos') lista = lista.filter(l => l.status === filtroAtual);
    if (q) lista = lista.filter(l =>
      l.nome.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.empresa.toLowerCase().includes(q)
    );
    document.getElementById('total-badge').textContent = `${lista.length} lead${lista.length!==1?'s':''}`;
    const tbody = document.getElementById('tbody');
    if (!lista.length) {
      document.getElementById('leads-table').style.display = 'none';
      document.getElementById('empty').style.display = 'block';
      return;
    }
    document.getElementById('leads-table').style.display = 'table';
    document.getElementById('empty').style.display = 'none';
    tbody.innerHTML = lista.map(l => `
      <tr>
        <td><div class="lead-nome">${esc(l.nome)}</div><div class="lead-empresa">${esc(l.empresa)}</div></td>
        <td>
          <div class="lead-email">${esc(l.email)}</div>
          <div class="lead-wpp">${l.whatsapp?`<a href="https://wa.me/55${l.whatsapp.replace(/\D/g,'')}" target="_blank">📱 ${esc(l.whatsapp)}</a>`:'<span style="color:var(--muted)">—</span>'}</div>
        </td>
        <td><span class="servico-tag">${esc(servicosMap[l.servico]||l.servico)}</span></td>
        <td>${l.mensagem?`<button class="msg-btn" onclick="abrirModal('${esc(l.nome)}','${encodeURIComponent(l.mensagem)}')">ver</button>`:'<span style="color:var(--muted)">—</span>'}</td>
        <td>
          <select class="status-sel status-${l.status}" onchange="atualizarCampo(${l.id},'status',this.value,this)">
            <option value="novo" ${l.status==='novo'?'selected':''}>🟢 Novo</option>
            <option value="em_andamento" ${l.status==='em_andamento'?'selected':''}>🔵 Em andamento</option>
            <option value="convertido" ${l.status==='convertido'?'selected':''}>🟣 Convertido</option>
            <option value="descartado" ${l.status==='descartado'?'selected':''}>⚫ Descartado</option>
          </select>
        </td>
        <td class="notas-cell">
          <textarea class="notas-input" rows="2" placeholder="Adicionar nota..."
            onblur="atualizarCampo(${l.id},'notas',this.value)">${esc(l.notas||'')}</textarea>
        </td>
        <td class="data-str">${formatarData(l.criado_em)}</td>
      </tr>
    `).join('');
  }

  async function atualizarCampo(id, campo, valor, el) {
    const r = await fetch(API_LEADS, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id, campo, valor })
    });
    if (r.ok) {
      const lead = todos.find(l => l.id === id);
      if (lead) lead[campo] = valor;
      if (campo === 'status' && el) el.className = `status-sel status-${valor}`;
    }
  }

  function abrirModal(nome, msgEncoded) {
    document.getElementById('modal-titulo').textContent = `Mensagem de ${nome}`;
    document.getElementById('modal-texto').textContent = decodeURIComponent(msgEncoded);
    document.getElementById('modal-overlay').classList.add('open');
  }
  function fecharModal(e) {
    if (!e || e.target === document.getElementById('modal-overlay'))
      document.getElementById('modal-overlay').classList.remove('open');
  }
  function formatarData(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + '<br>' + d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  }
  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
</script>
</body>
</html>
EOF

echo ""
echo "✅ Estrutura criada com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Cole o SQL do arquivo sql/criar_leads.sql no Neon SQL Editor"
echo "   2. No Vercel, adicione as variáveis:"
echo "      DATABASE_URL       = sua connection string do Neon"
echo "      ADMIN_SECRET_KEY   = uma chave forte (ex: MinhaChave@2025!)"
echo "   3. git add . && git commit -m 'feat: backend de leads' && git push"
echo ""
