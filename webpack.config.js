const path = require('path');
console.log([
  __dirname,
  path.resolve(__dirname, 'lib/session.js'),
  path.join(__dirname, "node_modules/crypto-js/index"),
  path.join(__dirname, "node_modules/jquery/dist/jquery"),
  path.join(__dirname, "lib/otp")
]);
let config = {
  // Entry, file to be bundled
  entry: path.resolve(__dirname, 'lib/session.js'),
  devtool: 'source-map',
  output: {
    // Output directory
    path: path.join(__dirname, 'dist/'),
    library: '[name]',
    // [hash:6] with add a SHA based on file changes if the env is build
    filename: '[name].min.js',
    libraryTarget: 'amd',
    umdNamedDefine: true
  },
  mode: 'production',
  resolve: {
    alias: {
      "async":                path.join(__dirname, "node_modules/async/dist/async"),
      "bignum":               path.join(__dirname, "lib/bignum"),
      "cryptojs":             path.join(__dirname, "node_modules/crypto-js/index"),
      "jquery":               path.join(__dirname, "node_modules/jquery/dist/jquery"),
      "otp":                  path.join(__dirname, "lib/otp"),
      "session":              path.join(__dirname, "lib/session"),
      "srp":                  path.join(__dirname, "lib/srp")
    },
    extensions: ['.js'] // File types
  }
};

module.exports = config;