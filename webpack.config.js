const path = require('path');

let basePath = path.join(__dirname, '/');
let config = {
  // Entry, file to be bundled
  entry: {
    'session': basePath +  '/lib/session.js'
  },
  devtool: 'source-map',
  output: {
    // Output directory
    path: basePath +  '/dist/',
    library: '[name]',
    // [hash:6] with add a SHA based on file changes if the env is build
    filename: '[name].min.js',
    libraryTarget: 'amd',
    umdNamedDefine: true
  },
  mode: 'production',
  resolve: {
    alias: {
      "async":                basePath + "/node_modules/async/dist/async",
      "bignum":               basePath + "/lib/bignum",
      "cryptojs":             basePath + "/node_modules/crypto-js/index",
      "jquery":               basePath + "/node_modules/jquery/dist/jquery",
      "otp":                  basePath + "/lib/otp",
      "session":              basePath + "/lib/session",
      "srp":                  basePath + "/lib/srp"
    },
    extensions: ['.js'] // File types
  }
};

module.exports = config;