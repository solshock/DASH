const esbuild = require('esbuild');
const production = process.argv[2] === 'production';

esbuild.build({
  entryPoints: ['src/main.js'],
  bundle:      true,
  external:    ['obsidian', 'electron', '@codemirror/*', '@lezer/*'],
  format:      'cjs',
  target:      'chrome119',
  jsx:         'automatic',
  jsxImportSource: 'react',
  minify:      production,
  sourcemap:   production ? false : 'inline',
  outfile:     'main.js',
}).catch(() => process.exit(1));
