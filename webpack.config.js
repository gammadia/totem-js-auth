const path = require('path');
let config = {
  entry: {
    'session': path.resolve('lib/session.js')
  },
  devtool: 'source-map',
  output: {
    path: path.resolve('dist/'),
    library: '[name]',
    filename: '[name].min.js',
    libraryTarget: 'amd',
    umdNamedDefine: true
  },
  mode: 'production',
  resolve: {
    alias: {
      "async":                path.resolve("node_modules/async/dist/async.js"),
      "bignum":               path.resolve("lib/bignum.js"),
      "cryptojs":             path.resolve("node_modules/crypto-js/index.js"),
      "jquery":               path.resolve("node_modules/jquery/dist/jquery.js"),
      "otp":                  path.resolve("lib/otp.js"),
      "session":              path.resolve("lib/session.js"),
      "srp":                  path.resolve("lib/srp.js")
    },
    extensions: ['.js'] // File types
  }
};

module.exports = config;