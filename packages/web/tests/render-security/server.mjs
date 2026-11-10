import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../../', import.meta.url));
const baseline = process.env.POLAGRAM_RENDER_BASELINE;
const server = await createServer({
  root,
  configFile: false,
  esbuild: { jsx: 'automatic' },
  server: { host: '127.0.0.1', port: 4178, strictPort: true },
  plugins: baseline ? [{
    name: 'baseline-renderers',
    load(id) {
      if (/\/components\/(MermaidRenderer|ui\/MermaidDiagram)\.tsx$/.test(id)) {
        return execFileSync('git', ['show', `${baseline}:packages/web/${id.slice(root.length)}`], { cwd: root, encoding: 'utf8' });
      }
    },
  }] : [],
});
await server.listen();
