import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { especialista_id } = req.query;

  try {
    let q = `SELECT id, nome, empresa, servico, mensagem, status, criado_em
             FROM leads
             WHERE status IN ('novo','em_analise')`;
    const params = [];

    if (especialista_id) {
      q += ` AND (especialista_id IS NULL OR especialista_id=$1)`;
      params.push(especialista_id);
    }

    q += ` ORDER BY criado_em DESC LIMIT 50`;

    const r = await pool.query(q, params);
    return res.status(200).json({ oportunidades: r.rows });
  } catch(e) { return res.status(500).json({ erro: e.message }); }
}
