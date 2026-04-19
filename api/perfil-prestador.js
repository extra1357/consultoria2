import { Pool } from '@neondatabase/serverless';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: 'id obrigatório' });

  if (req.method === 'GET') {
    const r = await pool.query('SELECT id,nome,email,especialidade,bio,foto,status FROM prestadores WHERE id=$1', [id]);
    if (!r.rows[0]) return res.status(404).json({ erro: 'Prestador não encontrado' });
    return res.status(200).json({ prestador: r.rows[0] });
  }

  if (req.method === 'PUT') {
    const { nome, bio, foto, especialidade } = req.body;
    await pool.query(
      'UPDATE prestadores SET nome=$1,bio=$2,foto=$3,especialidade=$4,updated_at=NOW() WHERE id=$5',
      [nome, bio, foto, especialidade, id]
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ erro: 'Método não permitido' });
}
