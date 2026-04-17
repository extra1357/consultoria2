# 📦 123 Consultoria — Guia de Integração Completo

## Estrutura de arquivos gerados

```
123consultoria/
  ├── index.html          ← Página principal (substitui a "Em Breve")
  ├── robots.txt          ← Já fornecido por você (não alterar)
  ├── sitemap.xml         ← Já fornecido por você (não alterar)
  ├── admin/
  │   └── index.html      ← Painel admin de leads (protegido por login)
  ├── api/
  │   ├── contato.php     ← Recebe formulário e salva leads
  │   └── leads.php       ← API de leitura/atualização para o admin
  └── data/               ← Criada automaticamente pelo PHP
      └── leads.json      ← Banco de leads (gerado automaticamente)
```

---

## 🚀 Passo a passo de publicação

### 1. Upload dos arquivos

No painel do seu hosting (cPanel, FileZilla, etc.):

```
/public_html/
  ├── index.html          ← substitui qualquer index existente
  ├── robots.txt
  ├── sitemap.xml
  ├── admin/
  │   └── index.html
  └── api/
      ├── contato.php
      └── leads.php
```

> ⚠️ A pasta `data/` (onde ficam os leads) é criada automaticamente
> pelo PHP na primeira submissão. Não é necessário criar manualmente.

---

### 2. Configurar o backend (contato.php)

Abra `/api/contato.php` e edite as 3 linhas de configuração:

```php
$EMAIL_DESTINO   = 'SEU_EMAIL@123consultoria.com.br';
$EMAIL_REMETENTE = 'noreply@123consultoria.com.br';
$CHAVE_SECRETA   = 'qualquer_string_aleatoria_segura';
```

---

### 3. Configurar o painel admin

Abra `/admin/index.html` e troque as credenciais padrão:

```javascript
const USUARIOS = [
  { user: 'admin', pass: 'SENHA_FORTE_AQUI', nome: 'Administrador' },
  { user: 'consultor', pass: 'OUTRA_SENHA', nome: 'Nome do Consultor' },
];
```

> 🔒 O painel admin funciona 100% offline (localStorage) quando o PHP
> não está disponível. Quando o PHP está ativo, sincroniza com leads.json.

---

### 4. Configurar Google Search Console

1. Acesse: https://search.google.com/search-console
2. Adicione `https://www.123consultoria.com.br`
3. Copie o código de verificação e cole no `index.html`:

```html
<meta name="google-site-verification" content="SEU_CODIGO_REAL">
```

4. Envie o sitemap: `https://www.123consultoria.com.br/sitemap.xml`

---

### 5. Dados para atualizar no index.html

Procure e substitua os dados fictícios:

| Campo | Onde está | Substituir por |
|-------|-----------|----------------|
| Telefone | `(11) 0000-0000` | Seu telefone real |
| WhatsApp | `5511999999999` | Seu número real com DDD |
| E-mail | `contato@123consultoria.com.br` | Seu e-mail |
| Estatísticas | `+120`, `R$2B+`, etc. | Seus números reais |

---

## 🔑 Acesso ao painel admin

URL: `https://www.123consultoria.com.br/admin/`

- Usuário padrão: `admin`
- Senha padrão: `admin123`
- **⚠️ Troque imediatamente no código!**

### Funcionalidades do painel:
- ✅ Login com múltiplos usuários
- ✅ Dashboard com estatísticas de leads
- ✅ Filtro por status (Novo / Em andamento / Convertido / Descartado)
- ✅ Busca por nome, empresa ou e-mail
- ✅ Atualização de status em tempo real
- ✅ Campo de notas por lead
- ✅ Exportação CSV
- ✅ Funciona offline (localStorage) e online (PHP + JSON)

---

## 📊 Fluxo de um lead

```
Usuário preenche formulário
        ↓
contato.php salva em data/leads.json
        ↓
E-mail de notificação enviado para você
        ↓
Você acessa /admin/ e vê o lead como "Novo"
        ↓
Muda para "Em andamento" ao ligar/responder
        ↓
Muda para "Convertido" ao fechar negócio
```

---

## 🌐 SEO — O que já está configurado

- [x] Title e meta description otimizados
- [x] Schema.org JSON-LD (Organization + ProfessionalService)
- [x] Open Graph (WhatsApp, LinkedIn, Facebook)
- [x] Sitemap.xml
- [x] Robots.txt
- [x] Canonical URL
- [x] Lang pt-BR
- [x] Favicon inline SVG

---

## 🔧 Hospedagem recomendada (PHP disponível)

- **Locaweb** — boa performance no Brasil, suporte PHP
- **KingHost** — excelente suporte, PHP e MySQL inclusos
- **HostGator BR** — custo-benefício, PHP disponível

> Se usar Vercel/Netlify (apenas frontend), o backend PHP não funcionará.
> Nesse caso, o formulário salva via localStorage no navegador do visitante
> e você verá os leads apenas no painel admin da mesma máquina.
> Para produção real, use hospedagem com PHP.

---

*Gerado para www.123consultoria.com.br — Abril 2026*
