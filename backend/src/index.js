import { config } from './core/config/index.js';
import { startServer } from './server.js';

startServer({ config, processRef: process, exit: (code) => process.exit(code) });
