import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const { especialista_id, lead_id, id } = req.query;
      if (id) {
        const r = await pool.query(`
          SELECT n.*, l.nome as lead_nome, l.empresa as lead_empresa, l.email as lead_email,
                 l.whatsapp as lead_whatsapp, l.servico as lead_servico,
                 p.nome as especialista_nome
          FROM negociacoes n
          JOIN leads l ON l.id = n.lead_id
          JOIN prestadores p ON p.id = n.especialista_id
          WHERE n.id = $1`, [id]);
        return res.status(200).json({ negociacao: r.rows[0] });
      }
      let q = `SELECT n.*, l.nome as lead_nome, l.empresa as lead_empresa,
                      l.whatsapp as lead_whatsapp, l.servico as lead_servico,
                      p.nome as especialista_nome
               FROM negociacoes n
               JOIN leads l ON l.id = n.lead_id
               JOIN prestadores p ON p.id = n.especialista_id
               WHERE 1=1`;
      const params = [];
      if (especialista_id) { params.push(especialista_id); q += ` AND n.especialista_id=$${params.length}`; }
      if (lead_id) { params.push(lead_id); q += ` AND n.lead_id=$${params.length}`; }
      q += ' ORDER BY n.created_at DESC';
      const r = await pool.query(q, params);
      return res.status(200).json({ negociacoes: r.rows });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }

  if (req.method === 'POST') {
    try {
      const { lead_id, especialista_id, data_reuniao, link_gravacao, resumo, valor_proposto, prazo_proposto, observacoes } = req.body;
      const r = await pool.query(`
        INSERT INTO negociacoes (lead_id, especialista_id, data_reuniao, link_gravacao, resumo, valor_proposto, prazo_proposto, observacoes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [lead_id, especialista_id, data_reuniao, link_gravacao, resumo, valor_proposto, prazo_proposto, observacoes]);
      await pool.query(`UPDATE leads SET status='em_negociacao' WHERE id=$1`, [lead_id]);
      await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('negociacao_registrada',$1,$2)`,
        [`especialista_${especialista_id}`, `Reunião registrada para lead #${lead_id} — Valor: R$ ${valor_proposto}`]);
      return res.status(201).json({ ok: true, id: r.rows[0].id });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }

  if (req.method === 'PATCH') {
    try {
      const { id, status, admin_comentario } = req.body;
      await pool.query(`UPDATE negociacoes SET status=$1, admin_comentario=$2, updated_at=NOW() WHERE id=$3`,
        [status, admin_comentario, id]);
      if (status === 'aprovada') {
        const n = await pool.query(`SELECT * FROM negociacoes WHERE id=$1`, [id]);
        const neg = n.rows[0];
        // Cria projeto automaticamente
        const proj = await pool.query(`
          INSERT INTO projetos (negociacao_id, prestador_id, titulo, empresa, valor, prazo, prazo_conclusao, status)
          SELECT $1, $2, l.servico, l.empresa, $3, $4,
                 NOW() + ($4 || ' days')::INTERVAL, 'em_andamento'
          FROM leads l WHERE l.id = $5
          RETURNING id`, 
          [neg.id, neg.especialista_id, neg.valor_proposto, neg.prazo_proposto, neg.lead_id]);
        // Cria registro financeiro automaticamente
        await pool.query(`
          INSERT INTO financeiro (projeto_id, prestador_id, titulo, empresa, valor)
          SELECT $1, $2, l.servico, l.empresa, $3
          FROM leads l WHERE l.id = $4`,
          [proj.rows[0].id, neg.especialista_id, neg.valor_proposto, neg.lead_id]);
        await pool.query(`UPDATE leads SET status='convertido' WHERE id=$1`, [neg.lead_id]);
        await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('projeto_criado','admin',$1)`,
          [`Projeto criado — especialista #${neg.especialista_id} — Valor: R$ ${neg.valor_proposto}`]);
      }
      if (status === 'revisao') {
        await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('negociacao_revisao','admin',$1)`,
          [`Revisão solicitada para negociação #${id}: ${admin_comentario}`]);
      }
      return res.status(200).json({ ok: true });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }
  return res.status(405).end();
}
