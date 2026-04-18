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
      let query = 'SELECT * FROM leads';
      const params = [];
      if (status) { params.push(status); query += ' WHERE status=$1'; }
      query += ' ORDER BY criado_em DESC';
      const r = await pool.query(query, params);
      return res.status(200).json({ leads: r.rows });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  if (req.method === 'PATCH') {
    try {
      const { id, status, notas } = req.body;
      await pool.query(
        'UPDATE leads SET status=COALESCE($1,status), notas=COALESCE($2,notas) WHERE id=$3',
        [status, notas, id]
      );
      await pool.query(
        `INSERT INTO auditoria (evento,ator,detalhes) VALUES ('lead_atualizado','admin',$1)`,
        [`Lead #${id} → ${status}`]
      );
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  return res.status(405).end();
}
