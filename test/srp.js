/*jslint browser: true */
/*global describe, it, before, require */

describe('Srp', function () {
    'use strict';

    var Srp = null,
        Bn = null;

    before(function (done) {
        require(['srp', 'bignum'], function (srp, bn) {
            Srp = srp;
            Bn = bn;
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
    });

    describe('RFC5054 Test Vectors', function () {
        var srp = null;

        it('should instanciate Srp with alice and password123', function () {
            srp = new Srp('alice', 'password123');
            srp.should.be.type('object');
        });

        it('should set test values', function () {
            srp.a = Bn.create('60975527035cf2ad1989806f0407210bc81edc04e2762a56afd529ddda2d4393', 16);
            srp.setB('bd0c61512c692c0cb6d041fa01bb152d4916a1e77af46ae105393011baf38964dc46a0670dd125b95a981652236f99d9b681cbf87837ec996c6da04453728610d0c6ddb58b318885d7d82c7f8deb75ce7bd4fbaa37089e6f9c6059f388838e7a00030b331eb76840910440b1b27aaeaeeb4012b7d7665238a8e3fb004b117b58');
            srp.sets('beb25379d1a8581eb5a727673a2441ee');
        });

        it('A = g^a', function () {
            var A = srp.getA().toString(16);
            A.should.be.exactly('61d5e490f6f1b79547b0704c436f523dd0e560f0c64115bb72557ec44352e8903211c04692272d8b2d1a5358a2cf1b6e0bfcf99f921530ec8e39356179eae45e42ba92aeaced825171e1e8b9af6d9c03e1327f44be087ef06530e69f66615261eef54073ca11cf5858f0edfdfe15efeab349ef5d76988a3672fac47b0769447b');
        });

        it('x = H(s, I, P)', function () {
            var x = srp.getx().toString(16);
            x.should.be.exactly('94b7555aabe9127cc58ccf4993db6cf84d16c124');
        });

        it('S = (B - kg ** x) ** x', function () {
            var S = srp.getS().toString(16);
            S.should.be.exactly('b0dc82babcf30674ae450c0287745e7990a3381f63b387aaf271a10d233861e359b48220f7c4693c9ae12b0a6f67809f0876e2d013800d6c41bb59b6d5979b5c00a172b4a2a5903a0bdcaf8a709585eb2afafa8f3499b200210dcc1f10eb33943cd67fc88a2f39a4be5bec4ec0a3212dc346d7e474b29ede8a469ffeca686e5a');
        });

        it('M1 = H(A | B | S)', function () {
            var M1 = srp.getM1String();
            M1.should.be.exactly('b46a783846b7e569ff8f9b44ab8d88edeb085a65');
        });

        it('M2 = H(A | M1 | S)', function () {
            var M2 = srp.getM2String();
            M2.should.be.exactly('0b0a6ad3024e79b5cad04042abb3a3f592d20c17');
        });

        it('K = SHA512(S)', function () {
            var K = srp.getK().toString(16);
            K.should.be.exactly('eb86bd35f055213d911e74ba485d516d2c7d648eca4fd7c4fd474cf9fff1d3a8b0efcb6bc0f2b07530bd02d6ea12f85f550b136958f783e4b84d47f727ae4b23');
        });
    });

    describe('String padding', function () {
        it('should not fail on low salt values', function () {
            var srp = new Srp('salt0', 'password123'),
                x = null;

            srp.should.be.type('object');
            srp.sets('0a765e718b3885a0648e093b798e6d37');

            x = srp.getx().toString(16);
            x.should.be.exactly('7b549517a6796961e6fa7b5817b11baf3ed27f10');
        });

        it('should not fail on low A values', function () {
            var srp = new Srp('alice', 'password123'),
                u = null;

            srp.should.be.type('object');
            srp.a = Bn.create('20a39edf45b1e71d0ad458e9f4ca8aa63a94f90f7c2719c7bc979d7b419f4ae1c28bec1d7ec48c181c9716691322290b', 16);
            srp.B = Bn.create('d7ef5330d1c87e72925de171e376d304f6ff2ff1520280ffb22cbcc373707233c676c87a53ae302f33b611616ff055cd0257e8179bdd6327283f9a269341d05492579acb0f505d9fb8bf5478dc229bc1b134b107c3b3e1717667ebfb6245017714d1cdb713e9d1d1491d7c11e53c8d3c3f9bfd53a80bf3c882ba8037eb5e2be0', 16);

            u = srp.getu().toString(16);
            u.should.be.exactly('583ab26a5a8722dd8ecb8d9aed5a83073cd381db');
        });

        it('should not fail on low B values', function () {
            var srp = new Srp('alice', 'password123'),
                u = null;

            srp.should.be.type('object');
            srp.a = Bn.create('db62e1bc728b4e8117a24fa6a3e3cdea27445be6588c52623deec77e04bb99574bf3a59dd568708c1b5340578d12d54e', 16);
            srp.B = Bn.create('08919ef90628ac5f5426d5456a0deb522681254430778b0476ea8beade68ff6ca2ffab461d9a07d2f8007a04d744c0a04b55dcfbb460095e24fe4a2846ceafe0f2141e42fad7abef17fee59ba3bdd80be8b5e79932caf5f614ef5dfdc7fabdb25b4c08da266d79532b11d5edad1f59326e1ba54d7fd952b5e243478f2f8bc714', 16);

            u = srp.getu().toString(16);
            u.should.be.exactly('a2f3dff413976f7098a1cbbe829322c99a9728f3');
        });

        it('should not fail on low M1 values', function () {
            var srp = new Srp('alice', 'password123'),
                M1 = null,
                M2 = null;

            srp.should.be.type('object');
            srp.a = Bn.create('d19a615d7479241ec699c86cd368a34e6b48cb3113fe168404799c16f52a461b32acd2b696ef778c03d9bfdc82838025', 16);
            srp.B = Bn.create('abf58446bb090f8917bec9aa603763de7fa86412bb05e993edb910479f33d1daae27e1d23b6411e511708838598a1754137d34e812499a19c569ed6aa45f95af370f186a3495cdbd54363ce40fd893db3f314c5738d6571779d4e11ac76753b150900e208ba6e7c3c99646904e64f519e6814961a079ac9e4f0b6c087efcb9c4', 16);
            srp.s = Bn.create('beb25379d1a8581eb5a727673a2441ee', 16);

            M1 = srp.getM1String();
            M1.should.be.exactly('07117a124f64eb7e17cc0fd7a570c9eb0cada675');
            M2 = srp.getM2String();
            M2.should.be.exactly('bda9a2d428e21469fe778d191f7cb89cfd37659b');
        });

        it('should not fail on low M2 values', function () {
            var srp = new Srp('alice', 'password123'),
                M1 = null,
                M2 = null;

            srp.should.be.type('object');
            srp.a = Bn.create('fb7c4d835cfed86a65c0453065e9e48a492854828fef56dd74a265e123825c1fc807c3cab09e4b40934695449d4e6fd5', 16);
            srp.B = Bn.create('54e741de2d72c2ad58eabf049ddeac94882453e631a8f319857c883144082981f30d7209f1430d3c63961a52917d61c4b052389943788a19d1fce5fcab6d9b5d154095093a45c2f4da31fa945f2c01d2360334f7e8784bf238c428ec6bc71e7b1f88ef8aef4b4c87281565fbcf3e07a0fff272659e4b3de66548fd8f6cc974d0', 16);
            srp.s = Bn.create('beb25379d1a8581eb5a727673a2441ee', 16);

            M1 = srp.getM1String();
            M1.should.be.exactly('2b4809e049666602e5cd2c8ebec00c339ed8faa0');
            M2 = srp.getM2String();
            M2.should.be.exactly('031dec476c27261757af273f663229cf3089910b');
        });

        it('should not fail on low S values', function () {
            var srp = new Srp('alice', 'password123'),
                K = null;

            srp.should.be.type('object');
            srp.a = Bn.create('8feb18b5e48071e659bcb12719ee29a4c8c6a8c327eca5371bbc23de5c745422b873f4859962da9f94b5ad460323acc8', 16);
            srp.B = Bn.create('51f76155db529562760031cdecc221b755a5fddbb148b3e7f8219e6ee0d5107a502b9a71f3111b2f11ee2db969445c232a723d98340e9d810d0053b32a57ad6043035428f0887e765269ba7ed62d28d819037b43845e33ad04057dff38190ec591023857d269e31af56ac6ffe23f5c59e00a622c5948883b56339068c601e1b6', 16);
            srp.s = Bn.create('beb25379d1a8581eb5a727673a2441ee', 16);

            K = srp.getK().toString(16);
            K.should.be.exactly('c94d951673e3bfd4202ff2087a867438a28a7e3888de4b95d588569807e39a9be18101c741e2c0830cc088f35a2cc997d645ccbdd7602799fd0f78c5e6ca7fe6');
        });
    });
});
