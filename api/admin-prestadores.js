import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    try {
      const { status } = req.query;
      let query = 'SELECT id,nome,email,whatsapp,status,especialidades,bio,curso,created_at FROM prestadores';
      const params = [];
      if (status) { params.push(status); query += ' WHERE status=$1'; }
      query += ' ORDER BY created_at DESC';
      const r = await pool.query(query, params);
      return res.status(200).json({ prestadores: r.rows });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  if (req.method === 'PATCH') {
    try {
      const { id, status, motivo } = req.body;
      await pool.query("UPDATE prestadores SET status=$1 WHERE id=$2", [status, id]);
      await pool.query(
        `INSERT INTO auditoria (evento, ator, detalhes) VALUES ($1, 'admin', $2)`,
        [`prestador_${status}`, `Prestador #${id} → ${status}${motivo ? ': ' + motivo : ''}`]
      );
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  return res.status(405).end();
}
