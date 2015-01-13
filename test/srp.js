/*jslint browser: true */
/*global describe, it, before, require */

describe('Srp', function () {
    'use strict';

    var Srp = null;

    before(function (done) {
        require(['srp'], function (srp) {
            Srp = srp;
            return done();
        });
    });

    describe('Srp object', function () {
        it('new Srp() should create an Srp object', function () {
            var srp = new Srp();
            srp.should.be.type('object');
        });

        it('should refuse invalid s values', function () {
            var srp = new Srp();
            srp.sets(null).should.equal(false);
        });

        it('should refuse invalid B values', function () {
            var srp = new Srp();
            srp.setB(null).should.equal(false);
        });

        it('should not fail on low salt values', function () {
            var srp = new Srp('salt0', 'password123'),
                x = null;

            srp.should.be.type('object');
            srp.sets('0a765e718b3885a0648e093b798e6d37');

            x = srp.getx().toString(16);
            x.should.be.exactly('7b549517a6796961e6fa7b5817b11baf3ed27f10');
        });
    });

    describe('RFC5054 Test Vectors', function () {
        var srp = null;

        it('should instanciate Srp with alice and password123', function () {
            srp = new Srp('alice', 'password123');
            srp.should.be.type('object');
        });

        it('should set test values', function () {
            srp.rfc5054seta();
            srp.setB(
                'bd0c6151' + '2c692c0c' + 'b6d041fa' + '01bb152d' + '4916a1e7' + '7af46ae1' + '05393011' +
                    'baf38964' + 'dc46a067' + '0dd125b9' + '5a981652' + '236f99d9' + 'b681cbf8' + '7837ec99' +
                    '6c6da044' + '53728610' + 'd0c6ddb5' + '8b318885' + 'd7d82c7f' + '8deb75ce' + '7bd4fbaa' +
                    '37089e6f' + '9c6059f3' + '88838e7a' + '00030b33' + '1eb76840' + '910440b1' + 'b27aaeae' +
                    'eb4012b7' + 'd7665238' + 'a8e3fb00' + '4b117b58'
            );
            srp.sets('beb25379d1a8581eb5a727673a2441ee');
        });

        it('A = g^a', function () {
            var A = srp.getA().toString(16);
            A.should.be.exactly(
                '61d5e490' + 'f6f1b795' + '47b0704c' + '436f523d' + 'd0e560f0' + 'c64115bb' + '72557ec4' +
                    '4352e890' + '3211c046' + '92272d8b' + '2d1a5358' + 'a2cf1b6e' + '0bfcf99f' + '921530ec' +
                    '8e393561' + '79eae45e' + '42ba92ae' + 'aced8251' + '71e1e8b9' + 'af6d9c03' + 'e1327f44' +
                    'be087ef0' + '6530e69f' + '66615261' + 'eef54073' + 'ca11cf58' + '58f0edfd' + 'fe15efea' +
                    'b349ef5d' + '76988a36' + '72fac47b' + '0769447b'
            );
        });

        it('x = H(s, I, P)', function () {
            var x = srp.getx().toString(16);
            x.should.be.exactly('94b7555aabe9127cc58ccf4993db6cf84d16c124');
        });

        it('S = (B - kg ** x) ** a + ux', function () {
            var S = srp.getS().toString(16);
            S.should.be.exactly(
                'b0dc82ba' + 'bcf30674' + 'ae450c02' + '87745e79' + '90a3381f' + '63b387aa' + 'f271a10d' +
                    '233861e3' + '59b48220' + 'f7c4693c' + '9ae12b0a' + '6f67809f' + '0876e2d0' + '13800d6c' +
                    '41bb59b6' + 'd5979b5c' + '00a172b4' + 'a2a5903a' + '0bdcaf8a' + '709585eb' + '2afafa8f' +
                    '3499b200' + '210dcc1f' + '10eb3394' + '3cd67fc8' + '8a2f39a4' + 'be5bec4e' + 'c0a3212d' +
                    'c346d7e4' + '74b29ede' + '8a469ffe' + 'ca686e5a'
            );
        });

        it('M1 = H(A | B | S)', function () {
            var M1 = srp.getM1().toString(16);
            M1.should.be.exactly('b46a783846b7e569ff8f9b44ab8d88edeb085a65');
        });

        it('M2 = H(A | M1 | S)', function () {
            var M2 = srp.getM2().toString(16);
            M2.should.be.exactly('b0a6ad3024e79b5cad04042abb3a3f592d20c17');
        });

        it('K = SHA512(S)', function () {
            var K = srp.getK().toString(16);
            K.should.be.exactly('eb86bd35f055213d911e74ba485d516d2c7d648eca4fd7c4fd474cf9fff1d3a8b0efcb6bc0f2b07530bd02d6ea12f85f550b136958f783e4b84d47f727ae4b23');
        });
    });
});
