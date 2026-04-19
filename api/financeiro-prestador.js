import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: 'id obrigatório' });

  try {
    const r = await pool.query(
      `SELECT f.*, p.titulo as projeto_titulo, p.empresa as projeto_empresa
       FROM financeiro f
       JOIN projetos p ON p.id = f.projeto_id
       WHERE f.prestador_id = $1
       ORDER BY f.created_at DESC`,
      [id]
    );
    const total    = r.rows.reduce((a, f) => a + Number(f.valor || 0), 0);
    const pago     = r.rows.filter(f => f.status === 'pago').reduce((a, f) => a + Number(f.valor || 0), 0);
    return res.status(200).json({ financeiro: r.rows, total, pago, pendente: total - pago });
  } catch(e) { return res.status(500).json({ erro: e.message }); }
}
