import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    try {
      const { prestador_id, ticket_id } = req.query;
      if (ticket_id) {
        const msgs = await pool.query('SELECT * FROM ticket_mensagens WHERE ticket_id=$1 ORDER BY created_at ASC', [ticket_id]);
        return res.status(200).json({ mensagens: msgs.rows });
      }
      let query = `SELECT t.*,p.nome as prestador_nome FROM tickets t
                   JOIN prestadores p ON p.id=t.prestador_id WHERE 1=1`;
      const params = [];
      if (prestador_id) { params.push(prestador_id); query += ` AND t.prestador_id=$${params.length}`; }
      query += ' ORDER BY t.created_at DESC';
      const r = await pool.query(query, params);
      return res.status(200).json({ tickets: r.rows });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  if (req.method === 'POST') {
    try {
      const { prestador_id, assunto, mensagem, ticket_id, autor, autor_tipo } = req.body;
      if (ticket_id) {
        await pool.query('INSERT INTO ticket_mensagens (ticket_id,autor,autor_tipo,mensagem) VALUES ($1,$2,$3,$4)',
          [ticket_id, autor, autor_tipo, mensagem]);
        if (autor_tipo === 'admin') await pool.query("UPDATE tickets SET status='respondido' WHERE id=$1", [ticket_id]);
        return res.status(201).json({ ok: true });
      }
      const t = await pool.query('INSERT INTO tickets (prestador_id,assunto) VALUES ($1,$2) RETURNING id', [prestador_id, assunto]);
      await pool.query('INSERT INTO ticket_mensagens (ticket_id,autor,autor_tipo,mensagem) VALUES ($1,$2,$3,$4)',
        [t.rows[0].id, autor, 'prestador', mensagem]);
      return res.status(201).json({ ok: true, ticket_id: t.rows[0].id });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  if (req.method === 'PATCH') {
    try {
      const { ticket_id, status } = req.body;
      await pool.query("UPDATE tickets SET status=$1 WHERE id=$2", [status, ticket_id]);
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  return res.status(405).end();
}
