import { Pool } from 'pg';
import crypto from 'crypto';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
};
export default async function handler(req, res) {
  cors(res);
  if (req.method==='OPTIONS') return res.status(200).end();
  const { action } = req.query;

  // POST /api/auth?action=login
  if (action==='login' && req.method==='POST') {
    const { email, senha } = req.body;
    const hash = crypto.createHash('sha256').update(senha).digest('hex');
    const r = await pool.query('SELECT id,nome,email,status,especialidades FROM prestadores WHERE email=$1 AND senha_hash=$2',[email,hash]);
    if (!r.rows.length) return res.status(401).json({ ok:false, erro:'Credenciais inválidas' });
    if (r.rows[0].status==='em_analise') return res.status(403).json({ ok:false, erro:'Cadastro ainda em análise' });
    if (r.rows[0].status==='reprovado') return res.status(403).json({ ok:false, erro:'Cadastro não aprovado' });
    return res.status(200).json({ ok:true, prestador: r.rows[0] });
  }

  // POST /api/auth?action=cadastro
  if (action==='cadastro' && req.method==='POST') {
    try {
      const { nome, email, senha, whatsapp, curso, faculdade, bio, especialidades } = req.body;
      const hash = crypto.createHash('sha256').update(senha).digest('hex');
      const r = await pool.query(
        `INSERT INTO prestadores (nome,email,senha_hash,whatsapp,curso,faculdade,bio,especialidades,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'em_analise') RETURNING id`,
        [nome,email,hash,whatsapp,curso,faculdade,bio,JSON.stringify(especialidades||[])]
      );
      await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('cadastro_especialista',$1,$2)`,[email,`Novo cadastro: ${nome}`]);
      return res.status(201).json({ ok:true, id: r.rows[0].id });
    } catch(e) {
      if (e.code==='23505') return res.status(400).json({ ok:false, erro:'E-mail já cadastrado' });
      return res.status(500).json({ erro: e.message });
    }
  }

  return res.status(404).end();
}
