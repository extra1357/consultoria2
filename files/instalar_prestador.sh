#!/bin/bash
# instalar_prestador.sh — instala o sistema de cadastro de prestadores
# Rode dentro de ~/consultoria2

echo "🚀 Instalando sistema de cadastro de prestadores..."

# Cria pastas necessárias
mkdir -p prestador
mkdir -p api
mkdir -p admin

# Copia os arquivos (assumindo que estão na mesma pasta)
cp cadastro-prestador.html prestador/cadastro.html
cp area-prestador.html prestador/area.html
cp admin-auditoria.html admin/auditoria.html
cp api-cadastro-prestador.js api/cadastro-prestador.js

echo "✅ Arquivos copiados:"
echo "   - prestador/cadastro.html    → /prestador/cadastro"
echo "   - prestador/area.html        → /prestador/area"
echo "   - admin/auditoria.html       → /admin/auditoria"
echo "   - api/cadastro-prestador.js  → /api/cadastro-prestador"

# Adiciona links no index.html para o cadastro
echo ""
echo "📌 Adicionando link de cadastro no rodapé do site..."
python3 << 'EOF'
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Adiciona link no footer se ainda não existe
if 'Seja um especialista' not in html:
    html = html.replace(
        '<a href="#contato">Contato</a>',
        '<a href="#contato">Contato</a>\n        <a href="/prestador/cadastro.html">Seja um especialista</a>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("✅ Link 'Seja um especialista' adicionado no footer")
else:
    print("ℹ️  Link já existe no footer")
EOF

echo ""
echo "📋 Criando tabela SQL no Neon..."
echo "   Execute no painel do Neon (SQL Editor):"
echo ""
echo "   CREATE TABLE IF NOT EXISTS prestadores ("
echo "     id SERIAL PRIMARY KEY,"
echo "     protocolo TEXT UNIQUE NOT NULL,"
echo "     nome TEXT, cpf TEXT, email TEXT UNIQUE,"
echo "     whatsapp TEXT, endereco TEXT, cnpj TEXT,"
echo "     regime TEXT, linkedin TEXT, curso TEXT,"
echo "     faculdade TEXT, ano_formacao TEXT,"
echo "     pos_grad TEXT, experiencias TEXT,"
echo "     certs TEXT, especialidades JSONB,"
echo "     bio TEXT, honorarios TEXT,"
echo "     disponibilidade TEXT,"
echo "     assinou_prestacao BOOLEAN,"
echo "     assinou_nda BOOLEAN,"
echo "     status TEXT DEFAULT 'em_analise',"
echo "     data_contrato TEXT,"
echo "     senha_hash TEXT,"
echo "     created_at TIMESTAMP DEFAULT NOW()"
echo "   );"
echo ""
echo "   CREATE TABLE IF NOT EXISTS auditoria ("
echo "     id SERIAL PRIMARY KEY,"
echo "     evento TEXT, ator TEXT,"
echo "     detalhes TEXT, ip TEXT,"
echo "     created_at TIMESTAMP DEFAULT NOW()"
echo "   );"

echo ""
echo "🎉 Instalação concluída! Próximos passos:"
echo "   1. Rodar o SQL acima no Neon"
echo "   2. git add . && git commit -m 'feat: sistema cadastro prestadores' && git push"
echo "   3. Acessar: www.123consultoria.com.br/prestador/cadastro.html"
echo "   4. Admin:   www.123consultoria.com.br/admin/auditoria.html"
echo "      Login admin: admin@123consultoria.com.br / admin@123"
