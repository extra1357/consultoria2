import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const { projeto_id, especialista_id } = req.query;
      if (projeto_id) {
        const r = await pool.query(
          'SELECT * FROM projeto_mensagens WHERE projeto_id=$1 ORDER BY created_at ASC', [projeto_id]);
        return res.status(200).json({ mensagens: r.rows });
      }
      if (especialista_id) {
        const r = await pool.query(`
          SELECT pm.*, p.titulo as projeto_titulo
          FROM projeto_mensagens pm
          JOIN projetos p ON p.id = pm.projeto_id
          WHERE p.prestador_id=$1
          ORDER BY pm.created_at DESC`, [especialista_id]);
        return res.status(200).json({ mensagens: r.rows });
      }
      // Admin: todas as mensagens não respondidas
      const r = await pool.query(`
        SELECT pm.*, p.titulo as projeto_titulo, p.empresa, pr.nome as especialista_nome
        FROM projeto_mensagens pm
        JOIN projetos p ON p.id = pm.projeto_id
        JOIN prestadores pr ON pr.id = p.prestador_id
        WHERE pm.autor_tipo = 'especialista'
        ORDER BY pm.created_at DESC`);
      return res.status(200).json({ mensagens: r.rows });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }

  if (req.method === 'POST') {
    try {
      const { projeto_id, autor, autor_tipo, mensagem } = req.body;
      await pool.query(
        'INSERT INTO projeto_mensagens (projeto_id, autor, autor_tipo, mensagem) VALUES ($1,$2,$3,$4)',
        [projeto_id, autor, autor_tipo, mensagem]);
      await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('mensagem_projeto',$1,$2)`,
        [autor, `Mensagem no projeto #${projeto_id}`]);
      return res.status(201).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  return res.status(405).end();
}
