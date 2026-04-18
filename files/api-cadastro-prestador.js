// api/cadastro-prestador.js — Vercel Serverless Function
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

// Garante que a tabela existe
async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS prestadores (
      id SERIAL PRIMARY KEY,
      protocolo TEXT UNIQUE NOT NULL,
      nome TEXT, cpf TEXT, email TEXT UNIQUE, whatsapp TEXT,
      endereco TEXT, cnpj TEXT, regime TEXT, linkedin TEXT,
      curso TEXT, faculdade TEXT, ano_formacao TEXT,
      pos_grad TEXT, experiencias TEXT, certs TEXT,
      especialidades JSONB, bio TEXT, honorarios TEXT,
      disponibilidade TEXT, assinou_prestacao BOOLEAN,
      assinou_nda BOOLEAN, status TEXT DEFAULT 'em_analise',
      data_contrato TEXT, senha_hash TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS auditoria (
      id SERIAL PRIMARY KEY,
      evento TEXT, ator TEXT, detalhes TEXT,
      ip TEXT, created_at TIMESTAMP DEFAULT NOW()
    )
  `)
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const client = await pool.connect()
  try {
    await ensureTable(client)
    const d = req.body
    if (!d.nome || !d.email || !d.protocolo) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' })
    }

    // Hash simples da senha (em produção use bcrypt)
    const senhaHash = Buffer.from(d.senha || '').toString('base64')

    await client.query(`
      INSERT INTO prestadores
        (protocolo, nome, cpf, email, whatsapp, endereco, cnpj, regime, linkedin,
         curso, faculdade, ano_formacao, pos_grad, experiencias, certs,
         especialidades, bio, honorarios, disponibilidade,
         assinou_prestacao, assinou_nda, data_contrato, senha_hash, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,'em_analise')
      ON CONFLICT (email) DO NOTHING
    `, [
      d.protocolo, d.nome, d.cpf, d.email, d.whatsapp, d.endereco, d.cnpj,
      d.regime, d.linkedin, d.curso, d.faculdade, d.anoFormacao, d.posGrad,
      d.experiencias, d.certs, JSON.stringify(d.especialidades || []),
      d.bio, d.honorarios, d.disponibilidade,
      d.assinou_prestacao || false, d.assinou_nda || false,
      d.dataContrato, senhaHash
    ])

    // Log de auditoria
    await client.query(
      `INSERT INTO auditoria (evento, ator, detalhes, ip) VALUES ($1,$2,$3,$4)`,
      ['Cadastro', d.nome, `Novo prestador cadastrado — protocolo ${d.protocolo}`, req.headers['x-forwarded-for'] || '—']
    )

    return res.status(200).json({ ok: true, protocolo: d.protocolo })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro interno', detail: err.message })
  } finally {
    client.release()
  }
}
