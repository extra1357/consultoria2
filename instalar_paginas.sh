#!/bin/bash
cd ~/consultoria2

# Cria pasta servicos
mkdir -p servicos

# Copia os arquivos HTML
cp ~/Downloads/servicos/consultoria-empresarial.html servicos/
cp ~/Downloads/servicos/planejamento-financeiro.html servicos/
cp ~/Downloads/servicos/rh-pessoas.html servicos/
cp ~/Downloads/servicos/compliance-governanca.html servicos/
cp ~/Downloads/servicos/marketing-digital.html servicos/
cp ~/Downloads/servicos/fusoes-aquisicoes.html servicos/
cp ~/Downloads/servicos/gestao-estrategica.html servicos/

# Copia sitemap e robots
cp ~/Downloads/sitemap.xml .
cp ~/Downloads/robots.txt .

echo "✅ Arquivos copiados! Fazendo push..."

git add .
git commit -m "feat: 7 páginas de serviços com SEO, sitemap e robots.txt"
git push

echo "🚀 Deploy enviado! Aguarde 1-2 min para publicar."
