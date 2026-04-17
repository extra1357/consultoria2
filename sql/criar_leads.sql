-- Execute no SQL Editor do Neon

CREATE TABLE IF NOT EXISTS leads (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(100)  NOT NULL,
  empresa     VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL,
  whatsapp    VARCHAR(20)   DEFAULT '',
  servico     VARCHAR(50)   NOT NULL,
  mensagem    TEXT          DEFAULT '',
  ip          VARCHAR(50)   DEFAULT '',
  origem      VARCHAR(255)  DEFAULT 'direto',
  status      VARCHAR(20)   NOT NULL DEFAULT 'novo'
                CHECK (status IN ('novo','em_andamento','convertido','descartado')),
  notas       TEXT          DEFAULT '',
  criado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status    ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_criado_em ON leads (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email     ON leads (email);
