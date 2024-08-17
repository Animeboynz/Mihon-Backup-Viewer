#!/usr/bin/env node

import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['site/*', 'site/schemas/*', 'site/img/**'],
  outdir: 'min',
  dropLabels: ['DEV'],
  bundle: true,
  minify: true,
  sourcemap: false,
  loader: {
    '.jpg': 'copy',
    '.html': 'copy',
    '.ico': 'copy',
    '.png': 'copy',
    '.svg': 'copy',
    '.webp': 'copy',
    '.webmanifest': 'copy',
    '.proto': 'copy',
    '.json': 'empty',
  },
});
