#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════╗
║         SCANNER DE SAÚDE — 123consultoria.com.br             ║
║  Verifica se tudo documentado em 123consultoria_manutencao   ║
║  realmente existe e está funcionando.                        ║
╚══════════════════════════════════════════════════════════════╝

Uso:
    pip install requests dnspython
    python scanner_123consultoria.py

    Para salvar o relatório:
    python scanner_123consultoria.py > relatorio.txt
"""

import requests
import socket
import json
import sys
import time
import hashlib
from datetime import datetime

# ──────────────────────────────────────────────
# CONFIGURAÇÃO
# ──────────────────────────────────────────────
BASE_URL   = "https://www.123consultoria.com.br"
TIMEOUT    = 10   # segundos por requisição
PAUSE      = 0.4  # pausa entre requests para não sobrecarregar

# Credenciais dos especialistas (para testar login)
CREDS_ESPECIALISTAS = [
    {"email": "edson.uni9@gmail.com", "senha": "edson123", "nome": "Edson (owner)"},
    {"email": "joao@teste.com",       "senha": "teste123", "nome": "João (teste)"},
]

# ──────────────────────────────────────────────
# UTILITÁRIOS DE OUTPUT
# ──────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
BOLD   = "\033[1m"
RESET  = "\033[0m"
CYAN   = "\033[96m"

ok_count   = 0
fail_count = 0
warn_count = 0
results    = []

def header(title):
    print(f"\n{BOLD}{BLUE}{'═'*60}{RESET}")
    print(f"{BOLD}{BLUE}  {title}{RESET}")
    print(f"{BOLD}{BLUE}{'═'*60}{RESET}")

def subheader(title):
    print(f"\n{CYAN}  ── {title} ──{RESET}")

def ok(msg, detail=""):
    global ok_count
    ok_count += 1
    det = f" → {detail}" if detail else ""
    print(f"  {GREEN}✅ {msg}{det}{RESET}")
    results.append(("OK", msg, detail))

def fail(msg, detail=""):
    global fail_count
    fail_count += 1
    det = f" → {detail}" if detail else ""
    print(f"  {RED}❌ {msg}{det}{RESET}")
    results.append(("FAIL", msg, detail))

def warn(msg, detail=""):
    global warn_count
    warn_count += 1
    det = f" → {detail}" if detail else ""
    print(f"  {YELLOW}⚠️  {msg}{det}{RESET}")
    results.append(("WARN", msg, detail))

def info(msg):
    print(f"  {BLUE}ℹ️  {msg}{RESET}")

def get(path, params=None, label=None):
    """GET com tratamento de erro padronizado."""
    url = BASE_URL + path
    try:
        r = requests.get(url, params=params, timeout=TIMEOUT,
                         headers={"User-Agent": "Scanner-123Consultoria/1.0"})
        time.sleep(PAUSE)
        return r
    except requests.exceptions.SSLError as e:
        return None
    except requests.exceptions.ConnectionError as e:
        return None
    except requests.exceptions.Timeout:
        return None
    except Exception:
        return None

def post(path, body=None, params=None):
    """POST com tratamento de erro padronizado."""
    url = BASE_URL + path
    try:
        r = requests.post(url, json=body, params=params, timeout=TIMEOUT,
                          headers={
                              "Content-Type": "application/json",
                              "User-Agent": "Scanner-123Consultoria/1.0"
                          })
        time.sleep(PAUSE)
        return r
    except Exception:
        return None

def check_http(path, expected_codes=(200,), label=None, method="GET", body=None, params=None):
    """Checa se uma URL retorna o HTTP code esperado."""
    label = label or path
    if method == "GET":
        r = get(path, params=params)
    else:
        r = post(path, body=body, params=params)

    if r is None:
        fail(label, "Sem resposta / timeout / erro de conexão")
        return None

    if r.status_code in expected_codes:
        ok(label, f"HTTP {r.status_code}")
        return r
    else:
        fail(label, f"HTTP {r.status_code} (esperado: {expected_codes})")
        return r


# ══════════════════════════════════════════════
# 1. DNS
# ══════════════════════════════════════════════
def check_dns():
    header("1. DNS")

    subheader("Resolução de domínio")

    for host in ["123consultoria.com.br", "www.123consultoria.com.br"]:
        try:
            ip = socket.gethostbyname(host)
            if host == "123consultoria.com.br" and ip == "76.76.21.21":
                ok(f"DNS {host}", f"IP={ip} ✓ (Vercel correto)")
            elif host == "123consultoria.com.br":
                warn(f"DNS {host}", f"IP={ip} (esperado 76.76.21.21)")
            else:
                ok(f"DNS {host}", f"IP={ip}")
        except socket.gaierror as e:
            fail(f"DNS {host}", str(e))

    subheader("Conectividade HTTPS")
    r = get("/")
    if r is not None:
        ok("HTTPS acessível", f"HTTP {r.status_code}")
    else:
        fail("HTTPS acessível", "Não foi possível conectar")


# ══════════════════════════════════════════════
# 2. PÁGINAS PÚBLICAS
# ══════════════════════════════════════════════
def check_pages():
    header("2. Páginas Públicas")

    pages = [
        ("/",                                     "Landing page (index.html)"),
        ("/cliente",                              "Formulário do cliente"),
        ("/prestador/cadastro.html",              "Cadastro de especialista"),
        ("/prestador/area.html",                  "Área do especialista"),
        ("/admin/auditoria",                      "Painel admin (auditoria)"),
        ("/admin",                                "Painel admin (legado)"),
        ("/sitemap.xml",                          "sitemap.xml"),
        ("/robots.txt",                           "robots.txt"),
    ]

    subheader("Páginas principais")
    for path, label in pages:
        check_http(path, expected_codes=(200, 301, 302), label=label)

    subheader("Páginas de serviço (SEO)")
    servicos = [
        "/servicos/consultoria-empresarial.html",
        "/servicos/planejamento-financeiro.html",
        "/servicos/rh-pessoas.html",
        "/servicos/compliance-governanca.html",
        "/servicos/marketing-digital.html",
        "/servicos/fusoes-aquisicoes.html",
        "/servicos/gestao-estrategica.html",
    ]
    for path in servicos:
        check_http(path, expected_codes=(200,), label=path)


# ══════════════════════════════════════════════
# 3. APIs — GET simples
# ══════════════════════════════════════════════
def check_apis_get():
    header("3. APIs — GET")

    subheader("Endpoints básicos (devem retornar 200 ou 405)")
    endpoints = [
        ("/api/leads",                    "GET /api/leads (todos os leads)"),
        ("/api/leads?type=neg",           "GET /api/leads?type=neg (negociações)"),
        ("/api/leads?type=audit",         "GET /api/leads?type=audit (auditoria)"),
        ("/api/projetos",                 "GET /api/projetos"),
        ("/api/projetos?type=msg",        "GET /api/projetos?type=msg (mensagens)"),
        ("/api/projetos?type=fin",        "GET /api/projetos?type=fin (financeiro)"),
        ("/api/especialistas",            "GET /api/especialistas"),
    ]

    for path, label in endpoints:
        r = get(path)
        if r is None:
            fail(label, "Sem resposta")
            continue
        if r.status_code == 200:
            # tenta parsear JSON
            try:
                data = r.json()
                # verifica se tem alguma chave conhecida
                keys = list(data.keys()) if isinstance(data, dict) else []
                ok(label, f"HTTP 200 | JSON keys: {keys}")
            except Exception:
                warn(label, f"HTTP 200 mas resposta não é JSON válido")
        elif r.status_code in (401, 403):
            warn(label, f"HTTP {r.status_code} — protegido (pode ser esperado)")
        elif r.status_code == 405:
            warn(label, f"HTTP 405 — método não permitido para GET (rota existe)")
        else:
            fail(label, f"HTTP {r.status_code}")
        time.sleep(PAUSE)

    subheader("Filtros por parâmetro")
    filter_tests = [
        ("/api/leads?status=novo",        "GET /api/leads?status=novo"),
        ("/api/leads?especialista_id=1",  "GET /api/leads?especialista_id=1"),
        ("/api/especialistas?status=ativo", "GET /api/especialistas?status=ativo"),
    ]
    for path, label in filter_tests:
        r = get(path)
        if r is None:
            fail(label, "Sem resposta")
        elif r.status_code == 200:
            ok(label, f"HTTP 200")
        else:
            fail(label, f"HTTP {r.status_code}")
        time.sleep(PAUSE)


# ══════════════════════════════════════════════
# 4. AUTH — Login dos especialistas
# ══════════════════════════════════════════════
def check_auth():
    header("4. Autenticação — Login de Especialistas")

    subheader("POST /api/auth?action=login")

    for cred in CREDS_ESPECIALISTAS:
        r = post("/api/auth", body={"email": cred["email"], "senha": cred["senha"]},
                 params={"action": "login"})
        label = f"Login: {cred['nome']} ({cred['email']})"

        if r is None:
            fail(label, "Sem resposta")
            continue

        if r.status_code == 200:
            try:
                data = r.json()
                if data.get("ok") and data.get("prestador"):
                    p = data["prestador"]
                    ok(label, f"Logado! status={p.get('status','?')} id={p.get('id','?')}")
                    if p.get("status") != "ativo":
                        warn(f"  Status do especialista", f"'{p.get('status')}' (deveria ser 'ativo')")
                else:
                    warn(label, f"HTTP 200 mas ok=False ou sem prestador → {data}")
            except Exception:
                warn(label, "HTTP 200 mas JSON inválido")
        elif r.status_code == 401:
            fail(label, "HTTP 401 — credenciais rejeitadas")
        else:
            fail(label, f"HTTP {r.status_code} — {r.text[:80]}")

    subheader("POST /api/auth?action=login — credencial inválida (esperado 401)")
    r = post("/api/auth", body={"email": "invalido@teste.com", "senha": "senhaerrada"},
             params={"action": "login"})
    if r is None:
        warn("Login inválido", "Sem resposta")
    elif r.status_code == 401:
        ok("Login inválido retorna 401", "Correto — autenticação funcionando")
    elif r.status_code == 200:
        try:
            data = r.json()
            if not data.get("ok"):
                ok("Login inválido retorna ok=false", "Correto")
            else:
                fail("Login inválido ACEITOU credencial falsa!", str(data))
        except Exception:
            warn("Login inválido", f"HTTP 200 resposta inesperada")
    else:
        warn("Login inválido", f"HTTP {r.status_code}")


# ══════════════════════════════════════════════
# 5. API LEADS — POST (criação)
# ══════════════════════════════════════════════
def check_lead_creation():
    header("5. API Leads — POST (criação de lead)")

    subheader("POST /api/leads — formulário do cliente")

    payload = {
        "empresa":          "SCANNER TESTE AUTO",
        "area":             "financeiro",
        "titulo":           "Teste automatizado scanner",
        "descricao":        "Lead criado pelo scanner de saúde — pode ignorar",
        "valor":            "0",
        "prazo":            "N/A",
        "contato_empresa":  "Scanner Bot",
        "email_empresa":    "scanner@teste.com.br",
        "nome":             "Scanner Bot",
        "email":            "scanner@teste.com.br",
        "whatsapp":         "11000000000",
        "servico":          "Teste automatizado",
        "mensagem":         "Criado pelo health scanner — ignorar"
    }

    r = post("/api/leads", body=payload)

    if r is None:
        fail("POST /api/leads", "Sem resposta")
        return None

    if r.status_code in (200, 201):
        try:
            data = r.json()
            if data.get("ok"):
                lead_id = data.get("id")
                ok("POST /api/leads", f"Lead criado! id={lead_id}")
                return lead_id
            else:
                warn("POST /api/leads", f"HTTP {r.status_code} mas ok=False → {data}")
        except Exception:
            warn("POST /api/leads", f"HTTP {r.status_code} resposta não-JSON")
    else:
        fail("POST /api/leads", f"HTTP {r.status_code} — {r.text[:120]}")

    return None


# ══════════════════════════════════════════════
# 6. API LEADS — PATCH (atualização)
# ══════════════════════════════════════════════
def check_lead_update(lead_id):
    header("6. API Leads — PATCH (atualização)")

    if not lead_id:
        warn("PATCH /api/leads", "Pulado — lead de teste não foi criado")
        return

    subheader(f"Atualizando lead id={lead_id}")

    r = requests.patch(
        BASE_URL + "/api/leads",
        json={"id": lead_id, "status": "descartado", "notas": "Descartado pelo scanner de saúde"},
        timeout=TIMEOUT,
        headers={"Content-Type": "application/json", "User-Agent": "Scanner-123Consultoria/1.0"}
    )
    time.sleep(PAUSE)

    if r.status_code == 200:
        try:
            data = r.json()
            if data.get("ok"):
                ok("PATCH /api/leads", f"Lead {lead_id} marcado como descartado")
            else:
                warn("PATCH /api/leads", f"ok=False → {data}")
        except Exception:
            warn("PATCH /api/leads", "HTTP 200 mas JSON inválido")
    else:
        fail("PATCH /api/leads", f"HTTP {r.status_code} — {r.text[:80]}")


# ══════════════════════════════════════════════
# 7. API ESPECIALISTAS
# ══════════════════════════════════════════════
def check_especialistas():
    header("7. API Especialistas")

    subheader("GET /api/especialistas")
    r = get("/api/especialistas")
    if r is None:
        fail("GET /api/especialistas", "Sem resposta")
        return

    if r.status_code == 200:
        try:
            data = r.json()
            prestadores = data.get("prestadores", [])
            ok("GET /api/especialistas", f"Retornou {len(prestadores)} prestador(es)")

            # verifica se Edson está lá
            emails = [p.get("email","").lower() for p in prestadores]
            if "edson.uni9@gmail.com" in emails:
                ok("Edson encontrado no banco", "email=edson.uni9@gmail.com")
            else:
                warn("Edson não encontrado", "Pode ter sido deletado ou email mudou")

            # lista todos
            subheader("Prestadores cadastrados")
            for p in prestadores:
                status_color = GREEN if p.get("status") == "ativo" else YELLOW
                print(f"    {status_color}● id={p.get('id')} | {p.get('nome','?')} | {p.get('email','?')} | status={p.get('status','?')}{RESET}")

        except Exception as e:
            warn("GET /api/especialistas", f"Erro ao parsear JSON: {e}")
    else:
        fail("GET /api/especialistas", f"HTTP {r.status_code}")


# ══════════════════════════════════════════════
# 8. API AUDITORIA
# ══════════════════════════════════════════════
def check_auditoria():
    header("8. API Auditoria")

    r = get("/api/leads", params={"type": "audit"})
    if r is None:
        fail("GET /api/leads?type=audit", "Sem resposta")
        return

    if r.status_code == 200:
        try:
            data = r.json()
            logs = data.get("logs", [])
            ok("GET /api/leads?type=audit", f"{len(logs)} evento(s) registrado(s)")
            if logs:
                info(f"Último evento: [{logs[0].get('evento','?')}] por {logs[0].get('ator','?')} — {logs[0].get('detalhes','')[:60]}")
        except Exception as e:
            warn("Auditoria", f"Erro ao parsear: {e}")
    else:
        fail("GET /api/leads?type=audit", f"HTTP {r.status_code}")


# ══════════════════════════════════════════════
# 9. PROJETOS E FINANCEIRO
# ══════════════════════════════════════════════
def check_projetos_financeiro():
    header("9. APIs Projetos & Financeiro")

    subheader("Projetos")
    r = get("/api/projetos")
    if r and r.status_code == 200:
        try:
            data = r.json()
            projetos = data.get("projetos", [])
            ok("GET /api/projetos", f"{len(projetos)} projeto(s)")
        except Exception:
            warn("GET /api/projetos", "JSON inválido")
    elif r:
        fail("GET /api/projetos", f"HTTP {r.status_code}")
    else:
        fail("GET /api/projetos", "Sem resposta")

    subheader("Mensagens de projetos")
    r = get("/api/projetos", params={"type": "msg"})
    if r and r.status_code == 200:
        ok("GET /api/projetos?type=msg", "OK")
    elif r:
        fail("GET /api/projetos?type=msg", f"HTTP {r.status_code}")
    else:
        fail("GET /api/projetos?type=msg", "Sem resposta")

    subheader("Financeiro")
    r = get("/api/projetos", params={"type": "fin"})
    if r and r.status_code == 200:
        try:
            data = r.json()
            regs = data.get("financeiro", data.get("registros", []))
            ok("GET /api/projetos?type=fin", f"{len(regs)} registro(s) financeiro(s)")
        except Exception:
            ok("GET /api/projetos?type=fin", "HTTP 200")
    elif r:
        fail("GET /api/projetos?type=fin", f"HTTP {r.status_code}")
    else:
        fail("GET /api/projetos?type=fin", "Sem resposta")


# ══════════════════════════════════════════════
# 10. CONTATO LEGADO
# ══════════════════════════════════════════════
def check_contato_legado():
    header("10. API Contato (legado — formulário institucional)")

    r = post("/api/contato", body={
        "nome":     "Scanner Teste",
        "empresa":  "Scanner Bot",
        "email":    "scanner@teste.com.br",
        "whatsapp": "11000000000",
        "servico":  "Teste",
        "mensagem": "Teste automatizado pelo scanner de saúde — ignorar"
    })

    if r is None:
        fail("POST /api/contato", "Sem resposta")
    elif r.status_code in (200, 201):
        ok("POST /api/contato", f"HTTP {r.status_code}")
    elif r.status_code == 404:
        warn("POST /api/contato", "HTTP 404 — rota legada pode ter sido removida")
    else:
        fail("POST /api/contato", f"HTTP {r.status_code} — {r.text[:80]}")


# ══════════════════════════════════════════════
# 11. SEO — robots.txt e sitemap.xml
# ══════════════════════════════════════════════
def check_seo():
    header("11. SEO — robots.txt & sitemap.xml")

    subheader("robots.txt")
    r = get("/robots.txt")
    if r and r.status_code == 200:
        content = r.text
        if "Sitemap" in content or "sitemap" in content:
            ok("robots.txt", "Existe e referencia sitemap")
        else:
            warn("robots.txt", "Existe mas não referencia sitemap")
    elif r:
        fail("robots.txt", f"HTTP {r.status_code}")
    else:
        fail("robots.txt", "Sem resposta")

    subheader("sitemap.xml")
    r = get("/sitemap.xml")
    if r and r.status_code == 200:
        content = r.text
        urls_encontradas = content.count("<url>") + content.count("<loc>")
        if "123consultoria" in content:
            ok("sitemap.xml", f"Existe e referencia o domínio | ~{urls_encontradas} entradas")
        else:
            warn("sitemap.xml", "Existe mas não encontrou domínio no conteúdo")
    elif r:
        fail("sitemap.xml", f"HTTP {r.status_code}")
    else:
        fail("sitemap.xml", "Sem resposta")


# ══════════════════════════════════════════════
# 12. RESUMO FINAL
# ══════════════════════════════════════════════
def print_summary():
    total = ok_count + fail_count + warn_count
    print(f"\n\n{BOLD}{'═'*60}{RESET}")
    print(f"{BOLD}  RESUMO DO SCANNER — {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}{RESET}")
    print(f"{BOLD}{'═'*60}{RESET}")
    print(f"  Total de verificações : {total}")
    print(f"  {GREEN}✅ OK     : {ok_count}{RESET}")
    print(f"  {YELLOW}⚠️  Avisos : {warn_count}{RESET}")
    print(f"  {RED}❌ Falhas  : {fail_count}{RESET}")

    score = int((ok_count / total) * 100) if total else 0
    color = GREEN if score >= 80 else (YELLOW if score >= 60 else RED)
    print(f"\n  {color}{BOLD}Score de saúde: {score}%{RESET}")

    if fail_count > 0:
        print(f"\n{RED}{BOLD}  FALHAS DETECTADAS:{RESET}")
        for status, msg, detail in results:
            if status == "FAIL":
                print(f"  {RED}  ✗ {msg}{' → ' + detail if detail else ''}{RESET}")

    if warn_count > 0:
        print(f"\n{YELLOW}{BOLD}  AVISOS:{RESET}")
        for status, msg, detail in results:
            if status == "WARN":
                print(f"  {YELLOW}  ! {msg}{' → ' + detail if detail else ''}{RESET}")

    print(f"\n{BOLD}{'═'*60}{RESET}\n")


# ══════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════
def main():
    print(f"""
{BOLD}{CYAN}
╔══════════════════════════════════════════════════════════════╗
║      🔍  SCANNER DE SAÚDE — 123consultoria.com.br            ║
║      Baseado em: 123consultoria_manutencao.md                ║
╚══════════════════════════════════════════════════════════════╝
{RESET}""")
    print(f"  Base URL : {BASE_URL}")
    print(f"  Início   : {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"  Timeout  : {TIMEOUT}s por requisição")

    # Verifica se o requests está instalado
    try:
        import requests as _r
    except ImportError:
        print(f"\n{RED}Erro: biblioteca 'requests' não instalada.{RESET}")
        print("Execute: pip install requests")
        sys.exit(1)

    check_dns()
    check_pages()
    check_apis_get()
    check_auth()
    lead_id = check_lead_creation()
    check_lead_update(lead_id)
    check_especialistas()
    check_auditoria()
    check_projetos_financeiro()
    check_contato_legado()
    check_seo()
    print_summary()


if __name__ == "__main__":
    main()
