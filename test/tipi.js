/*jslint browser: true */
/*global describe, it, before, require */

describe('Tipi', function () {
    'use strict';

    var jQuery = null,
        Srp = null,
        config = {
            'tipi_url': 'http://127.0.0.1:9999/',
            namespace: 'unittest'
        };

    before(function (done) {
        require(['srp', 'jquery'], function (srp, jq) {
            Srp = srp;
            jQuery = jq;
            return done();
        });
    });

    describe('Tipi 2 Session', function () {
        var srp = null;

        it('should create an Srp object', function () {
            srp = new Srp('salt0', 'password123');
            srp.getA().should.be.type('object');
        });

        it('should request B and s', function (done) {
            jQuery.ajax(
                config.tipi_url + 'session/login',
                {
                    type: 'POST',
                    data: {
                        username:   srp.username,
                        namespace:  config.namespace,
                        A:          srp.getA().toString(16)
                    },
                    headers: {
                        'Accept-Version': '2'
                    }
                }
            ).done(function (data) {
                data.should.be.type('object');
                data.B.should.be.ok;
                data.s.should.be.ok;

                srp.setB(data.B);
                srp.sets(data.s);
                done();
            }).fail(function (xhr) {
                if (xhr.status === 0 && xhr.statusText === 'error') {
                    return done(new Error('No connection'));
                }

                if (xhr.status === 404) {
                    return done(new Error('User not found'));
                }

                return done(new Error('Unknown'));
            });
        });

        it('should confirm exchange with M1 and M2', function (done) {
            jQuery.post(
                config.tipi_url + 'session/login',
                { M1: srp.getM1().toString(16) }
            ).done(function (data) {
                data.should.be.type('object');
                data.M2.should.be.ok;
                data.M2.should.be.exactly(srp.getM2().toString(16));
                done();
            }).fail(function (jqXHR) {
                jqXHR.status.should.not.be.exactly(400);
                jqXHR.status.should.not.be.exactly(404);
                done();
            });
        });
    });
});
