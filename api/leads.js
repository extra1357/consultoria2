import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
};
export default async function handler(req, res) {
  cors(res);
  if (req.method==='OPTIONS') return res.status(200).end();
  const { type } = req.query;

  // ── LEADS
  if (!type || type==='leads') {
    if (req.method==='GET') {
      const { status, especialista_id } = req.query;
      let q = `SELECT l.*, p.nome as especialista_nome_ref FROM leads l LEFT JOIN prestadores p ON p.id=l.especialista_id WHERE 1=1`;
      const params=[];
      if (status) { params.push(status); q+=` AND l.status=$${params.length}`; }
      if (especialista_id) { params.push(especialista_id); q+=` AND l.especialista_id=$${params.length}`; }
      q+=' ORDER BY l.criado_em DESC';
      try {
        const r=await pool.query(q,params);
        return res.status(200).json({ leads: r.rows });
      } catch(e) { return res.status(500).json({ erro: e.message }); }
    }

    if (req.method==='POST') {
      try {
        const b = req.body;
        // Normaliza campos — aceita formato cliente e formato direto
        const nome     = b.nome || b.contato_empresa || b.contato || '';
        const empresa  = b.empresa || '';
        const email    = b.email || b.email_empresa || '';
        const whatsapp = b.whatsapp || b.telefone || '';
        const servico  = b.servico || b.area || b.titulo || '';
        const mensagem = b.mensagem || b.descricao || '';
        const origem   = b.origem || req.headers.referer || 'site';

        if (!empresa || !email) {
          return res.status(400).json({ erro: 'Empresa e email são obrigatórios' });
        }

        const r=await pool.query(
          `INSERT INTO leads (nome,empresa,email,whatsapp,servico,mensagem,origem,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'novo') RETURNING id`,
          [nome,empresa,email,whatsapp,servico,mensagem,origem]
        );
        await pool.query(
          `INSERT INTO auditoria (evento,ator,detalhes) VALUES ('lead_novo',$1,$2)`,
          [email, `${nome} — ${empresa} — ${servico}`]
        );
        return res.status(201).json({ ok:true, id:r.rows[0].id });
      } catch(e) { return res.status(500).json({ erro: e.message }); }
    }

    if (req.method==='PATCH') {
      try {
        const { id,status,notas,especialista_id } = req.body;
        await pool.query(
          `UPDATE leads SET status=COALESCE($1,status),notas=COALESCE($2,notas),especialista_id=COALESCE($3,especialista_id) WHERE id=$4`,
          [status,notas,especialista_id||null,id]
        );
        if (especialista_id) {
          const e=await pool.query('SELECT nome FROM prestadores WHERE id=$1',[especialista_id]);
          await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('lead_atribuido','admin',$1)`,[`Lead #${id} → ${e.rows[0]?.nome}`]);
        }
        if (status) {
          await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('lead_atualizado','admin',$1)`,[`Lead #${id} → ${status}`]);
        }
        return res.status(200).json({ ok:true });
      } catch(e) { return res.status(500).json({ erro: e.message }); }
    }
  }

  // ── NEGOCIAÇÕES (?type=neg)
  if (type==='neg') {
    if (req.method==='GET') {
      try {
        const { especialista_id, id } = req.query;
        if (id) {
          const r=await pool.query(`SELECT n.*,l.nome as lead_nome,l.empresa as lead_empresa,l.whatsapp as lead_whatsapp,l.servico as lead_servico,p.nome as especialista_nome FROM negociacoes n JOIN leads l ON l.id=n.lead_id JOIN prestadores p ON p.id=n.especialista_id WHERE n.id=$1`,[id]);
          return res.status(200).json({ negociacao:r.rows[0] });
        }
        let q=`SELECT n.*,l.nome as lead_nome,l.empresa as lead_empresa,l.whatsapp as lead_whatsapp,l.servico as lead_servico,p.nome as especialista_nome FROM negociacoes n JOIN leads l ON l.id=n.lead_id JOIN prestadores p ON p.id=n.especialista_id WHERE 1=1`;
        const params=[];
        if (especialista_id) { params.push(especialista_id); q+=` AND n.especialista_id=$${params.length}`; }
        q+=' ORDER BY n.created_at DESC';
        const r=await pool.query(q,params);
        return res.status(200).json({ negociacoes:r.rows });
      } catch(e) { return res.status(500).json({ erro: e.message }); }
    }
    if (req.method==='POST') {
      try {
        const { lead_id,especialista_id,data_reuniao,link_gravacao,resumo,valor_proposto,prazo_proposto,observacoes } = req.body;
        const r=await pool.query(
          `INSERT INTO negociacoes (lead_id,especialista_id,data_reuniao,link_gravacao,resumo,valor_proposto,prazo_proposto,observacoes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [lead_id,especialista_id,data_reuniao,link_gravacao,resumo,valor_proposto,prazo_proposto,observacoes]
        );
        await pool.query(`UPDATE leads SET status='em_andamento' WHERE id=$1`,[lead_id]);
        await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('negociacao_registrada',$1,$2)`,[`esp_${especialista_id}`,`Reunião para lead #${lead_id} — R$ ${valor_proposto}`]);
        return res.status(201).json({ ok:true, id:r.rows[0].id });
      } catch(e) { return res.status(500).json({ erro: e.message }); }
    }
    if (req.method==='PATCH') {
      try {
        const { id,status,admin_comentario } = req.body;
        await pool.query(`UPDATE negociacoes SET status=$1,admin_comentario=$2,updated_at=NOW() WHERE id=$3`,[status,admin_comentario,id]);
        if (status==='aprovada') {
          const n=(await pool.query('SELECT * FROM negociacoes WHERE id=$1',[id])).rows[0];
          const proj=await pool.query(
            `INSERT INTO projetos (negociacao_id,prestador_id,titulo,empresa,valor,prazo,status,progresso)
             SELECT $1,$2,l.servico,l.empresa,$3,$4,'em_andamento',0 FROM leads l WHERE l.id=$5 RETURNING id`,
            [n.id,n.especialista_id,n.valor_proposto,n.prazo_proposto,n.lead_id]
          );
          await pool.query(
            `INSERT INTO financeiro (projeto_id,prestador_id,titulo,empresa,valor,status)
             SELECT $1,$2,l.servico,l.empresa,$3,'pendente' FROM leads l WHERE l.id=$4`,
            [proj.rows[0].id,n.especialista_id,n.valor_proposto,n.lead_id]
          );
          await pool.query(`UPDATE leads SET status='convertido' WHERE id=$1`,[n.lead_id]);
          await pool.query(
            `INSERT INTO projeto_etapas (projeto_id,etapa,nome,status) VALUES
             ($1,1,'Kickoff','em_andamento'),
             ($1,2,'Diagnóstico','pendente'),
             ($1,3,'Proposta','pendente'),
             ($1,4,'Execução','pendente'),
             ($1,5,'Entrega','pendente'),
             ($1,6,'Encerramento','pendente')`,
            [proj.rows[0].id]
          );

          await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('projeto_criado','admin',$1)`,[`Projeto criado — esp #${n.especialista_id} — R$ ${n.valor_proposto}`]);
        }
        if (status==='revisao') {
          await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('negociacao_revisao','admin',$1)`,[`Revisão solicitada: ${admin_comentario}`]);
        }
        return res.status(200).json({ ok:true });
      } catch(e) { return res.status(500).json({ erro: e.message }); }
    }
  }

  // ── AUDITORIA (?type=audit)
  if (type==='audit') {
    try {
      const r=await pool.query('SELECT * FROM auditoria ORDER BY created_at DESC LIMIT 100');
      return res.status(200).json({ logs:r.rows });
    } catch(e) { return res.status(500).json({ erro: e.message }); }
  }

  return res.status(404).end();
}
