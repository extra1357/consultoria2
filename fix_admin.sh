#!/bin/bash
cd ~/consultoria2

cat > admin/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin — 123 Consultoria</title>
<meta name="robots" content="noindex, nofollow">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
:root {
  --navy:#0A1628; --navy2:#0F1E36; --navy3:#152540;
  --accent:#2E7CF6; --gold:#D4A843;
  --white:#fff; --muted:#8A9AB5; --off:#E8EDF5;
  --green:#1a7a4a; --red:#c0392b; --yellow:#d97706;
}
body { font-family:'Outfit',sans-serif; background:var(--navy); color:var(--white); min-height:100vh; }
#loginScreen { display:flex; align-items:center; justify-content:center; min-height:100vh; }
.login-box { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:48px 40px; width:100%; max-width:400px; text-align:center; }
.login-logo { font-size:2.2rem; font-weight:700; color:var(--white); margin-bottom:8px; }
.login-logo span { color:var(--accent); }
.login-sub { color:var(--muted); font-size:.9rem; margin-bottom:32px; }
.login-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:14px 16px; color:var(--white); font-family:'Outfit',sans-serif; font-size:1rem; outline:none; margin-bottom:12px; transition:border-color .2s; }
.login-input:focus { border-color:var(--accent); }
.login-btn { width:100%; background:var(--accent); color:#fff; border:none; padding:14px; border-radius:10px; font-size:1rem; font-weight:600; cursor:pointer; font-family:'Outfit',sans-serif; transition:background .2s; }
.login-btn:hover { background:#1a5fd4; }
.login-err { color:#f87171; font-size:.85rem; margin-top:8px; display:none; }
#adminScreen { display:none; }
.topbar { background:var(--navy2); border-bottom:1px solid rgba(255,255,255,0.08); padding:16px 32px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:50; }
.topbar-brand { font-size:1.2rem; font-weight:700; }
.topbar-brand span { color:var(--accent); }
.topbar-right { display:flex; align-items:center; gap:16px; }
.topbar-user { color:var(--muted); font-size:.85rem; }
.btn-logout { background:transparent; border:1px solid rgba(255,255,255,0.15); color:var(--muted); padding:8px 16px; border-radius:8px; cursor:pointer; font-size:.82rem; font-family:'Outfit',sans-serif; transition:border-color .2s; }
.btn-logout:hover { border-color:rgba(255,255,255,.4); color:var(--white); }
.main { max-width:1200px; margin:0 auto; padding:32px 24px; }
.stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; margin-bottom:32px; }
.stat-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:24px; }
.stat-card-num { font-size:2.2rem; font-weight:700; color:var(--gold); line-height:1; margin-bottom:6px; }
.stat-card-label { color:var(--muted); font-size:.8rem; text-transform:uppercase; letter-spacing:.06em; }
.filtros { display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap; align-items:center; }
.filtro-btn { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:var(--muted); padding:8px 18px; border-radius:8px; cursor:pointer; font-size:.82rem; font-family:'Outfit',sans-serif; transition:.2s; }
.filtro-btn.active { background:var(--accent); border-color:var(--accent); color:#fff; }
.search-input { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:var(--white); padding:9px 16px; border-radius:8px; font-size:.85rem; font-family:'Outfit',sans-serif; outline:none; width:240px; }
.search-input::placeholder { color:var(--muted); }
.search-input:focus { border-color:var(--accent); }
.export-btn { margin-left:auto; background:rgba(212,168,67,0.12); border:1px solid rgba(212,168,67,0.3); color:var(--gold); padding:8px 18px; border-radius:8px; cursor:pointer; font-size:.82rem; font-family:'Outfit',sans-serif; transition:.2s; }
.export-btn:hover { background:rgba(212,168,67,0.2); }
.table-wrap { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; overflow:hidden; }
table { width:100%; border-collapse:collapse; }
thead { background:rgba(255,255,255,0.04); }
th { padding:14px 16px; text-align:left; font-size:.75rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); font-weight:500; white-space:nowrap; }
td { padding:16px; border-top:1px solid rgba(255,255,255,0.05); font-size:.88rem; vertical-align:top; }
tr:hover td { background:rgba(255,255,255,0.02); }
.td-nome { font-weight:600; color:var(--white); }
.td-empresa { color:var(--muted); font-size:.8rem; margin-top:2px; }
.td-email a { color:var(--accent); text-decoration:none; }
.td-email a:hover { text-decoration:underline; }
.td-wa a { color:#25d366; text-decoration:none; font-size:.82rem; }
.td-data { color:var(--muted); font-size:.8rem; white-space:nowrap; }
.badge { display:inline-block; padding:4px 10px; border-radius:99px; font-size:.72rem; font-weight:600; letter-spacing:.04em; }
.badge-novo { background:rgba(46,124,246,0.15); color:var(--accent); }
.badge-andamento { background:rgba(217,119,6,0.15); color:#f59e0b; }
.badge-convertido { background:rgba(26,122,74,0.15); color:#22c55e; }
.badge-descartado { background:rgba(192,57,43,0.1); color:#f87171; }
.status-select { background:transparent; border:1px solid rgba(255,255,255,0.1); color:var(--white); border-radius:6px; padding:4px 8px; font-size:.78rem; font-family:'Outfit',sans-serif; cursor:pointer; outline:none; }
.status-select option { background:var(--navy2); }
.notas-input { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:var(--muted); border-radius:6px; padding:6px 10px; font-size:.78rem; font-family:'Outfit',sans-serif; width:180px; resize:none; }
.notas-input:focus { outline:none; border-color:var(--accent); }
.save-btn { background:var(--accent); border:none; color:#fff; padding:5px 12px; border-radius:6px; font-size:.75rem; cursor:pointer; font-family:'Outfit',sans-serif; margin-top:4px; display:block; }
.servico-chip { display:inline-block; background:rgba(212,168,67,0.1); border:1px solid rgba(212,168,67,0.2); color:var(--gold); border-radius:6px; padding:3px 8px; font-size:.72rem; }
.vazio { text-align:center; padding:60px 20px; color:var(--muted); }
.vazio-icon { font-size:3rem; margin-bottom:12px; }
.msg { position:fixed; bottom:24px; right:24px; background:var(--green); color:#fff; padding:12px 24px; border-radius:10px; font-size:.9rem; opacity:0; transition:.3s; z-index:999; pointer-events:none; }
.msg.show { opacity:1; }
</style>
</head>
<body>

<!-- LOGIN -->
<div id="loginScreen">
  <div class="login-box">
    <div class="login-logo"><span>123</span>.Consultoria</div>
    <div class="login-sub">Painel Administrativo — Leads</div>
    <input class="login-input" type="text" id="loginUser" placeholder="Usuário" autocomplete="username">
    <input class="login-input" type="password" id="loginPass" placeholder="Senha" autocomplete="current-password">
    <button class="login-btn" onclick="fazerLogin()">Entrar</button>
    <div class="login-err" id="loginErr">Usuário ou senha incorretos.</div>
  </div>
</div>

<!-- ADMIN -->
<div id="adminScreen">
  <div class="topbar">
    <div class="topbar-brand"><span>123</span>.Consultoria — Admin</div>
    <div class="topbar-right">
      <span class="topbar-user" id="topbarUser"></span>
      <button class="btn-logout" onclick="fazerLogout()">Sair</button>
    </div>
  </div>
  <div class="main">
    <div class="stats-grid" id="statsGrid"></div>
    <div class="filtros">
      <button class="filtro-btn active" data-status="todos" onclick="filtrar(this)">Todos</button>
      <button class="filtro-btn" data-status="novo" onclick="filtrar(this)">🔵 Novos</button>
      <button class="filtro-btn" data-status="em_andamento" onclick="filtrar(this)">🟡 Em andamento</button>
      <button class="filtro-btn" data-status="convertido" onclick="filtrar(this)">🟢 Convertidos</button>
      <button class="filtro-btn" data-status="descartado" onclick="filtrar(this)">🔴 Descartados</button>
      <input class="search-input" type="text" id="searchInput" placeholder="Buscar nome, empresa ou e-mail..." oninput="renderTabela()">
      <button class="export-btn" onclick="exportarCSV()">⬇ Exportar CSV</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Lead</th>
            <th>E-mail / WhatsApp</th>
            <th>Serviço</th>
            <th>Status</th>
            <th>Mensagem</th>
            <th>Notas</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody id="tabelaBody"></tbody>
      </table>
      <div class="vazio" id="vaziMsg" style="display:none">
        <div class="vazio-icon">📭</div>
        <div>Nenhum lead encontrado.</div>
      </div>
    </div>
  </div>
</div>

<div class="msg" id="msgToast"></div>

<script>
const USUARIOS = [
  { user: 'admin', pass: 'admin123', nome: 'Administrador' },
  { user: 'consultor', pass: 'cons456', nome: 'Consultor' },
];

const ADMIN_KEY = 'MinhaChave@2025!';

let leads = [];
let filtroStatus = 'todos';
let logado = null;

function fazerLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value.trim();
  const match = USUARIOS.find(x => x.user === u && x.pass === p);
  if (!match) { document.getElementById('loginErr').style.display='block'; return; }
  logado = match;
  sessionStorage.setItem('123admin', JSON.stringify(match));
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminScreen').style.display = 'block';
  document.getElementById('topbarUser').textContent = match.nome;
  carregarLeads();
}

function fazerLogout() {
  sessionStorage.removeItem('123admin');
  location.reload();
}

const sess = sessionStorage.getItem('123admin');
if (sess) {
  logado = JSON.parse(sess);
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminScreen').style.display = 'block';
  document.getElementById('topbarUser').textContent = logado.nome;
  carregarLeads();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') fazerLogin();
});

async function carregarLeads() {
  try {
    const res = await fetch('/api/leads', {
      headers: { 'x-admin-key': ADMIN_KEY }
    });
    if (!res.ok) throw new Error('Erro ' + res.status);
    leads = await res.json();
    leads = leads.map(l => ({
      ...l,
      criadoEm: l.criado_em || l.criadoEm || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Erro ao carregar leads:', err);
    toast('Erro ao carregar leads!');
    leads = [];
  }
  renderStats();
  renderTabela();
}

function renderStats() {
  const total = leads.length;
  const novos = leads.filter(l=>l.status==='novo').length;
  const convertidos = leads.filter(l=>l.status==='convertido').length;
  const taxa = total ? Math.round(convertidos/total*100) : 0;
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-card-num">${total}</div><div class="stat-card-label">Total de Leads</div></div>
    <div class="stat-card"><div class="stat-card-num" style="color:var(--accent)">${novos}</div><div class="stat-card-label">Novos</div></div>
    <div class="stat-card"><div class="stat-card-num" style="color:#22c55e">${convertidos}</div><div class="stat-card-label">Convertidos</div></div>
    <div class="stat-card"><div class="stat-card-num">${taxa}%</div><div class="stat-card-label">Taxa de Conversão</div></div>
  `;
}

const servicosMap = {
  'consultoria-empresarial':'Consultoria Empresarial','planejamento-financeiro':'Planejamento Financeiro',
  'rh-pessoas':'RH & Pessoas','compliance':'Compliance','marketing-digital':'Marketing Digital',
  'fusoes-aquisicoes':'Fusões & Aquisições','gestao-estrategica':'Gestão Estratégica','outro':'Outro'
};

function renderTabela() {
  const busca = document.getElementById('searchInput').value.toLowerCase();
  let filtrados = leads.filter(l => {
    const matchStatus = filtroStatus === 'todos' || l.status === filtroStatus;
    const matchBusca = !busca || (l.nome||'').toLowerCase().includes(busca) || (l.empresa||'').toLowerCase().includes(busca) || (l.email||'').toLowerCase().includes(busca);
    return matchStatus && matchBusca;
  });

  const tbody = document.getElementById('tabelaBody');
  const vazi = document.getElementById('vaziMsg');

  if (!filtrados.length) { tbody.innerHTML=''; vazi.style.display='block'; return; }
  vazi.style.display = 'none';

  tbody.innerHTML = filtrados.map(l => {
    const data = new Date(l.criadoEm).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const wa = l.whatsapp ? l.whatsapp.replace(/\D/g,'') : '';
    return `
      <tr>
        <td>
          <div class="td-nome">${l.nome}</div>
          <div class="td-empresa">${l.empresa}</div>
        </td>
        <td>
          <div class="td-email"><a href="mailto:${l.email}">${l.email}</a></div>
          ${wa ? `<div class="td-wa"><a href="https://wa.me/55${wa}" target="_blank">📱 WhatsApp</a></div>` : ''}
        </td>
        <td><span class="servico-chip">${servicosMap[l.servico]||l.servico}</span></td>
        <td>
          <select class="status-select" onchange="mudarStatus(${l.id}, this.value)">
            <option value="novo" ${l.status==='novo'?'selected':''}>Novo</option>
            <option value="em_andamento" ${l.status==='em_andamento'?'selected':''}>Em andamento</option>
            <option value="convertido" ${l.status==='convertido'?'selected':''}>Convertido</option>
            <option value="descartado" ${l.status==='descartado'?'selected':''}>Descartado</option>
          </select>
        </td>
        <td style="max-width:200px;color:var(--muted);font-size:.8rem;">${l.mensagem||'—'}</td>
        <td>
          <textarea class="notas-input" rows="2" id="nota_${l.id}" placeholder="Adicionar nota...">${l.notas||''}</textarea>
          <button class="save-btn" onclick="salvarNota(${l.id})">Salvar</button>
        </td>
        <td class="td-data">${data}</td>
      </tr>
    `;
  }).join('');
}

function filtrar(btn) {
  document.querySelectorAll('.filtro-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  filtroStatus = btn.dataset.status;
  renderTabela();
}

async function mudarStatus(id, novoStatus) {
  const lead = leads.find(l=>l.id===id);
  if (!lead) return;
  lead.status = novoStatus;
  renderStats();
  try {
    await fetch('/api/leads', {
      method:'PATCH',
      headers:{'Content-Type':'application/json','x-admin-key':ADMIN_KEY},
      body: JSON.stringify({id, campo:'status', valor:novoStatus})
    });
    toast('Status atualizado!');
  } catch { toast('Erro ao salvar status.'); }
}

async function salvarNota(id) {
  const lead = leads.find(l=>l.id===id);
  if (!lead) return;
  lead.notas = document.getElementById('nota_'+id).value;
  try {
    await fetch('/api/leads', {
      method:'PATCH',
      headers:{'Content-Type':'application/json','x-admin-key':ADMIN_KEY},
      body: JSON.stringify({id, campo:'notas', valor:lead.notas})
    });
    toast('Nota salva!');
  } catch { toast('Erro ao salvar nota.'); }
}

function exportarCSV() {
  const cols = ['ID','Nome','Empresa','Email','WhatsApp','Serviço','Status','Mensagem','Notas','Data'];
  const rows = leads.map(l=>[
    l.id, l.nome, l.empresa, l.email, l.whatsapp,
    servicosMap[l.servico]||l.servico, l.status, l.mensagem, l.notas,
    new Date(l.criadoEm).toLocaleString('pt-BR')
  ].map(v=>'"'+(v||'').replace(/"/g,'""')+'"').join(';'));
  const csv = [cols.join(';'), ...rows].join('\n');
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leads_123consultoria_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
}

function toast(msg) {
  const t = document.getElementById('msgToast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2500);
}
</script>
</body>
</html>
EOF

echo "✅ admin/index.html atualizado com sucesso!"
