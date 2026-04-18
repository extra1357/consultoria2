# 📋 Documentação de Manutenção — 123consultoria.com.br

> **Status:** Em produção | **Última atualização:** Abril/2026  
> Documento gerado a partir dos contextos de desenvolvimento do projeto.  
> Para o próximo dev: leia isso antes de tocar em qualquer coisa. 🙏

---

## 🏗️ Stack & Infraestrutura

| Item | Tecnologia |
|------|-----------|
| **Hosting** | Vercel (deploy automático via GitHub push) |
| **Banco de dados** | Neon Postgres (serverless) |
| **Backend** | Node.js — Serverless Functions (pasta `/api`) |
| **Frontend** | HTML puro + CSS + JS vanilla (sem framework) |
| **Repositório** | `https://github.com/extra1357/consultoria2` |
| **Domínio** | `www.123consultoria.com.br` |

---

## 🔑 Credenciais

> ⚠️ **Atenção:** Troque essas senhas se for para produção real.

### Painel Admin / Auditoria
| URL | Usuário | Senha |
|-----|---------|-------|
| `/admin/auditoria` | `admin@123consultoria.com.br` | `admin@123` |
| `/admin` (legado) | `admin` | `admin123` |

### Especialistas (Prestadores)
| Nome | Email | Senha |
|------|-------|-------|
| Edson (owner) | `edson.uni9@gmail.com` | `edson123` |
| João (teste) | `joao@teste.com` | `teste123` |

### Variáveis de Ambiente (Vercel)
| Variável | Valor / Onde obter |
|----------|--------------------|
| `DATABASE_URL` | String de conexão do Neon Postgres (painel neon.tech) |
| `ADMIN_SECRET_KEY` | `MinhaChave@2025!` |

> 📍 Configure em: **Vercel Dashboard → Projeto → Settings → Environment Variables**

---

## 🗄️ Banco de Dados — Neon Postgres

### Tabelas (10 no total)

```
prestadores        — cadastro dos especialistas
leads              — solicitações vindas do formulário do cliente
negociacoes        — reuniões de negociação entre especialista e lead
projetos           — projetos aprovados e em andamento
financeiro         — registros financeiros / comissões
oportunidades      — oportunidades publicadas para candidatura (legado)
candidaturas       — candidaturas dos prestadores (legado)
tickets            — suporte entre especialistas e admin
ticket_mensagens   — mensagens dentro dos tickets
auditoria          — log de todos os eventos do sistema
```

### Schema resumido

```sql
-- Prestadores (especialistas)
CREATE TABLE prestadores (
  id SERIAL PRIMARY KEY,
  protocolo TEXT,
  nome TEXT,
  email TEXT UNIQUE,
  senha_hash TEXT,       -- SHA-256 da senha
  whatsapp TEXT,
  curso TEXT,
  faculdade TEXT,
  bio TEXT,
  especialidades JSONB,  -- array de strings
  status TEXT DEFAULT 'em_analise',  -- em_analise | ativo | inativo
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leads (solicitações dos clientes)
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  nome TEXT,
  empresa TEXT,
  email TEXT,
  whatsapp TEXT,
  servico TEXT,
  mensagem TEXT,
  -- campos do formulário cliente (v2):
  area TEXT,
  titulo TEXT,
  descricao TEXT,
  valor TEXT,
  prazo TEXT,
  contato_empresa TEXT,
  email_empresa TEXT,
  status TEXT DEFAULT 'novo',  -- novo | em_negociacao | convertido | descartado
  especialista_id INTEGER REFERENCES prestadores(id),
  notas TEXT,
  ip TEXT,
  origem TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Negociações
CREATE TABLE negociacoes (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  especialista_id INTEGER REFERENCES prestadores(id),
  data_reuniao TEXT,
  link_gravacao TEXT,
  resumo TEXT,
  valor_proposto NUMERIC,
  prazo_proposto TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'pendente',  -- pendente | aprovada | revisao | recusada
  admin_comentario TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projetos
CREATE TABLE projetos (
  id SERIAL PRIMARY KEY,
  negociacao_id INTEGER REFERENCES negociacoes(id),
  prestador_id INTEGER REFERENCES prestadores(id),
  titulo TEXT,
  empresa TEXT,
  valor NUMERIC,
  prazo TEXT,
  status TEXT DEFAULT 'em_andamento',
  progresso INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Financeiro
CREATE TABLE financeiro (
  id SERIAL PRIMARY KEY,
  projeto_id INTEGER REFERENCES projetos(id),
  prestador_id INTEGER REFERENCES prestadores(id),
  titulo TEXT,
  empresa TEXT,
  valor NUMERIC,
  status TEXT DEFAULT 'pendente',  -- pendente | pago | cancelado
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auditoria (log de eventos)
CREATE TABLE auditoria (
  id SERIAL PRIMARY KEY,
  evento TEXT,
  ator TEXT,
  detalhes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tickets de suporte
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  prestador_id INTEGER REFERENCES prestadores(id),
  assunto TEXT,
  status TEXT DEFAULT 'aberto'
);

CREATE TABLE ticket_mensagens (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id),
  autor TEXT,
  autor_tipo TEXT,  -- 'prestador' | 'admin'
  mensagem TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Migrations aplicadas manualmente (ALTER TABLE)
```sql
-- Adicionados após criação inicial
ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS empresa TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS valor NUMERIC;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS prazo TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

---

## 📁 Estrutura de Pastas

```
consultoria2/
├── index.html                    ← Site institucional / landing page
├── sitemap.xml
├── robots.txt
│
├── api/                          ← Serverless functions (Node.js)
│   ├── auth.js                   ← Login e cadastro de prestadores
│   ├── leads.js                  ← Leads + Negociações + Auditoria (multi-rota)
│   ├── projetos.js               ← Projetos + Mensagens + Financeiro (multi-rota)
│   └── especialistas.js          ← CRUD de prestadores (admin)
│
├── admin/
│   ├── auditoria.html            ← Painel admin completo
│   └── index.html                ← Painel admin legado
│
├── prestador/
│   ├── area.html                 ← Dashboard do especialista (login)
│   └── cadastro.html             ← Formulário de cadastro do especialista
│
├── cliente/
│   └── index.html                ← Formulário de solicitação do cliente
│
└── servicos/                     ← Páginas de serviço (SEO)
    ├── consultoria-empresarial.html
    ├── planejamento-financeiro.html
    ├── rh-pessoas.html
    ├── compliance-governanca.html
    ├── marketing-digital.html
    ├── fusoes-aquisicoes.html
    └── gestao-estrategica.html
```

---

## 🔌 APIs — Rotas Completas

> **Base URL:** `https://www.123consultoria.com.br`  
> Todas as APIs são Serverless Functions em `/api/*.js` rodando no Vercel.  
> Autenticação: SHA-256 da senha comparado com `senha_hash` no banco.

---

### `POST /api/auth?action=login`
Login do prestador.

**Body:**
```json
{ "email": "...", "senha": "..." }
```
**Retorna:** `{ ok: true, prestador: { id, nome, email, status, especialidades } }`

---

### `POST /api/auth?action=cadastro`
Cadastro de novo prestador.

**Body:**
```json
{
  "nome": "...", "email": "...", "senha": "...",
  "whatsapp": "...", "curso": "...", "faculdade": "...",
  "bio": "...", "especialidades": ["..."]
}
```
**Retorna:** `{ ok: true, id: N }`  
**Obs:** Status inicial é `em_analise` — admin precisa ativar.

---

### `GET /api/leads`
Lista todos os leads (admin).

**Query params:**
- `?status=novo|em_negociacao|convertido|descartado`
- `?especialista_id=N` — filtra leads atribuídos ao especialista

**Retorna:** `{ leads: [...] }`

---

### `POST /api/leads`
Cria novo lead (formulário do cliente).

**Body:**
```json
{
  "nome": "...", "empresa": "...", "email": "...",
  "whatsapp": "...", "servico": "...", "mensagem": "...",
  "area": "...", "titulo": "...", "descricao": "...",
  "valor": "...", "prazo": "...",
  "contato_empresa": "...", "email_empresa": "..."
}
```
**Retorna:** `{ ok: true, id: N }`

---

### `PATCH /api/leads`
Atualiza lead (atribuir especialista, mudar status, adicionar notas).

**Body:**
```json
{ "id": N, "status": "...", "notas": "...", "especialista_id": N }
```

---

### `GET /api/leads?type=neg`
Lista negociações.

**Query params:**
- `?especialista_id=N`
- `?id=N` — detalhe de uma negociação específica

---

### `POST /api/leads?type=neg`
Registra nova negociação (especialista informa reunião).

**Body:**
```json
{
  "lead_id": N, "especialista_id": N,
  "data_reuniao": "...", "link_gravacao": "...",
  "resumo": "...", "valor_proposto": 9999,
  "prazo_proposto": "...", "observacoes": "..."
}
```
**Efeito colateral:** Muda status do lead para `em_negociacao`.

---

### `PATCH /api/leads?type=neg`
Admin aprova ou solicita revisão de negociação.

**Body:**
```json
{ "id": N, "status": "aprovada|revisao|recusada", "admin_comentario": "..." }
```
**Efeito colateral ao aprovar:**
- Cria registro em `projetos`
- Cria registro em `financeiro`
- Muda status do lead para `convertido`
- Registra na auditoria

---

### `GET /api/leads?type=audit`
Retorna últimos 100 eventos do log de auditoria.

**Retorna:** `{ logs: [...] }`

---

### `GET /api/projetos`
Lista projetos.

**Query params:** `?especialista_id=N`

---

### `PATCH /api/projetos`
Atualiza progresso e status do projeto.

**Body:** `{ "id": N, "progresso": 0-100, "status": "..." }`

---

### `GET /api/projetos?type=msg`
Lista mensagens de um projeto.

**Query params:** `?projeto_id=N`

---

### `POST /api/projetos?type=msg`
Envia mensagem em um projeto.

**Body:**
```json
{ "projeto_id": N, "autor": "...", "autor_tipo": "especialista|admin", "mensagem": "..." }
```

---

### `GET /api/projetos?type=fin`
Lista registros financeiros.

**Query params:** `?especialista_id=N`

---

### `PATCH /api/projetos?type=fin`
Atualiza status de pagamento.

**Body:** `{ "id": N, "status": "pago|pendente|cancelado" }`

---

### `GET /api/especialistas`
Lista todos os prestadores (admin).

**Query params:** `?status=ativo|em_analise|inativo`

---

### `PATCH /api/especialistas`
Ativa ou inativa um prestador.

**Body:** `{ "id": N, "status": "ativo|inativo" }`

---

### `POST /api/contato` *(legado — formulário institucional)*
Salva lead vindo do formulário principal do `index.html`.

---

## 🖥️ Páginas & URLs

| Página | URL | Acesso |
|--------|-----|--------|
| Landing page | `/` | Público |
| Formulário cliente | `/cliente` | Público |
| Cadastro especialista | `/prestador/cadastro.html` | Público |
| Área do especialista | `/prestador/area.html` | Login especialista |
| Painel admin | `/admin/auditoria` | `admin@123` |
| Serviço: Consultoria Empresarial | `/servicos/consultoria-empresarial.html` | Público |
| Serviço: Planejamento Financeiro | `/servicos/planejamento-financeiro.html` | Público |
| Serviço: RH & Pessoas | `/servicos/rh-pessoas.html` | Público |
| Serviço: Compliance | `/servicos/compliance-governanca.html` | Público |
| Serviço: Marketing Digital | `/servicos/marketing-digital.html` | Público |
| Serviço: Fusões & Aquisições | `/servicos/fusoes-aquisicoes.html` | Público |
| Serviço: Gestão Estratégica | `/servicos/gestao-estrategica.html` | Público |

---

## 🔄 Fluxo Completo do Sistema

```
[Cliente] → preenche formulário em /cliente
    ↓
[Lead criado] → status: "novo" — aparece no admin
    ↓
[Admin] → atribui especialista ao lead (PATCH /api/leads)
    ↓
[Especialista] → vê lead em /prestador/area → faz reunião
    → registra negociação (POST /api/leads?type=neg)
    → lead muda para: "em_negociacao"
    ↓
[Admin] → analisa negociação → aprova ou pede revisão
    → se aprovada: projeto + financeiro criados automaticamente
    → lead muda para: "convertido"
    ↓
[Especialista] → executa projeto, atualiza progresso, troca mensagens
    ↓
[Admin] → marca pagamento como "pago" no financeiro
    ↓
[Auditoria] → tudo registrado automaticamente
```

---

## 🌐 DNS — Registro.br

| Tipo | Nome | Dados |
|------|------|-------|
| A | `123consultoria.com.br` | `76.76.21.21` |
| CNAME | `www.123consultoria.com.br` | `1b77166cc8642702.vercel-dns-017.com.` |

---

## 📧 Contato do Site

- **Email:** `contato@123consultoria.com.br`
- **WhatsApp:** `(11) 97666-1297` → `https://wa.me/5511976661297`
- **LinkedIn:** `https://www.linkedin.com/company/123consultoria`

---

## 🚀 Deploy

```bash
# Fluxo padrão de deploy
cd ~/consultoria2
git add .
git commit -m "descricao da mudança"
git push
# Vercel faz o deploy automático em ~1-2 minutos
```

**Para forçar redeploy sem mudanças:**
```bash
vercel --prod
```

**Para verificar logs de erro:**
```bash
vercel logs https://www.123consultoria.com.br
```

---

## ⚠️ Pontos de Atenção

- **SHA-256 nas senhas:** O sistema usa `crypto.createHash('sha256')` — não bcrypt. Se migrar, precisa resetar todas as senhas.
- **Sem JWT:** Sessão gerenciada por `sessionStorage` no browser. Ao fechar o navegador, o especialista precisa logar novamente.
- **APIs multi-rota:** `leads.js` e `projetos.js` acumulam múltiplos recursos usando `?type=` como discriminador. Cuidado ao editar — uma API quebrada derruba vários recursos.
- **Tabela `leads` com campos duplos:** Tem campos do formulário antigo (`nome`, `empresa`, `whatsapp`, `servico`) e do novo formulário cliente (`area`, `titulo`, `descricao`, `contato_empresa`, `email_empresa`). Verifique qual campo popular ao criar leads.
- **Prestador novo fica `em_analise`:** Admin precisa ativar manualmente em `/admin/auditoria` → aba Especialistas.
- **Comissão da plataforma:** 15% (definido nos contratos gerados — não há cálculo automático no banco).
- **Foro de eleição:** Salto/SP — consta nos contratos gerados pelo sistema.

---

## 🔧 Comandos úteis de diagnóstico

```bash
# Verificar se todas as APIs estão no ar
curl -s -o /dev/null -w "auth: %{http_code}\n" https://www.123consultoria.com.br/api/auth
curl -s -o /dev/null -w "leads: %{http_code}\n" https://www.123consultoria.com.br/api/leads
curl -s -o /dev/null -w "projetos: %{http_code}\n" https://www.123consultoria.com.br/api/projetos
curl -s -o /dev/null -w "especialistas: %{http_code}\n" https://www.123consultoria.com.br/api/especialistas

# Testar envio de lead
curl -s -X POST "https://www.123consultoria.com.br/api/leads" \
  -H "Content-Type: application/json" \
  -d '{"empresa":"Teste","area":"financeiro","titulo":"Projeto Teste","descricao":"Teste","valor":"5000","prazo":"30 dias","contato_empresa":"Dev","email_empresa":"dev@teste.com"}'

# Listar prestadores no banco (via Neon SQL Editor)
SELECT id, nome, email, status FROM prestadores;

# Ver últimos leads
SELECT id, empresa, servico, status, especialista_id FROM leads ORDER BY id DESC LIMIT 10;

# Ver auditoria recente
SELECT evento, ator, detalhes, created_at FROM auditoria ORDER BY created_at DESC LIMIT 20;
```

---

*Documento parcial — gerado com base nos contextos de 1 a 8 do histórico de desenvolvimento.*  
*Pode haver APIs ou tabelas criadas após o contexto8 não documentadas aqui.*
