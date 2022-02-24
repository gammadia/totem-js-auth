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
            "bignum": path.resolve("lib/bignum.js"),
            "otp": path.resolve("lib/otp.js"),
            "session": path.resolve("lib/session.js"),
            "srp": path.resolve("lib/srp.js")
        },
        extensions: ['.js'] // File types
    },
    externals: {
        jquery: "jquery"
    }
};

module.exports = config;
