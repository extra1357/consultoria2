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
  if (req.method==='GET') {
    const { status } = req.query;
    let q='SELECT id,nome,email,whatsapp,curso,faculdade,bio,especialidades,status,created_at FROM prestadores WHERE 1=1';
    const params=[];
    if (status) { params.push(status); q+=` AND status=$${params.length}`; }
    q+=' ORDER BY created_at DESC';
    const r=await pool.query(q,params);
    return res.status(200).json({ prestadores:r.rows });
  }
  if (req.method==='PATCH') {
    const { id,status,motivo } = req.body;
    await pool.query('UPDATE prestadores SET status=$1 WHERE id=$2',[status,id]);
    await pool.query(`INSERT INTO auditoria (evento,ator,detalhes) VALUES ('especialista_atualizado','admin',$1)`,[`Especialista #${id} → ${status}${motivo?' — '+motivo:''}`]);
    return res.status(200).json({ ok:true });
  }
  return res.status(405).end();
}
