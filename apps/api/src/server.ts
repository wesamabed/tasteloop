import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchEntities } from '@tasteloop/qloo-client';

dotenv.config();

/**
 * Main server bootstrap wrapped in async function to avoid top-level await
 * issues when compiling to CommonJS. TS top-level await requires ESM module
 * targets; wrapping resolves the error. :contentReference[oaicite:8]{index=8}
 */
async function main() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  // --- Mongo (single pooled client recommended) ---
  const mongo = new MongoClient(process.env.MONGODB_URI!);
  await mongo.connect(); // reuse; pooling handled internally. :contentReference[oaicite:9]{index=9}
  const db = mongo.db('tasteloop');

  // --- Gemini (server-side to keep API key secret) ---
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); // best practice: server-side. :contentReference[oaicite:10]{index=10}

  app.get('/ping', async () => ({ pong: true }));

  // MVP seed route
  app.post('/seed', async (req, reply) => {
    const body = req.body as { seedsText: string; userKey?: string };
    const terms = body.seedsText
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const results = await Promise.all(terms.map((t) => searchEntities(t)));
    const chosen = results.map((r) => r?.[0]).filter(Boolean);

    if (body.userKey) {
      await db.collection('taste_profiles').updateOne(
        { userKey: body.userKey },
        { $set: { seeds: chosen, updatedAt: new Date() } },
        { upsert: true }
      );
    }
    reply.send({ chosen });
  });

  const port = Number(process.env.PORT) || 8080;
  try {
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`TasteLoop API listening on ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
// trigger
