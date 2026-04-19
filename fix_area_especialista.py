#!/usr/bin/env python3
"""
Adiciona abas "Meus Leads" e "Negociações" na area.html do especialista.
Roda em: cd ~/consultoria2 && python3 fix_area_especialista.py
"""

import re

ARQUIVO = 'prestador/area.html'

with open(ARQUIVO, 'r', encoding='utf-8') as f:
    html = f.read()

# ─── 1. MENU LATERAL — adiciona itens antes de "Meus Projetos" ───────────────
MENU_ANTIGO = '<div class="nav-item" onclick="showPage(\'projetos\')"><span>📁</span> Meus Projetos</div>'
MENU_NOVO   = '''<div class="nav-item" onclick="showPage('meus_leads')"><span>📋</span> Meus Leads <span class="nav-badge" id="badgeLeads">0</span></div>
      <div class="nav-item" onclick="showPage('negociacoes')"><span>🤝</span> Negociações <span class="nav-badge" id="badgeNegs">0</span></div>
      <div class="nav-item" onclick="showPage('projetos')"><span>📁</span> Meus Projetos</div>'''
html = html.replace(MENU_ANTIGO, MENU_NOVO, 1)

# ─── 2. PAGES HTML — adiciona antes de page-financeiro ───────────────────────
PAGE_FINANCEIRO_OPEN = '<div class="page" id="page-financeiro">'
PAGINAS_NOVAS = '''<div class="page" id="page-meus_leads">
      <div class="page-title">Meus Leads</div>
      <div class="page-sub">Leads atribuídos a você pelo admin — entre em contato e registre a reunião</div>
      <div id="listaLeads"><div class="loading"><div class="spinner"></div> Carregando...</div></div>
    </div>

    <div class="page" id="page-negociacoes">
      <div class="page-title">Negociações</div>
      <div class="page-sub">Registre reuniões realizadas com os leads para que o admin possa aprovar o projeto</div>
      <div id="listaNegociacoes"><div class="loading"><div class="spinner"></div> Carregando...</div></div>
    </div>

    ''' + PAGE_FINANCEIRO_OPEN

html = html.replace(PAGE_FINANCEIRO_OPEN, PAGINAS_NOVAS, 1)

# ─── 3. MODAL de registrar reunião — adiciona antes do modal de candidatura ──
MODAL_CANDIDATURA = '<div class="modal-overlay" id="modalCandidatura">'
MODAL_REUNIAO = '''<div class="modal-overlay" id="modalReuniao">
  <div class="modal">
    <button class="modal-close" onclick="fecharModalReuniao()">✕</button>
    <div class="modal-title">📅 Registrar Reunião</div>
    <div id="modalLeadNome" style="font-size:.9rem;color:var(--muted);margin-bottom:16px"></div>
    <div class="perfil-field">
      <label class="perfil-label">Data da Reunião *</label>
      <input class="perfil-input" type="date" id="rDataReuniao">
    </div>
    <div class="perfil-field">
      <label class="perfil-label">Link da Gravação (Meet, Zoom etc)</label>
      <input class="perfil-input" type="url" id="rLinkGravacao" placeholder="https://...">
    </div>
    <div class="perfil-field">
      <label class="perfil-label">Resumo da Reunião *</label>
      <textarea class="perfil-input" id="rResumo" rows="3" placeholder="O que foi discutido, necessidades levantadas..." style="resize:vertical"></textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="perfil-field">
        <label class="perfil-label">Valor Proposto (R$) *</label>
        <input class="perfil-input" type="number" id="rValor" placeholder="ex: 8500">
      </div>
      <div class="perfil-field">
        <label class="perfil-label">Prazo de Entrega *</label>
        <input class="perfil-input" type="text" id="rPrazo" placeholder="ex: 30 dias">
      </div>
    </div>
    <div class="perfil-field">
      <label class="perfil-label">Observações adicionais</label>
      <textarea class="perfil-input" id="rObservacoes" rows="2" placeholder="Qualquer info extra para o admin..." style="resize:vertical"></textarea>
    </div>
    <div style="display:flex;gap:10px;margin-top:8px">
      <button class="btn-sm btn-accent" style="flex:1;padding:12px" onclick="confirmarReuniao()">✅ Registrar Negociação</button>
      <button class="btn-sm btn-outline" style="padding:12px 16px" onclick="fecharModalReuniao()">Cancelar</button>
    </div>
  </div>
</div>

''' + MODAL_CANDIDATURA

html = html.replace(MODAL_CANDIDATURA, MODAL_REUNIAO, 1)

# ─── 4. JS — adiciona funções novas antes do </script> final ─────────────────
JS_NOVO = '''
// ── LEADS ────────────────────────────────────────────────────────────────────
let _leadSelecionado = null;

async function carregarLeads() {
  try {
    const res = await fetch('/api/leads?especialista_id=' + prestador.id);
    const data = await res.json();
    renderLeads(data.leads || []);
  } catch(e) { renderLeads([]); }
}

function renderLeads(leads) {
  document.getElementById('badgeLeads').textContent = leads.length;
  if (!leads.length) {
    document.getElementById('listaLeads').innerHTML =
      '<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">Nenhum lead atribuído ainda.<br>O admin irá te atribuir quando chegar uma solicitação compatível.</div></div>';
    return;
  }
  const statusMap = {
    novo: ['badge-blue','🔵 Novo'],
    em_negociacao: ['badge-yellow','🤝 Em negociação'],
    convertido: ['badge-green','✅ Convertido'],
    descartado: ['badge-red','❌ Descartado']
  };
  document.getElementById('listaLeads').innerHTML = leads.map(l => {
    const [cls, txt] = statusMap[l.status] || ['badge-gray', l.status];
    const podeRegistrar = l.status === 'novo' || l.status === 'em_negociacao';
    return `<div class="oport-card">
      <div class="oport-header">
        <div>
          <div class="oport-titulo">${l.empresa || l.titulo || 'Lead #'+l.id}</div>
          <span class="badge ${cls}">${txt}</span>
        </div>
        <div style="text-align:right;font-size:.8rem;color:var(--muted)">#${l.id}</div>
      </div>
      <div class="oport-desc">${l.descricao || l.mensagem || l.servico || '—'}</div>
      <div class="oport-meta">
        <span>🏢 ${l.contato_empresa || l.nome || '—'}</span>
        <span>📧 ${l.email_empresa || l.email || '—'}</span>
        ${l.whatsapp ? `<span>📱 <a href="https://wa.me/55${l.whatsapp.replace(/\D/g,'')}" target="_blank" style="color:var(--green)">WhatsApp</a></span>` : ''}
        ${l.valor ? `<span>💰 R$ ${l.valor}</span>` : ''}
        ${l.prazo ? `<span>📅 ${l.prazo}</span>` : ''}
      </div>
      ${l.notas ? `<div style="font-size:.8rem;color:var(--muted);margin-top:8px;padding:8px;background:rgba(46,124,246,.05);border-radius:8px">📝 ${l.notas}</div>` : ''}
      <div style="display:flex;gap:8px;margin-top:12px">
        ${podeRegistrar ? `<button class="btn-sm btn-accent" onclick="abrirModalReuniao(${l.id},'${(l.empresa||l.titulo||'Lead #'+l.id).replace(/'/g,"\\'")}')">📅 Registrar Reunião</button>` : ''}
        ${l.whatsapp ? `<button class="btn-sm btn-outline" onclick="window.open('https://wa.me/55${l.whatsapp.replace(/\D/g,'')}','_blank')">💬 WhatsApp</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

function abrirModalReuniao(leadId, leadNome) {
  _leadSelecionado = leadId;
  document.getElementById('modalLeadNome').textContent = '🏢 ' + leadNome;
  document.getElementById('rDataReuniao').value = new Date().toISOString().split('T')[0];
  document.getElementById('rLinkGravacao').value = '';
  document.getElementById('rResumo').value = '';
  document.getElementById('rValor').value = '';
  document.getElementById('rPrazo').value = '';
  document.getElementById('rObservacoes').value = '';
  document.getElementById('modalReuniao').classList.add('open');
}

function fecharModalReuniao() {
  document.getElementById('modalReuniao').classList.remove('open');
  _leadSelecionado = null;
}

async function confirmarReuniao() {
  const data_reuniao   = document.getElementById('rDataReuniao').value;
  const link_gravacao  = document.getElementById('rLinkGravacao').value;
  const resumo         = document.getElementById('rResumo').value.trim();
  const valor_proposto = parseFloat(document.getElementById('rValor').value);
  const prazo_proposto = document.getElementById('rPrazo').value.trim();
  const observacoes    = document.getElementById('rObservacoes').value.trim();

  if (!data_reuniao || !resumo || !valor_proposto || !prazo_proposto) {
    alert('Preencha os campos obrigatórios: Data, Resumo, Valor e Prazo.');
    return;
  }

  try {
    const res = await fetch('/api/leads?type=neg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: _leadSelecionado,
        especialista_id: prestador.id,
        data_reuniao, link_gravacao, resumo,
        valor_proposto, prazo_proposto, observacoes
      })
    });
    const data = await res.json();
    if (data.ok) {
      fecharModalReuniao();
      alert('✅ Reunião registrada com sucesso!\\n\\nO admin será notificado e irá analisar a proposta para aprovação do projeto.');
      carregarLeads();
      carregarNegociacoes();
    } else {
      alert('Erro ao registrar: ' + (data.erro || 'Tente novamente.'));
    }
  } catch(e) {
    alert('Erro de conexão. Tente novamente.');
  }
}

// ── NEGOCIAÇÕES ───────────────────────────────────────────────────────────────
async function carregarNegociacoes() {
  try {
    const res = await fetch('/api/leads?type=neg&especialista_id=' + prestador.id);
    const data = await res.json();
    renderNegociacoes(data.negociacoes || []);
  } catch(e) { renderNegociacoes([]); }
}

function renderNegociacoes(negs) {
  document.getElementById('badgeNegs').textContent = negs.length;
  if (!negs.length) {
    document.getElementById('listaNegociacoes').innerHTML =
      '<div class="empty"><div class="empty-icon">🤝</div><div class="empty-text">Nenhuma negociação registrada ainda.<br>Após uma reunião com o lead, registre aqui para o admin aprovar o projeto.</div></div>';
    return;
  }
  const statusMap = {
    pendente:  ['badge-yellow','⏳ Aguardando aprovação'],
    aprovada:  ['badge-green', '✅ Aprovada — Projeto criado'],
    revisao:   ['badge-blue',  '🔄 Revisão solicitada'],
    recusada:  ['badge-red',   '❌ Recusada'],
  };
  document.getElementById('listaNegociacoes').innerHTML = negs.map(n => {
    const [cls, txt] = statusMap[n.status] || ['badge-gray', n.status];
    return `<div class="oport-card">
      <div class="oport-header">
        <div>
          <div class="oport-titulo">${n.lead_empresa || n.lead_nome || 'Negociação #'+n.id}</div>
          <div style="font-size:.8rem;color:var(--muted);margin-top:2px">${n.lead_servico || ''}</div>
        </div>
        <span class="badge ${cls}">${txt}</span>
      </div>
      <div class="oport-meta" style="margin-top:12px">
        <span>📅 Reunião: ${n.data_reuniao ? new Date(n.data_reuniao).toLocaleDateString('pt-BR') : '—'}</span>
        <span>💰 Valor proposto: R$ ${Number(n.valor_proposto||0).toLocaleString('pt-BR')}</span>
        <span>⏱ Prazo: ${n.prazo_proposto || '—'}</span>
      </div>
      ${n.resumo ? `<div style="font-size:.85rem;color:var(--muted);margin-top:10px;padding:10px;background:rgba(46,124,246,.05);border-radius:8px"><b>Resumo:</b> ${n.resumo}</div>` : ''}
      ${n.admin_comentario ? `<div style="font-size:.85rem;color:var(--yellow);margin-top:8px;padding:10px;background:rgba(245,158,11,.08);border-radius:8px">💬 <b>Admin:</b> ${n.admin_comentario}</div>` : ''}
      ${n.link_gravacao ? `<div style="margin-top:8px"><a href="${n.link_gravacao}" target="_blank" class="btn-sm btn-outline">🎥 Ver gravação</a></div>` : ''}
    </div>`;
  }).join('');
}
'''

html = html.replace('</script>', JS_NOVO + '\n</script>', 1)

# ─── 5. carregarDados — adiciona carregarLeads e carregarNegociacoes ──────────
html = html.replace(
    'await Promise.all([carregarProjetos(),carregarOportunidades(),carregarPerfil(),carregarFinanceiro()]);',
    'await Promise.all([carregarProjetos(),carregarOportunidades(),carregarPerfil(),carregarFinanceiro(),carregarLeads(),carregarNegociacoes()]);'
)

# ─── 6. showPage — adiciona handlers para as novas abas ──────────────────────
html = html.replace(
    "const m={leads:()=>",
    "const m={meus_leads:()=>carregarLeads(),negociacoes:()=>carregarNegociacoes(),leads:()=>"
) if "const m={leads:()=>" in html else html

# fallback: adiciona no showPage genérico
if 'meus_leads' not in html:
    html = html.replace(
        "function showPage(nome){",
        """function showPage(nome){
  if(nome==='meus_leads') setTimeout(carregarLeads,100);
  if(nome==='negociacoes') setTimeout(carregarNegociacoes,100);"""
    )

with open(ARQUIVO, 'w', encoding='utf-8') as f:
    f.write(html)

print("✅ area.html atualizado com sucesso!")
print("   + Aba 'Meus Leads' com botão Registrar Reunião")
print("   + Aba 'Negociações' com status e comentário do admin")
print("   + Modal completo para registrar reunião")
print("")
print("Agora rode:")
print("  git add . && git commit -m 'feat: abas Leads e Negociações na área do especialista' && git push")
