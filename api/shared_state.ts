import { Redis } from '@upstash/redis';

const SHARED_STATE_KEY = 'torre:shared_state';
const MAX_STATE_BYTES = 4_000_000;

interface ServerlessRequest {
  method?: string;
  body?: unknown;
}

interface ServerlessResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ServerlessResponse;
  json(body: unknown): ServerlessResponse;
}

function isValidSharedState(payload: unknown): payload is Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return typeof candidate.id === 'string' || typeof candidate.dataSalvamento === 'string';
}

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN não configuradas.');
  }

  return new Redis({ url, token });
}

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<ServerlessResponse> {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const redis = createRedisClient();

    if (req.method === 'GET') {
      const storedState = await redis.get<string>(SHARED_STATE_KEY);
      if (storedState === null) {
        return res.status(200).json(null);
      }

      const parsedState: unknown = JSON.parse(storedState);
      return res.status(200).json(isValidSharedState(parsedState) ? parsedState : null);
    }

    if (!isValidSharedState(req.body)) {
      return res.status(400).json({ error: 'Sessão compartilhada inválida' });
    }

    const serializedState = JSON.stringify(req.body);
    const stateSizeBytes = new TextEncoder().encode(serializedState).byteLength;
    if (stateSizeBytes > MAX_STATE_BYTES) {
      return res.status(413).json({ error: 'Sessão compartilhada excede o limite de 4 MB' });
    }

    await redis.set(SHARED_STATE_KEY, serializedState);
    return res.status(200).json({ success: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Erro na API de sessão compartilhada:', error);
    return res.status(500).json({ error: 'Erro ao acessar o estado compartilhado' });
  }
}
