/*jslint browser: true, nomen: true */
/*global require */

require.config({
    baseUrl: '../lib',

    paths: {
        test: '../test/',
        should: 'vendors/should/should',
        mocha: 'vendors/mocha/mocha',
        blanket: 'vendors/blanket/dist/qunit/blanket',
        'blanket-browser': 'vendors/blanket/src/blanket_browser',
        'blanket-require': 'vendors/blanket/src/blanketRequire',

        jquery:                'vendors/jquery/dist/jquery',
        'cryptojs.core':       'vendors/crypto-js/components/core',
        'cryptojs.x64-core':   'vendors/crypto-js/components/x64-core',
        'cryptojs.sha1':       'vendors/crypto-js/components/sha1',
        'cryptojs.sha256':     'vendors/crypto-js/components/sha256',
        'cryptojs.sha512':     'vendors/crypto-js/components/sha512',
        'cryptojs.hmac':       'vendors/crypto-js/components/hmac',
        'cryptojs.enc-base64': 'vendors/crypto-js/components/enc-base64'
    },

    shim: {
        mocha: {exports: 'mocha'},
        blanket: {exports: 'blanket'},
        'blanket-browser': {
            deps: ['blanket'],
            exports: 'blanket'
        },
        'blanket-require': {
            deps: ['blanket'],
            exports: 'blanket'
        },
        'cryptojs.core':       {exports: 'CryptoJS'},
        'cryptojs.x64-core':   {exports: 'CryptoJS', deps: ['cryptojs.core']},
        'cryptojs.sha1':       {exports: 'CryptoJS', deps: ['cryptojs.core']},
        'cryptojs.sha256':     {exports: 'CryptoJS', deps: ['cryptojs.core']},
        'cryptojs.sha512':     {exports: 'CryptoJS', deps: ['cryptojs.x64-core']},
        'cryptojs.hmac':       {exports: 'CryptoJS', deps: ['cryptojs.core']},
        'cryptojs.enc-base64': {exports: 'CryptoJS', deps: ['cryptojs.core']}
    }
});

require(['mocha', 'blanket', 'should'], function (mocha, blanket) {
    'use strict';

    mocha.setup('bdd');
    blanket.options('filter', /lib\/(srp|otp|session)/);
    blanket.options('antifilter', /lib\/vendors/);
    blanket.options('debug', true);

    var OriginalReporter = mocha._reporter;

    mocha.reporter(function (runner, options) {
        runner.on('start', function () {
            blanket.setupCoverage();
        });

        runner.on('end', function () {
            blanket.onTestsDone();
        });

        runner.on('suite', function () {
            blanket.onModuleStart();
        });

        runner.on('test', function () {
            blanket.onTestStart();
        });

        runner.on('test end', function (test) {
            blanket.onTestDone(test.parent.tests.length, test.state === 'passed');
        });

        // Leaks
        runner.globals(['buff', 'CryptoJS', '_$blanket', '$', 'jQuery']);

        (new OriginalReporter(runner, options));
    });

    require([
        'test/srp',
        'test/session',
        'test/tipi'
    ], function () {
        mocha.checkLeaks();
        mocha.run();
    });
});