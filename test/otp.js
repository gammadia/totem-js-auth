/*jslint browser: true */
/*global describe, it, before, require */

describe('Otp', function () {
    'use strict';

    var Otp = null;

    before(function (done) {
        require(['otp'], function (otp) {
            Otp = otp;
            return done();
        });
    });

    describe('Otp object', function () {
        it('Otp.create() should create an Srp object', function () {
            var otp = Otp.create(
                '580e7e1884b2212f2f326c9202de30dc5c205e1e7df8770bdab79604f6902353b63fc4c9d51761dcd29e178dc9c58f49f1f6270fd7183240cce05d118b836dd9',
                'http://127.0.0.1:9999/time'
            );
            otp.should.be.type('object');
        });
    });

    describe('Code generation', function () {
        var otp = null;

        before(function () {
            otp = Otp.create(
                '580e7e1884b2212f2f326c9202de30dc5c205e1e7df8770bdab79604f6902353b63fc4c9d51761dcd29e178dc9c58f49f1f6270fd7183240cce05d118b836dd9',
                'http://127.0.0.1:9999/time'
            );
        });

        it('should not fail on low codes', function () {
            var code = otp.makeCode(false, 2520464040001);
            code.should.be.exactly('00000e35e73b3099bd6a7e40');
        });
    });
});
