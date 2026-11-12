// npm test: runs Vitest from this folder with an upper-case drive letter on Windows.
// VS Code can open terminals in "c:\..."; Vitest then loads itself twice (c:/ and C:/ paths)
// and every test file fails with "Vitest failed to find the runner". Same fix as ROOT in vite.config.js.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url)).replace(/^[a-z]:/, (d) => d.toUpperCase());
const vitest = fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url)).replace(/^[a-z]:/, (d) => d.toUpperCase());
const { status } = spawnSync(process.execPath, [vitest, ...process.argv.slice(2)], { cwd, stdio: 'inherit' });
process.exit(status ?? 1);
