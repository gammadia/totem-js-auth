/*jslint node: true */
/*global describe, it, before */

'use strict';

describe('Srp', function () {
    var Srp = null;

    before(function (done) {
        require(['srp'], function (srp) {
            Srp = srp;
            return done();
        });
    });

    describe('new Srp()', function () {
        it('should create an Srp object', function (done) {
            var srp = new Srp();
            srp.should.be.type('object');
            return done();
        });
    });
});
