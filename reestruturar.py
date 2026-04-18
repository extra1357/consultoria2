import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ─── 1. TITLE + META DESCRIPTION ───────────────────────────────────────────
html = html.replace(
    '<title>123 Consultoria | Consultoria Empresarial Estratégica</title>',
    '<title>123 Consultoria | Plataforma de Especialistas em Soluções Empresariais</title>'
)
html = html.replace(
    'content="123 Consultoria oferece soluções estratégicas em gestão empresarial, planejamento financeiro, RH, compliance, marketing digital e fusões & aquisições. Transformamos negócios em resultados."',
    'content="A 123 Consultoria conecta empresas a especialistas qualificados em gestão, finanças, RH, compliance e marketing digital. Diagnóstico gratuito. Resultados mensuráveis."'
)
html = html.replace(
    'content="123 Consultoria | Consultoria Empresarial Estratégica"',
    'content="123 Consultoria | Plataforma de Especialistas em Soluções Empresariais"'
)

# ─── 2. HERO BADGE ──────────────────────────────────────────────────────────
html = html.replace(
    '<div class="hero-badge"><span class="hero-badge-dot"></span>Consultoria Empresarial Estratégica</div>',
    '<div class="hero-badge"><span class="hero-badge-dot"></span>Especialistas Qualificados · Resultado Garantido</div>'
)

# ─── 3. HERO H1 ─────────────────────────────────────────────────────────────
html = html.replace(
    '<h1>Transformamos <em>decisões</em><br>em <strong>resultados</strong> reais.</h1>',
    '<h1>Sua empresa conectada<br>aos <em>especialistas</em> certos<br>para cada <strong>desafio</strong>.</h1>'
)

# ─── 4. HERO SUBTÍTULO ──────────────────────────────────────────────────────
html = html.replace(
    '<p class="hero-sub">A 123 Consultoria combina visão estratégica, expertise técnica e método comprovado para levar sua empresa ao próximo nível — com clareza, velocidade e resultado mensurável.</p>',
    '<p class="hero-sub">A 123 Consultoria é uma plataforma que conecta empresas a profissionais especializados e rigorosamente selecionados. Você descreve o desafio — nós encontramos o especialista certo, estruturamos a solução e acompanhamos a entrega.</p>'
)

# ─── 5. HERO BOTÕES ─────────────────────────────────────────────────────────
html = html.replace(
    '<a href="#contato" class="btn-primary">Solicitar diagnóstico gratuito</a>\n    <a href="#servicos" class="btn-ghost">Conheça nossos serviços</a>',
    '<a href="#contato" class="btn-primary">Solicitar diagnóstico gratuito</a>\n    <a href="#como-funciona" class="btn-ghost">Como funciona →</a>'
)

# ─── 6. HERO STATS — adicionar contexto ──────────────────────────────────────
html = html.replace(
    '<div class="hero-stats">\n    <div class="stat"><div class="stat-label">Empresas atendidas</div></div>\n    <div class="stat"><div class="stat-label">Em projetos gerenciados</div></div>\n    <div class="stat"><div class="stat-label">Taxa de satisfação</div></div>\n    <div class="stat"><div class="stat-label">Anos de experiência</div></div>\n  </div>',
    '''<div class="hero-stats">
    <div class="stat"><div class="stat-label">Especialistas selecionados</div></div>
    <div class="stat"><div class="stat-label">Diagnóstico inicial gratuito</div></div>
    <div class="stat"><div class="stat-label">Proposta em até 24h</div></div>
    <div class="stat"><div class="stat-label">Atuação em todo Brasil</div></div>
  </div>'''
)

# ─── 7. SEÇÃO SOBRE ─────────────────────────────────────────────────────────
html = html.replace(
    '<div class="section-tag fade-in">Quem somos</div>\n    <h2 class="section-title fade-in">Estratégia que <em>move</em> empresas.</h2>',
    '<div class="section-tag fade-in">Quem somos</div>\n    <h2 class="section-title fade-in">A plataforma que <em>resolve</em> problemas reais.</h2>'
)

old_sobre_text = '''<p>A <strong>123 Consultoria</strong> nasceu da convicção de que toda empresa — independentemente do seu porte — merece acesso a consultoria de alto nível. Reunimos profissionais com trajetórias em grandes corporações, startups e mercado financeiro para entregar soluções sob medida.</p>
        <p>Nossa abordagem é direta: <strong>diagnóstico preciso, plano claro, execução acompanhada</strong>. Não entregamos relatórios que ficam na gaveta — trabalhamos lado a lado com sua equipe até os resultados aparecerem no caixa e no balanço.</p>
        <p>Atuamos em todo o Brasil, com times especializados por vertical. Da PME ao corporate, nosso modelo é escalável e transparente — você sabe exatamente o que está contratando e o que vai receber.</p>'''

new_sobre_text = '''<p>A <strong>123 Consultoria</strong> nasceu da convicção de que toda empresa — independentemente do porte — merece acesso aos melhores especialistas. Por isso criamos uma plataforma que faz a curadoria, a conexão e o acompanhamento de ponta a ponta.</p>
        <p>Não somos um catálogo de serviços. Somos uma <strong>estrutura de solução</strong>: você traz o desafio, nós identificamos o especialista certo entre nossa rede qualificada, estruturamos a proposta e garantimos a entrega com padrão profissional.</p>
        <p>Todos os especialistas da 123 Consultoria passam por avaliação técnica, validação de experiência e comprometem-se com nosso padrão de confidencialidade e resultado. Você contrata segurança — não perfis desconhecidos.</p>'''

html = html.replace(old_sobre_text, new_sobre_text)

# ─── 8. SEÇÃO SERVIÇOS — tag e título ───────────────────────────────────────
html = html.replace(
    '<div class="section-tag fade-in">O que fazemos</div>\n    <h2 class="section-title fade-in">Nossas <em>especialidades</em>.</h2>\n    <p class="section-desc fade-in">Sete verticais integradas. Cada uma com equipe dedicada, metodologia própria e entrega orientada a resultado.</p>',
    '<div class="section-tag fade-in">Especialidades</div>\n    <h2 class="section-title fade-in">Sete verticais.<br><em>Um único ponto</em> de contato.</h2>\n    <p class="section-desc fade-in">Cada vertical conta com especialistas dedicados, selecionados por experiência comprovada. Você não precisa conhecer o mercado de consultoria — nós fazemos isso por você.</p>'
)

# ─── 9. INSERIR SEÇÃO "COMO FUNCIONA" antes de METODOLOGIA ─────────────────
como_funciona_section = '''
<!-- COMO FUNCIONA -->
<section id="como-funciona" style="padding:100px 0;">
  <div class="section-inner">
    <div class="section-tag fade-in">Processo</div>
    <h2 class="section-title fade-in">Como a <em>123 Consultoria</em> funciona.</h2>
    <p class="section-desc fade-in">Simples, transparente e orientado a resultado. Veja o caminho do primeiro contato até a entrega.</p>
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:32px; margin-top:60px;">

      <div class="fade-in" style="background:rgba(15,30,54,0.8); border:1px solid rgba(46,124,246,0.15); border-radius:16px; padding:36px 28px; position:relative;">
        <div style="font-family:'Cormorant Garamond',serif; font-size:3rem; color:rgba(46,124,246,0.2); font-weight:700; position:absolute; top:16px; right:24px;">01</div>
        <div style="font-size:2rem; margin-bottom:16px;">📋</div>
        <h3 style="font-family:'Cormorant Garamond',serif; font-size:1.3rem; margin-bottom:12px; color:var(--white);">Você descreve o desafio</h3>
        <p style="color:var(--muted); font-size:.9rem; line-height:1.75;">Preencha o formulário com sua necessidade. Pode ser estratégico, financeiro, operacional ou jurídico — sem jargão, só o problema real.</p>
      </div>

      <div class="fade-in" style="background:rgba(15,30,54,0.8); border:1px solid rgba(46,124,246,0.15); border-radius:16px; padding:36px 28px; position:relative;">
        <div style="font-family:'Cormorant Garamond',serif; font-size:3rem; color:rgba(46,124,246,0.2); font-weight:700; position:absolute; top:16px; right:24px;">02</div>
        <div style="font-size:2rem; margin-bottom:16px;">🔍</div>
        <h3 style="font-family:'Cormorant Garamond',serif; font-size:1.3rem; margin-bottom:12px; color:var(--white);">Selecionamos o especialista</h3>
        <p style="color:var(--muted); font-size:.9rem; line-height:1.75;">Nossa equipe analisa o contexto e identifica o profissional mais adequado da nossa rede — por formação, experiência no setor e histórico de resultados.</p>
      </div>

      <div class="fade-in" style="background:rgba(15,30,54,0.8); border:1px solid rgba(46,124,246,0.15); border-radius:16px; padding:36px 28px; position:relative;">
        <div style="font-family:'Cormorant Garamond',serif; font-size:3rem; color:rgba(46,124,246,0.2); font-weight:700; position:absolute; top:16px; right:24px;">03</div>
        <div style="font-size:2rem; margin-bottom:16px;">📄</div>
        <h3 style="font-family:'Cormorant Garamond',serif; font-size:1.3rem; margin-bottom:12px; color:var(--white);">Você recebe a proposta</h3>
        <p style="color:var(--muted); font-size:.9rem; line-height:1.75;">Em até 24 horas úteis você recebe uma proposta estruturada: escopo, prazo, entregáveis e valor. Sem surpresas, sem letra miúda.</p>
      </div>

      <div class="fade-in" style="background:rgba(15,30,54,0.8); border:1px solid rgba(46,124,246,0.15); border-radius:16px; padding:36px 28px; position:relative;">
        <div style="font-family:'Cormorant Garamond',serif; font-size:3rem; color:rgba(46,124,246,0.2); font-weight:700; position:absolute; top:16px; right:24px;">04</div>
        <div style="font-size:2rem; margin-bottom:16px;">🚀</div>
        <h3 style="font-family:'Cormorant Garamond',serif; font-size:1.3rem; margin-bottom:12px; color:var(--white);">Execução acompanhada</h3>
        <p style="color:var(--muted); font-size:.9rem; line-height:1.75;">Aprovada a proposta, o especialista inicia a execução com check-ins periódicos. A 123 Consultoria acompanha cada etapa até a entrega final.</p>
      </div>

    </div>

    <!-- BLOCO DE GARANTIAS -->
    <div style="margin-top:60px; display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:20px;">
      <div style="display:flex; align-items:center; gap:14px; padding:20px 24px; background:rgba(46,124,246,0.06); border:1px solid rgba(46,124,246,0.12); border-radius:12px;">
        <span style="font-size:1.4rem;">🔒</span>
        <div>
          <div style="font-weight:600; font-size:.9rem; color:var(--white);">Confidencialidade total</div>
          <div style="font-size:.8rem; color:var(--muted);">NDA assinado com todos os especialistas</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:14px; padding:20px 24px; background:rgba(46,124,246,0.06); border:1px solid rgba(46,124,246,0.12); border-radius:12px;">
        <span style="font-size:1.4rem;">✅</span>
        <div>
          <div style="font-weight:600; font-size:.9rem; color:var(--white);">Especialistas validados</div>
          <div style="font-size:.8rem; color:var(--muted);">Formação e experiência verificadas</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:14px; padding:20px 24px; background:rgba(46,124,246,0.06); border:1px solid rgba(46,124,246,0.12); border-radius:12px;">
        <span style="font-size:1.4rem;">⚡</span>
        <div>
          <div style="font-weight:600; font-size:.9rem; color:var(--white);">Proposta em 24h</div>
          <div style="font-size:.8rem; color:var(--muted);">Do contato à proposta estruturada</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:14px; padding:20px 24px; background:rgba(46,124,246,0.06); border:1px solid rgba(46,124,246,0.12); border-radius:12px;">
        <span style="font-size:1.4rem;">🇧🇷</span>
        <div>
          <div style="font-weight:600; font-size:.9rem; color:var(--white);">Todo o Brasil</div>
          <div style="font-size:.8rem; color:var(--muted);">Atendimento presencial ou remoto</div>
        </div>
      </div>
    </div>

  </div>
</section>

'''

html = html.replace('<!-- METODOLOGIA -->', como_funciona_section + '<!-- METODOLOGIA -->')

# ─── 10. NAV — adicionar link Como Funciona ──────────────────────────────────
html = html.replace(
    '<a href="#sobre">Sobre</a>\n    <a href="#servicos">Serviços</a>\n    <a href="#metodologia">Metodologia</a>',
    '<a href="#sobre">Sobre</a>\n    <a href="#como-funciona">Como Funciona</a>\n    <a href="#servicos">Serviços</a>\n    <a href="#metodologia">Metodologia</a>'
)
html = html.replace(
    '<a href="#sobre" onclick="closeMobile()">Sobre</a>\n  <a href="#servicos" onclick="closeMobile()">Serviços</a>\n  <a href="#metodologia" onclick="closeMobile()">Metodologia</a>',
    '<a href="#sobre" onclick="closeMobile()">Sobre</a>\n  <a href="#como-funciona" onclick="closeMobile()">Como Funciona</a>\n  <a href="#servicos" onclick="closeMobile()">Serviços</a>\n  <a href="#metodologia" onclick="closeMobile()">Metodologia</a>'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("✅ Site reestruturado com sucesso!")
print("   - Title e meta description atualizados")
print("   - Hero badge, H1 e subtítulo reescritos")
print("   - Hero stats refatorados")
print("   - Seção Sobre reposicionada")
print("   - Seção Serviços com novo posicionamento")
print("   - Seção Como Funciona criada (4 passos + 4 garantias)")
print("   - Nav atualizado com novo link")
