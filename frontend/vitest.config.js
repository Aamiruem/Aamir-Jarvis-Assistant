import { defineConfig } from 'vitest/config';

// Unit tests: npm test. jsdom gives localStorage and a DOM for the React hook tests.
export default defineConfig({
  esbuild: { jsx: 'automatic' }, // same JSX runtime as the app build, so components render in tests
  test: { environment: 'jsdom', include: ['src/**/*.test.{js,jsx}'] },
});
