/*jslint node: true */
/*global describe, it, before, localStorage */

'use strict';

describe('Session', function () {
    var Session = null;

    before(function (done) {
        require(['session'], function (session) {
            Session = session;
            return done();
        });
    });

    describe('With a valid user', function () {
        var session = null;

        before(function () {
            Session.setConfig({
                tipi_url:   'http://127.0.0.1:9999/',
                timeout:    1800,   //  30 minutes
                namespace:  'unittest'
            });

            localStorage.clear();
        });

        it('Session.getInstance() should create a new session instance', function () {
            session = Session.getInstance();
            session.should.be.type('object');
        });

        it('session.login() should start a new session', function (done) {
            session.login(
                'alice',
                'password123'
            ).done(function () {
                done();
            }).fail(function (error) {
                error.should.be.null;
                done();
            });
        });

        it('should store session information on localStorage', function () {
            var session_data = JSON.parse(localStorage.tipi_session);

            session_data.should.be.type('object');
            session_data.key.should.be.type('string');
            session_data.sess_id.should.be.type('string');
        });

        it('should resume session from localStorage', function () {
            var session_data = JSON.parse(localStorage.tipi_session);

            session = Session.getInstance(true);
            session.should.be.type('object');

            session.key.should.equal(session_data.key);
            session.sess_id.should.equal(session_data.sess_id);

            session.isValid().should.be.true;
        });

        it('session.logout() should destroy session on logout', function () {
            session.logout();

            var session_data = JSON.parse(localStorage.tipi_session);
            session_data.should.be.type('object');
            (session_data.key === null).should.be.true;
            (session_data.sess_id === null).should.be.true;
            (session_data.heartbeat === null).should.be.true;
        });
    });

    describe('Wrong password', function () {
        var session = null;

        before(function () {
            Session.setConfig({
                tipi_url:   'http://127.0.0.1:9999/',
                timeout:    1800,   //  30 minutes
                namespace:  'unittest'
            });

            localStorage.clear();
        });

        it('Session.getInstance() should create a new session instance', function () {
            session = Session.getInstance();
            session.should.be.type('object');
        });

        it('session.login() should fail with password ("password") error', function (done) {
            session.login(
                'alice',
                'wrong password'
            ).done(function () {
                (1 === 2).should.be.true;
                done();
            }).fail(function (error) {
                error.should.equal('password');
                done();
            });
        });

        it('should not store session on localStorage', function () {
            var session_data = JSON.parse(localStorage.tipi_session);
            session_data.should.be.type('object');
            (session_data.key === null).should.be.true;
            (session_data.sess_id === null).should.be.true;
            (session_data.heartbeat === null).should.be.true;
        });
    });

    describe('Offline server', function () {
        var session = null;

        before(function () {
            Session.setConfig({
                tipi_url:   'http://127.1.1.1:1234/',
                timeout:    1800,   //  30 minutes
                namespace:  'unittest'
            });

            localStorage.clear();
        });

        it('Session.getInstance() should create a new session instance', function () {
            session = Session.getInstance();
            session.should.be.type('object');
        });

        it('session.login() should fail with no connection ("no_con") error', function (done) {
            session.login(
                'alice',
                'password123'
            ).done(function () {
                (1 === 2).should.be.true;
                done();
            }).fail(function (error) {
                error.should.equal('no_con');
                done();
            });
        });

        it('should not store session on localStorage', function () {
            if (localStorage.tipi_session) {
                var session_data = JSON.parse(localStorage.tipi_session);
                session_data.should.be.type('object');
                (session_data.key === null).should.be.true;
                (session_data.sess_id === null).should.be.true;
                (session_data.heartbeat === null).should.be.true;
            } else {
                (localStorage.tipi_session === undefined).should.be.true;
            }
        });
    });

    describe('Authentification token', function () {
        var session = null;

        before(function () {
            Session.setConfig({
                tipi_url:   'http://127.0.0.1:9999/',
                timeout:    1800,   //  30 minutes
                namespace:  'unittest'
            });

            localStorage.clear();
        });

        it('Session.getInstance() should create a new session instance', function (done) {
            session = Session.getInstance();
            session.should.be.type('object');

            session.login(
                'alice',
                'password123'
            ).done(function () {
                done();
            }).fail(function (error) {
                (1 === 2).should.be.true;
                done();
            });
        });

        it('session.authentify() should add authentification token on request options', function (done) {
            session.authentify({}, function (result) {
                result.should.be.type('object');
                result.should.have.property('headers');
                result.headers.should.have.property('Accept-Version');
                result.headers['Accept-Version'].should.be.type('string');
                result.headers.should.have.property('Authorization');
                result.headers['Authorization'].should.be.type('string');
                done();
            });
        });

        it('session.authentifyUrl() should add token to url', function () {
            session.key = '252d474dc90cea84b7facd3954f610fe5057d369c18a8353b94532b6c34c8eace25604c3df1a9dec8d6e38a2275ce0a00258b06662bf84ef26636d4470cc30ff';
            var url = session.authentifyUrl('http://exemple.com/test.jpg');
            url.should.equal('http://exemple.com/test.jpg?token=vHpn/Xe7OSCUvZmrhji5G7Z1gjYMp1OnwFiqv07tnPQ=');
        });
    });

    describe('Ping', function () {
        var session = null;

        before(function () {
            Session.setConfig({
                tipi_url:   'http://127.0.0.1:9999/',
                timeout:    1800,   //  30 minutes
                namespace:  'unittest'
            });

            localStorage.clear();
        });

        it('Session.getInstance() should create a new session instance', function (done) {
            session = Session.getInstance();
            session.should.be.type('object');

            session.login(
                'alice',
                'password123'
            ).done(function () {
                done();
            }).fail(function (error) {
                (1 === 2).should.be.true;
                done();
            });
        });

        it('should ping server and update heartbeat', function (done) {
            var session_before = JSON.parse(localStorage.tipi_session);

            session_before.should.have.property('heartbeat');

            window.setTimeout(function () {
                session.ping(function () {
                    var session_after = JSON.parse(localStorage.tipi_session);

                    session_after.should.have.property('heartbeat');
                    session_after.heartbeat.should.be.greaterThan(session_before.heartbeat);

                    done();
                });
            }, 1200);
        });
    });

    describe('User data', function () {
        var session = null;

        before(function () {
            Session.setConfig({
                tipi_url:   'http://127.0.0.1:9999/',
                timeout:    1800,   //  30 minutes
                namespace:  'unittest'
            });

            localStorage.clear();
        });

        it('Session.getInstance() should create a new session instance', function (done) {
            session = Session.getInstance();
            session.should.be.type('object');

            session.login(
                'alice',
                'password123'
            ).done(function () {
                done();
            }).fail(function (error) {
                (1 === 2).should.be.true;
                done();
            });
        });

        it('session.getUserData() should read user data', function (done) {
            session.getUserData('unittest').done(function (data) {
                data.should.be.type('object');
                data.should.have.property('canary');
                data.canary.should.have.property('name', 'Roger');
                done();
            }).fail(function () {
                (1 === 2).should.be.true;
                done();
            });
        });

        it('session.getUserData() should fail with no namespace', function (done) {
            session.getUserData().done(function () {
                (1 === 2).should.be.true;
                done();
            }).fail(function (error) {
                error.should.be.instanceOf(Error);
                error.message.should.equal('No namespace');
                done();
            });
        });

        it('session.setUserData() should write user data', function (done) {
            var canary_value = Date.now();

            session.getUserData('unittest').done(function (data) {
                data.write_canary = canary_value;

                session.setUserData('unittest', data).done(function (data) {
                    data.data.should.be.type('object');
                    data.data.should.have.property('write_canary', canary_value);
                    done();
                }).fail(function () {
                    (1 === 2).should.be.true;
                    done();
                });
            }).fail(function () {
                (1 === 2).should.be.true;
                done();
            });
        });

        it('session.setUserData() should fail with no namespace', function (done) {
            session.setUserData().done(function () {
                (1 === 2).should.be.true;
                done();
            }).fail(function (error) {
                error.should.be.instanceOf(Error);
                error.message.should.equal('No namespace');
                done();
            });
        });
    });
});
