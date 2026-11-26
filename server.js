import { createServer } from 'node:http';
import { MongoClient, ObjectId } from 'mongodb';
import { createClient } from 'redis';

const requiredEnvironment = ['MONGODB_URI', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);

if (missingEnvironment.length) {
  console.error(`Configure as variáveis obrigatórias no arquivo .env: ${missingEnvironment.join(', ')}`);
  process.exit(1);
}

const port = Number(process.env.PORT || 8000);
const supabaseUrl = process.env.SUPABASE_URL.replace(/\/+$/, '');
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const mongoClient = new MongoClient(process.env.MONGODB_URI);
const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL, socket: { connectTimeout: 5000, reconnectStrategy: false } })
  : (process.env.REDIS_HOST ? createClient({
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD,
      socket: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT || 6379), tls: process.env.REDIS_TLS === 'true', connectTimeout: 5000, reconnectStrategy: false },
    }) : null);
const RECENT_PURCHASES_CACHE_KEY = 'dfc:compras:recentes';
const RECENT_PURCHASES_CACHE_TTL = 300;

function respond(response, status, body, origin) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) {
      const error = new Error('O corpo da requisição excede o limite de 1 MB.');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('O corpo da requisição deve ser um JSON válido.');
    error.status = 400;
    throw error;
  }
}

function validateProduct(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Envie os dados do produto em formato JSON.';
  }

  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
  const preco = Number(body.preco);
  const imagem = typeof body.imagem === 'string' ? body.imagem.trim() : '';
  const categoria = typeof body.categoria === 'string' ? body.categoria.trim() : '';
  const ingredientes = body.ingredientes ?? [];

  if (!nome || nome.length > 120) return 'O nome é obrigatório e deve ter até 120 caracteres.';
  if (!descricao || descricao.length > 2000) return 'A descrição é obrigatória e deve ter até 2000 caracteres.';
  if (!Number.isFinite(preco) || preco <= 0) return 'O preço deve ser um número maior que zero.';
  if (imagem.length > 2048) return 'A URL da imagem deve ter até 2048 caracteres.';
  if (imagem) {
    try {
      const imageUrl = new URL(imagem);
      if (!['http:', 'https:'].includes(imageUrl.protocol)) return 'A imagem deve usar uma URL HTTP ou HTTPS.';
    } catch {
      return 'Informe uma URL válida para a imagem.';
    }
  }
  if (categoria.length > 80) return 'A categoria deve ter até 80 caracteres.';
  if (!Array.isArray(ingredientes) || ingredientes.length > 50
    || ingredientes.some((item) => typeof item !== 'string' || item.trim().length > 100)) {
    return 'Ingredientes deve ser uma lista de até 50 textos com no máximo 100 caracteres cada.';
  }
  if (typeof body.disponivel !== 'boolean') return 'Informe se o produto está disponível.';

  return {
    nome,
    descricao,
    preco,
    imagem,
    categoria,
    ingredientes: ingredientes.map((item) => item.trim()).filter(Boolean),
    disponivel: body.disponivel,
  };
}

async function verifyAdmin(request) {
  const match = request.headers.authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return { status: 401, message: 'Faça login para continuar.' };

  let userResponse;
  try {
    userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${match[1]}`,
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error('Falha ao validar a sessão no Supabase:', error.message);
    return { status: 502, message: 'Não foi possível validar a sessão no Supabase.' };
  }

  if (!userResponse.ok) return { status: 401, message: 'Sessão inválida ou expirada.' };

  const user = await userResponse.json();
  const profileUrl = new URL(`${supabaseUrl}/rest/v1/usuarios`);
  profileUrl.searchParams.set('id', `eq.${user.id}`);
  profileUrl.searchParams.set('select', 'role');

  let profileResponse;
  try {
    profileResponse = await fetch(profileUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${match[1]}`,
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error('Falha ao consultar a role no Supabase:', error.message);
    return { status: 502, message: 'Não foi possível verificar a permissão no Supabase.' };
  }

  if (!profileResponse.ok) {
    console.error(`Falha ao consultar a role no Supabase (HTTP ${profileResponse.status}).`);
    return { status: 502, message: 'Não foi possível verificar a permissão no Supabase.' };
  }

  const profiles = await profileResponse.json();
  if (!profiles.some((profile) => profile.role === 'admin')) {
    return { status: 403, message: 'Esta conta não possui permissão de administrador.' };
  }

  return null;
}

await mongoClient.connect();
const database = mongoClient.db(process.env.MONGODB_DATABASE || 'drink_feito_franca');
const products = database.collection('produtos');
const purchases = database.collection('compras');

if (redisClient) {
  redisClient.on('error', (error) => console.error('Redis indisponível:', error.message));
  try {
    await redisClient.connect();
    console.log('Redis conectado. Cache de últimas compras ativo por 5 minutos.');
  } catch (error) {
    console.error('Não foi possível conectar ao Redis. A API continuará sem cache:', error.message);
  }
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    respond(response, 403, { error: 'Origem não permitida.' });
    return;
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '600',
    });
    response.end();
    return;
  }

  const pathname = new URL(request.url, 'http://localhost').pathname;

  try {
    if (pathname === '/api/produtos' && request.method === 'GET') {
      const result = await products.find({}).sort({ nome: 1 }).toArray();
      respond(response, 200, result.map((product) => ({
        ...product,
        id: product._id.toString(),
        _id: product._id.toString(),
      })), origin);
      return;
    }

    if (pathname === '/api/compras/recentes' && request.method === 'GET') {
      if (redisClient?.isReady) {
        try {
          const cached = await redisClient.get(RECENT_PURCHASES_CACHE_KEY);
          if (cached) {
            respond(response, 200, JSON.parse(cached), origin);
            return;
          }
        } catch (error) {
          console.error('Falha ao consultar o cache Redis:', error.message);
        }
      }

      const recent = await purchases.find({}, { projection: { clienteId: 0 } })
        .sort({ criadoEm: -1 }).limit(8).toArray();
      const result = recent.map((purchase) => ({
        id: purchase._id.toString(),
        itens: purchase.itens,
        total: purchase.total,
        criadoEm: purchase.criadoEm,
      }));

      if (redisClient?.isReady) {
        try {
          await redisClient.set(RECENT_PURCHASES_CACHE_KEY, JSON.stringify(result), { EX: RECENT_PURCHASES_CACHE_TTL });
        } catch (error) {
          console.error('Falha ao atualizar o cache Redis:', error.message);
        }
      }

      respond(response, 200, result, origin);
      return;
    }

    if (pathname === '/api/compras' && request.method === 'POST') {
      const match = request.headers.authorization?.match(/^Bearer\s+(.+)$/i);
      if (!match) {
        respond(response, 401, { error: 'Entre na sua conta para registrar o pedido.' }, origin);
        return;
      }

      let userResponse;
      try {
        userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${match[1]}` },
          signal: AbortSignal.timeout(8000),
        });
      } catch (error) {
        respond(response, 502, { error: 'Não foi possível validar a sessão no Supabase.' }, origin);
        return;
      }
      if (!userResponse.ok) {
        respond(response, 401, { error: 'Sessão inválida ou expirada.' }, origin);
        return;
      }
      const user = await userResponse.json();
      const body = await readJson(request);
      if (!body || !Array.isArray(body.itens) || body.itens.length < 1 || body.itens.length > 50) {
        respond(response, 400, { error: 'O pedido deve conter entre 1 e 50 itens.' }, origin);
        return;
      }

      const itens = [];
      for (const item of body.itens) {
        const nome = typeof item.nome === 'string' ? item.nome.trim() : '';
        const preco = Number(item.preco);
        const quantidade = Number(item.quantidade);
        if (!nome || nome.length > 120 || !Number.isFinite(preco) || preco <= 0
          || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
          respond(response, 400, { error: 'Um ou mais itens do pedido são inválidos.' }, origin);
          return;
        }
        itens.push({ nome, preco, quantidade });
      }

      const total = itens.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
      const purchase = {
        clienteId: user.id,
        itens,
        total: Math.round((total + Number.EPSILON) * 100) / 100,
        status: 'pedido_enviado_whatsapp',
        criadoEm: new Date(),
      };
      const saved = await purchases.insertOne(purchase);
      const recent = await purchases.find({}, { projection: { clienteId: 0 } })
        .sort({ criadoEm: -1 }).limit(8).toArray();
      const cacheData = recent.map((entry) => ({
        id: entry._id.toString(), itens: entry.itens, total: entry.total, criadoEm: entry.criadoEm,
      }));
      if (redisClient?.isReady) {
        try {
          await redisClient.set(RECENT_PURCHASES_CACHE_KEY, JSON.stringify(cacheData), { EX: RECENT_PURCHASES_CACHE_TTL });
        } catch (error) {
          console.error('Falha ao atualizar o cache Redis após a compra:', error.message);
        }
      }
      respond(response, 201, { id: saved.insertedId.toString(), total: purchase.total }, origin);
      return;
    }

    if (pathname === '/api/produtos' && request.method === 'POST') {
      const authError = await verifyAdmin(request);
      if (authError) {
        respond(response, authError.status, { error: authError.message }, origin);
        return;
      }

      const product = validateProduct(await readJson(request));
      if (typeof product === 'string') {
        respond(response, 400, { error: product }, origin);
        return;
      }

      const result = await products.insertOne({
        ...product,
        criadoEm: new Date(),
      });
      respond(response, 201, { ...product, id: result.insertedId.toString(), _id: result.insertedId.toString() }, origin);
      return;
    }

    const deleteMatch = pathname.match(/^\/api\/produtos\/([^/]+)$/);
    if (deleteMatch && request.method === 'DELETE') {
      const authError = await verifyAdmin(request);
      if (authError) {
        respond(response, authError.status, { error: authError.message }, origin);
        return;
      }

      if (!ObjectId.isValid(deleteMatch[1])) {
        respond(response, 400, { error: 'ID de produto inválido.' }, origin);
        return;
      }

      const result = await products.deleteOne({ _id: new ObjectId(deleteMatch[1]) });
      if (!result.deletedCount) {
        respond(response, 404, { error: 'Produto não encontrado.' }, origin);
        return;
      }

      respond(response, 200, { ok: true }, origin);
      return;
    }

    respond(response, 404, { error: 'Rota não encontrada.' }, origin);
  } catch (error) {
    console.error('Erro ao processar requisição:', error.message);
    respond(response, error.status || 500, {
      error: error.status ? error.message : 'Erro interno ao processar a requisição.',
    }, origin);
  }
});

server.listen(port, () => {
  console.log(`API de produtos disponível em http://localhost:${port}`);
});

async function shutdown() {
  server.close();
  await mongoClient.close();
  if (redisClient?.isOpen) await redisClient.quit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
