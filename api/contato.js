import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { nome, empresa, email, whatsapp, servico, mensagem } = req.body;

  if (!nome || !empresa || !email || !servico) {
    return res.status(422).json({ error: 'Campos obrigatórios faltando.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(422).json({ error: 'E-mail inválido.' });
  }

  const servicosValidos = [
    'consultoria-empresarial','planejamento-financeiro','rh-pessoas',
    'compliance','marketing-digital','fusoes-aquisicoes','gestao-estrategica','outro'
  ];
  if (!servicosValidos.includes(servico)) {
    return res.status(422).json({ error: 'Serviço inválido.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO leads (nome, empresa, email, whatsapp, servico, mensagem, ip, origem)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        nome.trim().substring(0, 100),
        empresa.trim().substring(0, 100),
        email.trim().toLowerCase().substring(0, 150),
        (whatsapp || '').trim().substring(0, 20),
        servico,
        (mensagem || '').trim().substring(0, 2000),
        req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
        req.headers['referer'] || 'direto',
      ]
    );
    return res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Erro ao salvar lead:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}
