import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    try {
      const r = await pool.query(`SELECT f.*,p.nome as prestador_nome,p.email as prestador_email
        FROM financeiro f JOIN prestadores p ON p.id=f.prestador_id ORDER BY f.created_at DESC`);
      const t = await pool.query(`SELECT SUM(valor) as total_bruto,SUM(valor*0.85) as total_liquido,
        SUM(valor*0.15) as total_comissao,COUNT(*) as total_projetos FROM financeiro`);
      return res.status(200).json({ registros: r.rows, totais: t.rows[0] });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  if (req.method === 'PATCH') {
    try {
      const { id, status, nf_emitida } = req.body;
      await pool.query("UPDATE financeiro SET status=COALESCE($1,status),nf_emitida=COALESCE($2,nf_emitida) WHERE id=$3",
        [status, nf_emitida, id]);
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  return res.status(405).end();
}
