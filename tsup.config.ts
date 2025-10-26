import { defineConfig } from 'tsup';
import { cpSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  shims: true,
  target: 'node18',
  outDir: 'dist',
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['readline/promises'],
  onSuccess: async () => {
    // Copy YAML template files to dist
    const srcTemplates = join(process.cwd(), 'src', 'templates', 'builtin');
    const distTemplates = join(process.cwd(), 'dist', 'templates', 'builtin');

    cpSync(srcTemplates, distTemplates, { recursive: true });
    console.log('✓ Copied template files to dist/templates/builtin');
  },
});
