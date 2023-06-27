const path = require('path');
const config = {
  entry: './src/index.ts',
  devtool: 'source-map',
  output: {
    library: 'Session',
    filename: './session.js',
  },
  resolve: {
    alias: {
      crypto: false,
      assert: false,
      util: false,
      buffer: false,
      querystring: false,
      '../../../package.json': path.resolve(__dirname, 'package.json'),
    },
    extensions: ['.js', '.json', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'production',
};

module.exports = config;
