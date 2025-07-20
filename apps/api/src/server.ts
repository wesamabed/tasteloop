import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { logger } from '@tasteloop/observability';
import corePlugin from './plugins/core';

dotenv.config();

async function main() {
  logger.info('Bootstrapping server…');
  const app = Fastify({
    logger: false,
    genReqId: () => crypto.randomUUID(),
  });
  app.log = logger;
  logger.debug('Registering CORS & core plugin');
  await app.register(cors, { origin: true });
  await app.register(corePlugin);

  const port = Number(process.env.PORT) || 8080;
  logger.info({ port }, 'Listening');
  await app.listen({ port, host: '0.0.0.0' });
}

main()
  .then(() => logger.info('Server started successfully'))
  .catch((err) => {
    logger.fatal(err, 'Startup failure');
    process.exit(1);
  });
