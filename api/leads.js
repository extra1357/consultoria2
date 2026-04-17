import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = req.headers['x-admin-key'];
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query(
        `SELECT id, nome, empresa, email, whatsapp, servico, mensagem,
                ip, origem, status, notas, criado_em
         FROM leads ORDER BY criado_em DESC`
      );
      return res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar leads.' });
    }
  }

  if (req.method === 'PATCH') {
    const { id, campo, valor } = req.body;
    const camposPermitidos = ['status', 'notas'];
    const statusPermitidos = ['novo','em_andamento','convertido','descartado'];

    if (!id || !camposPermitidos.includes(campo)) {
      return res.status(400).json({ error: 'Dados inválidos.' });
    }
    if (campo === 'status' && !statusPermitidos.includes(valor)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    try {
      const { rowCount } = await pool.query(
        `UPDATE leads SET ${campo} = $1 WHERE id = $2`,
        [valor.toString().substring(0, 1000), id]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'Lead não encontrado.' });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao atualizar lead.' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
