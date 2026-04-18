import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  try {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha obrigatórios' });
    }

    const senhaHash = crypto.createHash('sha256').update(senha).digest('hex');

    const result = await pool.query(
      'SELECT id, nome, email, status, protocolo FROM prestadores WHERE email = $1 AND senha_hash = $2',
      [email.toLowerCase().trim(), senhaHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const prestador = result.rows[0];

    if (prestador.status === 'em_analise') {
      return res.status(403).json({ erro: 'Cadastro em análise. Aguarde aprovação.' });
    }

    if (prestador.status === 'reprovado') {
      return res.status(403).json({ erro: 'Cadastro reprovado. Entre em contato.' });
    }

    return res.status(200).json({
      ok: true,
      prestador: {
        id: prestador.id,
        nome: prestador.nome,
        email: prestador.email,
        status: prestador.status,
        protocolo: prestador.protocolo
      }
    });

  } catch (err) {
    console.error('Erro login:', err);
    return res.status(500).json({ erro: 'Erro interno' });
  }
}
