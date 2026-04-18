const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { nome, empresa, email, whatsapp, servico, mensagem } = req.body;
    const r = await pool.query(
      `INSERT INTO leads (nome, empresa, email, whatsapp, servico, mensagem)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [nome, empresa, email, whatsapp, servico, mensagem]
    );
    return res.status(201).json({ ok: true, id: r.rows[0].id });
  } catch(e) {
    return res.status(500).json({ erro: e.message });
  }
};
