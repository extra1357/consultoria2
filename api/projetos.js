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

  // ── PROJETOS (default)
  if (!type || type==='projetos') {
    if (req.method==='GET') {
      const { especialista_id, status } = req.query;
      let q=`SELECT p.*,pr.nome as especialista_nome,pr.email as especialista_email,
              COALESCE((SELECT COUNT(*) FROM projeto_mensagens pm WHERE pm.projeto_id=p.id AND pm.autor_tipo='especialista'),0) as mensagens_pendentes
              FROM projetos p JOIN prestadores pr ON pr.id=p.prestador_id WHERE 1=1`;
      const params=[];
      if (especialista_id) { params.push(especialista_id); q+=` AND p.prestador_id=$${params.length}`; }
      if (status) { params.push(status); q+=` AND p.status=$${params.length}`; }
      q+=' ORDER BY p.created_at DESC';
      const r=await pool.query(q,params);
      return res.status(200).json({ projetos:r.rows });
    }

    if (req.method==='PATCH') {
      try {
        const { id, status, progresso, motivo_reprovacao } = req.body;
        if (!id) return res.status(400).json({ erro: 'id obrigatório' });

        const proj = (await pool.query('SELECT * FROM projetos WHERE id=$1',[id])).rows[0];
        if (!proj) return res.status(404).json({ erro: 'Projeto não encontrado' });

        // ── REGRA: especialista marca como entregue
        if (status === 'entregue') {
          if (proj.status !== 'em_andamento') 
            return res.status(400).json({ erro: 'Só projetos em andamento podem ser marcados como entregues' });
          await pool.query(
            'UPDATE projetos SET status=$1,entregue_em=NOW(),progresso=100,updated_at=NOW() WHERE id=$2',
            ['entregue', id]
          );
          await pool.query(
            `INSERT INTO auditoria (evento,ator,detalhes) VALUES ('projeto_entregue','especialista',$1)`,
            [`Projeto #${id} marcado como entregue pelo especialista`]
          );
          return res.status(200).json({ ok:true });
        }

        // ── REGRA: admin finaliza após auditoria
        if (status === 'finalizado') {
          if (proj.status !== 'entregue')
            return res.status(400).json({ erro: 'Só projetos entregues podem ser finalizados' });
          await pool.query(
            'UPDATE projetos SET status=$1,finalizado_em=NOW(),updated_at=NOW() WHERE id=$2',
            ['finalizado', id]
          );
          // Libera o especialista
          await pool.query(
            `UPDATE prestadores SET status='ativo' WHERE id=$1`,
            [proj.prestador_id]
          );
          // Atualiza financeiro para pagamento
          await pool.query(`UPDATE financeiro SET status='pendente' WHERE projeto_id=$1`,[id]);
          await pool.query(
            `INSERT INTO auditoria (evento,ator,detalhes) VALUES ('projeto_finalizado','admin',$1)`,
            [`Projeto #${id} finalizado — especialista #${proj.prestador_id} liberado`]
          );
          return res.status(200).json({ ok:true });
        }

        // ── REGRA: admin reprova entrega — volta para execução
        if (status === 'reprovado') {
          if (proj.status !== 'entregue')
            return res.status(400).json({ erro: 'Só projetos entregues podem ser reprovados' });
          await pool.query(
            'UPDATE projetos SET status=$1,motivo_reprovacao=$2,entregue_em=NULL,updated_at=NOW() WHERE id=$3',
            ['em_andamento', motivo_reprovacao || null, id]
          );
          await pool.query(
            `INSERT INTO auditoria (evento,ator,detalhes) VALUES ('projeto_reprovado','admin',$1)`,
            [`Projeto #${id} reprovado — motivo: ${motivo_reprovacao||'não informado'}`]
          );
          return res.status(200).json({ ok:true });
        }

        // ── Atualização geral (progresso)
        await pool.query(
          'UPDATE projetos SET progresso=COALESCE($1,progresso),updated_at=NOW() WHERE id=$2',
          [progresso, id]
        );
        await pool.query(
          `INSERT INTO auditoria (evento,ator,detalhes) VALUES ('projeto_atualizado','especialista',$1)`,
          [`Projeto #${id} progresso:${progresso}%`]
        );
        return res.status(200).json({ ok:true });

      } catch(e) { return res.status(500).json({ erro: e.message }); }
    }
  }

  // ── MENSAGENS (?type=msg)
  if (type==='msg') {
    if (req.method==='GET') {
      const { projeto_id, especialista_id } = req.query;
      if (projeto_id) {
        const r=await pool.query('SELECT * FROM projeto_mensagens WHERE projeto_id=$1 ORDER BY created_at ASC',[projeto_id]);
        return res.status(200).json({ mensagens:r.rows });
      }
      if (especialista_id) {
        const r=await pool.query(`SELECT pm.*,p.titulo as projeto_titulo FROM projeto_mensagens pm JOIN projetos p ON p.id=pm.projeto_id WHERE p.prestador_id=$1 ORDER BY pm.created_at DESC`,[especialista_id]);
        return res.status(200).json({ mensagens:r.rows });
      }
      const r=await pool.query(`SELECT pm.*,p.titulo as projeto_titulo,p.empresa,pr.nome as especialista_nome FROM projeto_mensagens pm JOIN projetos p ON p.id=pm.projeto_id JOIN prestadores pr ON pr.id=p.prestador_id WHERE pm.autor_tipo='especialista' ORDER BY pm.created_at DESC`);
      return res.status(200).json({ mensagens:r.rows });
    }
    if (req.method==='POST') {
      const { projeto_id, autor, autor_tipo, mensagem } = req.body;
      await pool.query('INSERT INTO projeto_mensagens (projeto_id,autor,autor_tipo,mensagem) VALUES ($1,$2,$3,$4)',[projeto_id,autor,autor_tipo,mensagem]);
      await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('mensagem_projeto',$1,$2)`,[autor,`Msg no projeto #${projeto_id}`]);
      return res.status(201).json({ ok:true });
    }
  }

  // ── FINANCEIRO (?type=fin)
  if (type==='fin') {
    if (req.method==='GET') {
      const { especialista_id } = req.query;
      const params=[];
      let where='';
      if (especialista_id) { params.push(especialista_id); where='WHERE f.prestador_id=$1'; }
      const regs=await pool.query(`SELECT f.*,p.nome as prestador_nome,p.email as prestador_email FROM financeiro f JOIN prestadores pr ON pr.id=f.prestador_id JOIN prestadores p ON p.id=f.prestador_id ${where} ORDER BY f.created_at DESC`,params);
      const tot=await pool.query(`SELECT COUNT(*) as total_projetos,COALESCE(SUM(valor),0) as total_bruto,COALESCE(SUM(valor)*0.15,0) as total_comissao,COALESCE(SUM(valor)*0.85,0) as total_liquido FROM financeiro f ${where}`,params);
      return res.status(200).json({ registros:regs.rows, totais:tot.rows[0] });
    }
    if (req.method==='PATCH') {
      const { id, status } = req.body;
      await pool.query('UPDATE financeiro SET status=$1 WHERE id=$2',[status,id]);
      await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('financeiro_atualizado','admin',$1)`,[`Financeiro #${id} → ${status}`]);
      return res.status(200).json({ ok:true });
    }
  }

  return res.status(404).end();
}
