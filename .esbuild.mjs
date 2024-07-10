#!/usr/bin/env node

import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['site/*', 'site/schemas/*', 'site/img/**'],
  external: ['data.json'],
  outdir: 'min',
  minify: true,
  bundle: true,
  loader: {
    '.jpg': 'copy',
    '.html': 'copy',
    '.ico': 'copy',
    '.png': 'copy',
    '.webmanifest': 'copy',
    '.proto': 'copy',
    '.json': 'empty',
  },
  sourcemap: true,
});
