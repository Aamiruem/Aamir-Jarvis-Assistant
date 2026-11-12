import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests: npm test. jsdom gives localStorage and a DOM for the React hook tests.
// root: upper-case drive letter on Windows (see ROOT in vite.config.js), or every test file fails
// with "Vitest failed to find the runner" when the terminal started in "c:\...".
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)).replace(/^[a-z]:/, (d) => d.toUpperCase()),
  esbuild: { jsx: 'automatic' }, // same JSX runtime as the app build, so components render in tests
  test: { environment: 'jsdom', include: ['src/**/*.test.{js,jsx}'] },
});
