import { defineConfig } from 'vitest/config';

// Unit tests: npm test. jsdom gives localStorage and a DOM for the React hook tests.
export default defineConfig({
  test: { environment: 'jsdom', include: ['src/**/*.test.{js,jsx}'] },
});
