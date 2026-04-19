import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: 'id obrigatório' });

  if (req.method === 'GET') {
    try {
      const r = await pool.query('SELECT id,nome,email,especialidades,bio,linkedin,whatsapp,status FROM prestadores WHERE id=$1', [id]);
      if (!r.rows[0]) return res.status(404).json({ erro: 'Prestador não encontrado' });
      return res.status(200).json({ prestador: r.rows[0] });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }

  if (req.method === 'PUT') {
    try {
      const { nome, bio, especialidade, linkedin, whatsapp } = req.body;
      await pool.query(
        'UPDATE prestadores SET nome=$1,bio=$2,especialidade=$3,linkedin=$4,whatsapp=$5 WHERE id=$6',
        [nome, bio, especialidade, linkedin, whatsapp, id]
      );
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }

  return res.status(405).json({ erro: 'Método não permitido' });
}
