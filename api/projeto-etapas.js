import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { projeto_id } = req.query;

  // GET — busca etapas do projeto
  if (req.method === 'GET') {
    try {
      if (!projeto_id) return res.status(400).json({ erro: 'projeto_id obrigatório' });
      const r = await pool.query(
        `SELECT * FROM projeto_etapas WHERE projeto_id=$1 ORDER BY etapa`,
        [projeto_id]
      );
      return res.status(200).json({ etapas: r.rows });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }

  // PATCH — atualiza uma etapa (avança, revisão, ou volta)
  if (req.method === 'PATCH') {
    try {
      const { projeto_id, etapa, status, progresso, observacao, atualizado_por } = req.body;
      if (!projeto_id || !etapa) return res.status(400).json({ erro: 'projeto_id e etapa obrigatórios' });

      await pool.query(
        `UPDATE projeto_etapas 
         SET status=$1, progresso=COALESCE($2,progresso), observacao=COALESCE($3,observacao),
             atualizado_por=$4, updated_at=NOW()
         WHERE projeto_id=$5 AND etapa=$6`,
        [status, progresso, observacao, atualizado_por, projeto_id, etapa]
      );

      // Se etapa concluída, ativa a próxima automaticamente
      if (status === 'concluida' && etapa < 6) {
        await pool.query(
          `UPDATE projeto_etapas SET status='em_andamento', updated_at=NOW()
           WHERE projeto_id=$1 AND etapa=$2 AND status='pendente'`,
          [projeto_id, etapa + 1]
        );
      }

      // Recalcula progresso geral do projeto (etapas concluídas / 6 * 100)
      const prog = await pool.query(
        `SELECT ROUND(COUNT(*) FILTER (WHERE status='concluida') * 100.0 / 6) as pct
         FROM projeto_etapas WHERE projeto_id=$1`,
        [projeto_id]
      );
      await pool.query(
        `UPDATE projetos SET progresso=$1, updated_at=NOW() WHERE id=$2`,
        [prog.rows[0].pct, projeto_id]
      );

      // Se todas concluídas, fecha o projeto
      const todas = await pool.query(
        `SELECT COUNT(*) as total FROM projeto_etapas 
         WHERE projeto_id=$1 AND status != 'concluida'`,
        [projeto_id]
      );
      if (parseInt(todas.rows[0].total) === 0) {
        await pool.query(
          `UPDATE projetos SET status='concluido', updated_at=NOW() WHERE id=$1`,
          [projeto_id]
        );
      }

      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }

  return res.status(405).json({ erro: 'Método não permitido' });
}
