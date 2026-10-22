import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    server: { deps: { external: [/^node:/] } },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.js'],
      // index.js hanya titik masuk tanpa logika: memanggil startServer(config) yang sudah diuji penuh.
      exclude: ['src/index.js'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 }
    }
  }
});
