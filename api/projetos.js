import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const { especialista_id, status } = req.query;
      let q = `SELECT p.*, 
                      pr.nome as especialista_nome, pr.email as especialista_email,
                      COALESCE(
                        (SELECT COUNT(*) FROM projeto_mensagens pm WHERE pm.projeto_id=p.id AND pm.autor_tipo='especialista'),
                        0
                      ) as mensagens_pendentes
               FROM projetos p
               JOIN prestadores pr ON pr.id = p.prestador_id
               WHERE 1=1`;
      const params = [];
      if (especialista_id) { params.push(especialista_id); q += ` AND p.prestador_id=$${params.length}`; }
      if (status) { params.push(status); q += ` AND p.status=$${params.length}`; }
      q += ' ORDER BY p.created_at DESC';
      const r = await pool.query(q, params);
      return res.status(200).json({ projetos: r.rows });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }

  if (req.method === 'PATCH') {
    try {
      const { id, status, progresso } = req.body;
      await pool.query(
        'UPDATE projetos SET status=COALESCE($1,status), progresso=COALESCE($2,progresso), updated_at=NOW() WHERE id=$3',
        [status, progresso, id]);
      await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('projeto_atualizado','especialista',$1)`,
        [`Projeto #${id} → status:${status} progresso:${progresso}%`]);
      if (status === 'concluido') {
        await pool.query(`UPDATE financeiro SET status='pendente' WHERE projeto_id=$1`, [id]);
      }
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  return res.status(405).end();
}
