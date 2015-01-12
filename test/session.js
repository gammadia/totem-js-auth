/*jslint node: true */
/*global describe, it, before */

'use strict';

describe('Session', function () {
    var Session = null;

    before(function (done) {
        require(['session'], function (session) {
            Session = session;
            return done();
        });
    });

    describe('Session.getInstance()', function () {
        it('should create a new session', function (done) {
            var session = Session.getInstance();
            session.should.be.type('object');
            return done();
        });
    });
});
