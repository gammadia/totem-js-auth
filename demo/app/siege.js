/*jslint browser: true */
/*global define, console */

define(['session', 'async'], function (Session, async) {
    'use strict';

    var session_count = 0;

    Session.setConfig({
        tipi_url:   'http://127.0.0.1:9999/',
        timeout:    1800,   //  30 minutes
        namespace:  'unittest'
    });

    function create_session() {
        var sess = Object.create(Session.prototype, {
            user: {
                value: null,
                enumerable: false,
                writable: true
            },
            password: {
                value: null,
                enumerable: false,
                writable: true
            },
            sess_id: {
                value: null,
                enumerable: false,
                writable: true
            },
            generator: {
                value: null,
                enumerable: false,
                writable: true
            }
        });

        sess.persist = function () { return; };

        return sess;
    }

    return function (limit) {
        async.timesSeries(limit, function (n, next) {
            console.log('Session: ' + n + ' / ' + limit + ' (' + session_count + ')');

            var sess = create_session();

            sess.login('alice', 'password123')
                .done(function () {
                    next(null, sess);
                    session_count ++;
                }).fail(function (err) {
                    next(err);
                });
        }, function (err, sessions) {
            if (err) {
                return console.error(err);
            }

            console.log('Done: ' + sessions.length);
            console.log('Total: ' + session_count);
        });
    };
});