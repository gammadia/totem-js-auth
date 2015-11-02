/*jslint browser: true */
/*global define, require, console */

define(['jquery', 'session', 'async'], function (jQuery, Session, async) {
    'use strict';

    var session = Session.getInstance(),
        siege_running = false,

        config_session = function () {
            if (!jQuery('#tipi_url').val() || !jQuery('#tipi_namespace').val() || !jQuery('#tipi_timeout').val()) {
                window.alert("Veuillez configurer votre instance Tipi");
                return false;
            }
            Session.setConfig({
                tipi_url:   jQuery('#tipi_url').val(),
                timeout:    jQuery('#tipi_timeout').val(),
                namespace:  jQuery('#tipi_namespace').val()
            });
            return true;
        },

        dump_status = function () {
            var tipi_session = localStorage.getItem('tipi_session'),
                session_valid = session.isValid();

            //  Active les boutons en fonction de l'état de la session.
            jQuery('input[name="input_username"]').prop('disabled', session_valid);
            jQuery('input[name="input_password"]').prop('disabled', session_valid);
            jQuery('#btn_login').prop('disabled', session_valid);
            jQuery('#btn_logout').prop('disabled', !session_valid);
            jQuery('#btn_data').prop('disabled', !session_valid);
            jQuery('#btn_data_remote').prop('disabled', !session_valid);

            if (!siege_running) {
                if (!tipi_session) {
                    jQuery('#box_status').html('Pas de session');
                } else {
                    if (session_valid) {
                        tipi_session = JSON.parse(tipi_session);
                        jQuery('#box_status').html(
                            'user: ' + (tipi_session.user || '') + "\n" +
                                'key: ' + (tipi_session.key || '') + "\n" +
                                'sess_id: ' + (tipi_session.sess_id || '') + "\n" +
                                'heartbeat: ' + (new Date(tipi_session.heartbeat * 1000) || '') + "\n" +
                                'valid: ' + (session.isValid() ? 'true' : 'false')
                        );
                    } else {
                        jQuery('#box_status').html('Session non valide');
                    }
                }
            }
        },

        create_session = function () {
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
        },

        siege = function (limit) {
            siege_running = true;
            var valid_session_count = 0;
            async.timesSeries(limit, function (n, next) {
                jQuery('#box_status').append('Create session #' + n + '/' + limit + '... ');

                var sess = create_session();
                sess.login(
                    jQuery('input[name="input_username"]').val(),
                    jQuery('input[name="input_password"]').val()
                )
                    .done(function () {
                        jQuery('#box_status').append(' Done.\n');
                        if (sess.isValid()) {
                            valid_session_count += 1;
                        } else {
                            jQuery('#box_status').append('/!\\INVALID SESSION/!\\ \n');
                        }
                        next(null, sess);
                    }).fail(function (err) {
                        jQuery('#box_status').append(' Failed!\n');
                        next(err);
                    });
            }, function (err, sessions) {
                if (err) {
                    return jQuery('#box_status').append('ERROR: \n ' + err);
                }
                jQuery('#box_status').append('Done (valid): ' + valid_session_count + '\n');
                jQuery('#box_status').append('Total: ' + sessions.length + ' \n');

                var valid_sessions = 0;
                async.eachSeries(sessions, function (sess, next) {
                    if (sess.isValid()) {
                        valid_sessions += 1;
                        jQuery('#box_status').append('Logging out session #' + valid_sessions + ' \n');
                        sess.logout();
                        next(null, sess);
                    }
                }, function (err, sessions) {
                    if (err) {
                        return jQuery('#box_status').append('ERROR: \n ' + err);
                    }
                    jQuery('#box_status').append('Still valid sessions: ' + valid_sessions + '\n');
                    jQuery('#box_status').append('Total: ' + sessions.length + ' \n');
                });
            });
        };

    jQuery(document).ready(function () {
        //  Juste pour faire joli :)
        dump_status();
        window.setInterval(dump_status, 1000);

        /**
         * Login
         */
        jQuery('#btn_login').click(function () {
            siege_running = false;
            if (config_session()) {
                session.login(
                    jQuery('input[name="input_username"]').val(),
                    jQuery('input[name="input_password"]').val()
                ).done(function () {
                    dump_status();
                }).fail(function () {
                    dump_status();
                });
            }
        });

        /**
         *  Logout
         */
        jQuery('#btn_logout').click(function () {
            session.logout();
            siege_running = false;
            dump_status();
        });

        /**
         *  Lecture des données de l'utilisateur dans Tipi
         */
        jQuery('#btn_data').click(function () {
            siege_running = false;
            /**
             *  Namespace donné pour la lecture des données, obligatoire
             *  Seulement la partie 'user_data' du namespace arrive à l'utilisateur.
             *  Le reste n'est accessible que depuis les applications serveur. (Forum, Tisserin, etc.)
             */
            session.getUserData(
                jQuery('#tipi_namespace').val()
            ).done(function (data) {
                console.dir(data);
            }).fail(function (err) {
                console.log('Erreur: ' + err);
            });
        });

        /**
         *  Lecture des données de l'utilisateur en passant par l'application PHP.
         */
        jQuery('#btn_data_remote').click(function () {
            //  Remplacer l'url par celui du script PHP de démo.
            jQuery.ajax(
                'http://127.0.0.1/www/tipi-auth/demo.php',
                session.authentify({
                    type: 'POST',
                    data: {
                        namespace: jQuery('input[name="input_namespace"]').val()
                    }
                })
            ).done(function (data) {
                console.dir(data);
            }).fail(function (err) {
                console.log('Erreur: ' + err);
            });
        });

        jQuery('#btn_siege').click(function () {
            if (config_session()) {
                siege(jQuery('input[name="input_siege"]').val());
            }
        });
    });
});
