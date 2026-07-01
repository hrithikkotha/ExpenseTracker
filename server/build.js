const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

esbuild
  .build({
    entryPoints: ['./src/**/*.ts'],
    outdir: 'dist',
    bundle: false,
    minify: false,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    sourcemap: true,
    plugins: [nodeExternalsPlugin()],
  })
  .then(() => console.log('✅ Build complete'))
  .catch(() => process.exit(1));
