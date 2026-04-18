import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    try {
      const { oportunidade_id, prestador_id } = req.query;
      let query = `SELECT c.*,p.nome as prestador_nome,p.email as prestador_email,
        p.especialidades,p.bio,p.whatsapp,o.titulo as oportunidade_titulo,o.empresa,o.valor,o.area
        FROM candidaturas c
        JOIN prestadores p ON p.id=c.prestador_id
        JOIN oportunidades o ON o.id=c.oportunidade_id WHERE 1=1`;
      const params = [];
      if (oportunidade_id) { params.push(oportunidade_id); query += ` AND c.oportunidade_id=$${params.length}`; }
      if (prestador_id) { params.push(prestador_id); query += ` AND c.prestador_id=$${params.length}`; }
      query += ' ORDER BY c.created_at DESC';
      const r = await pool.query(query, params);
      return res.status(200).json({ candidaturas: r.rows });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  if (req.method === 'POST') {
    try {
      const { oportunidade_id, prestador_id, mensagem } = req.body;
      await pool.query(
        `INSERT INTO candidaturas (oportunidade_id,prestador_id,mensagem) VALUES ($1,$2,$3)
         ON CONFLICT (oportunidade_id,prestador_id) DO NOTHING`,
        [oportunidade_id, prestador_id, mensagem]
      );
      await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('candidatura',$1,$2)`,
        [`prestador_${prestador_id}`, `Candidatura na oportunidade #${oportunidade_id}`]);
      return res.status(201).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  if (req.method === 'PATCH') {
    try {
      const { candidatura_id, status } = req.body;
      await pool.query("UPDATE candidaturas SET status=$1 WHERE id=$2", [status, candidatura_id]);
      if (status === 'aprovada') {
        const c = await pool.query(
          `SELECT c.*,o.titulo,o.empresa,o.valor,o.prazo,o.id as op_id
           FROM candidaturas c JOIN oportunidades o ON o.id=c.oportunidade_id WHERE c.id=$1`, [candidatura_id]);
        const cand = c.rows[0];
        const proj = await pool.query(
          `INSERT INTO projetos (oportunidade_id,prestador_id,titulo,empresa,valor,prazo)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [cand.op_id,cand.prestador_id,cand.titulo,cand.empresa,cand.valor,cand.prazo]);
        await pool.query(
          `INSERT INTO financeiro (projeto_id,prestador_id,titulo,empresa,valor) VALUES ($1,$2,$3,$4,$5)`,
          [proj.rows[0].id,cand.prestador_id,cand.titulo,cand.empresa,cand.valor]);
        await pool.query("UPDATE oportunidades SET status='em_andamento' WHERE id=$1", [cand.op_id]);
        await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('projeto_criado','admin',$1)`,
          [`Projeto: ${cand.titulo} → prestador #${cand.prestador_id}`]);
      }
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  return res.status(405).end();
}
