import { createApp } from './app.js';
import { createDatabase } from './database.js';

export const startServer = ({ config, processRef, exit }) => {
  const db = createDatabase(config.dbPath);
  const app = createApp({ db, clock: () => new Date(), config });

  const server = app.listen(config.port, () => {
    console.log(`[Disiplin Finansial] API aktif di port ${server.address().port}`);
  });

  const shutdown = () => {
    server.close(() => {
      db.close();
      exit(0);
    });
  };

  processRef.once('SIGINT', shutdown);
  processRef.once('SIGTERM', shutdown);

  return { server, db, shutdown };
};
