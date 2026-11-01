import { defineConfig } from 'vitest/config';

// Unit tests only; the Firebase emulator suites in tests/*.mjs run via npm run test:rules / test:functions.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts']
  }
});
