const path = require('node:path');
const nodeExternals = require('webpack-node-externals');

module.exports = (options) => ({
  ...options,
  externals: [
    nodeExternals({
      allowlist: [/^@cityborn\//],
      additionalModuleDirs: [path.resolve(__dirname, '../../node_modules')],
    }),
  ],
});
