import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '60mb' }));

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'shared_state.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function isValidSharedState(payload: unknown): payload is Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return typeof candidate.id === 'string' || typeof candidate.dataSalvamento === 'string';
}

// Endpoint para carregar a sessão compartilhada da equipe (visível para quem acessar o link)
app.get('/api/shared_state', (_req, res) => {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return res.json(null);
    }

    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(data);

    if (!isValidSharedState(parsed)) {
      return res.json(null);
    }

    return res.json(parsed);
  } catch (err) {
    console.error('Erro ao ler shared_state:', err);
    return res.status(500).json({ error: 'Erro ao carregar sessão compartilhada' });
  }
});

// Endpoint para persistir a sessão compartilhada
app.post('/api/shared_state', (req, res) => {
  try {
    const payload = req.body;

    if (!isValidSharedState(payload)) {
      return res.status(400).json({ error: 'Sessão compartilhada inválida' });
    }

    fs.writeFileSync(STATE_FILE, JSON.stringify(payload), 'utf-8');
    return res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Erro ao salvar shared_state:', err);
    return res.status(500).json({ error: 'Erro ao salvar sessão compartilhada' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enorsul Cobrança Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
