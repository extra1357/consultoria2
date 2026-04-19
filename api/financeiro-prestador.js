import { Pool } from '@neondatabase/serverless';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: 'id obrigatório' });

  const r = await pool.query(
    `SELECT f.*,p.titulo as projeto_titulo,p.empresa as projeto_empresa
     FROM financeiro f
     JOIN projetos p ON p.id=f.projeto_id
     WHERE p.prestador_id=$1
     ORDER BY f.created_at DESC`,
    [id]
  );

  const total = r.rows.reduce((acc, f) => acc + Number(f.valor || 0), 0);
  const pago  = r.rows.filter(f => f.status === 'pago').reduce((acc, f) => acc + Number(f.valor || 0), 0);

  return res.status(200).json({ financeiro: r.rows, total, pago, pendente: total - pago });
}
