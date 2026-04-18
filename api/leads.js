import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const { status, especialista_id } = req.query;
      let q = `SELECT l.*, p.nome as especialista_nome_ref
               FROM leads l
               LEFT JOIN prestadores p ON p.id = l.especialista_id
               WHERE 1=1`;
      const params = [];
      if (status) { params.push(status); q += ` AND l.status=$${params.length}`; }
      if (especialista_id) { params.push(especialista_id); q += ` AND l.especialista_id=$${params.length}`; }
      q += ' ORDER BY l.criado_em DESC';
      const r = await pool.query(q, params);
      return res.status(200).json({ leads: r.rows });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }

  if (req.method === 'PATCH') {
    try {
      const { id, status, notas, especialista_id } = req.body;
      await pool.query(
        `UPDATE leads SET 
          status=COALESCE($1,status), 
          notas=COALESCE($2,notas),
          especialista_id=COALESCE($3,especialista_id)
         WHERE id=$4`,
        [status, notas, especialista_id, id]);
      if (especialista_id) {
        const esp = await pool.query('SELECT nome FROM prestadores WHERE id=$1', [especialista_id]);
        await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('lead_atribuido','admin',$1)`,
          [`Lead #${id} atribuído para ${esp.rows[0]?.nome}`]);
      }
      if (status) {
        await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('lead_atualizado','admin',$1)`,
          [`Lead #${id} → ${status}`]);
      }
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  return res.status(405).end();
}
