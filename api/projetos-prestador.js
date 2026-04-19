import { Pool } from '@neondatabase/serverless';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: 'id obrigatório' });

  const r = await pool.query(
    `SELECT p.*,n.valor_proposto,n.prazo_proposto,l.nome as lead_nome,l.empresa as lead_empresa
     FROM projetos p
     LEFT JOIN negociacoes n ON n.id=p.negociacao_id
     LEFT JOIN leads l ON l.id=n.lead_id
     WHERE p.prestador_id=$1
     ORDER BY p.created_at DESC`,
    [id]
  );
  return res.status(200).json({ projetos: r.rows });
}
