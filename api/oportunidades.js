import { Pool } from '@neondatabase/serverless';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { especialista_id } = req.query;

  // Leads abertos ainda não atribuídos, ou atribuídos a este especialista
  let q = `SELECT id,nome,empresa,servico,descricao,status,created_at
            FROM leads
            WHERE status IN ('novo','em_analise')`;
  const params = [];

  if (especialista_id) {
    q += ` AND (prestador_id IS NULL OR prestador_id=$1)`;
    params.push(especialista_id);
  }

  q += ` ORDER BY created_at DESC LIMIT 50`;

  const r = await pool.query(q, params);
  return res.status(200).json({ oportunidades: r.rows });
}
