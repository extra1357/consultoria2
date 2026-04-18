import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    try {
      const status = req.query.status || 'aberta';
      const r = await pool.query("SELECT * FROM oportunidades WHERE status=$1 ORDER BY created_at DESC", [status]);
      return res.status(200).json({ oportunidades: r.rows });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  if (req.method === 'POST') {
    try {
      const { titulo, descricao, area, empresa, contato_empresa, email_empresa, valor, prazo } = req.body;
      const r = await pool.query(
        `INSERT INTO oportunidades (titulo,descricao,area,empresa,contato_empresa,email_empresa,valor,prazo,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pendente') RETURNING id`,
        [titulo,descricao,area,empresa,contato_empresa,email_empresa,valor,prazo]
      );
      await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('nova_oportunidade',$1,$2)`,
        [empresa, `Nova oportunidade: ${titulo}`]);
      return res.status(201).json({ ok: true, id: r.rows[0].id });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  if (req.method === 'PATCH') {
    try {
      const { id, status } = req.body;
      await pool.query("UPDATE oportunidades SET status=$1 WHERE id=$2", [status, id]);
      await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('oportunidade_atualizada','admin',$1)`,
        [`Oportunidade #${id} → ${status}`]);
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  return res.status(405).end();
}
