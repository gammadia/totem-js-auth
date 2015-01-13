/*jslint browser: true */
/*global define, console */

define(['jquery', 'session'], function (jQuery, Session) {
    'use strict';

    Session.setConfig({
        tipi_url:   'http://127.0.0.1:9999/',
        timeout:    1800,   //  30 minutes
        namespace:  'unittest'
    });

    var session = Session.getInstance(),

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

            if (!tipi_session) {
                jQuery('#box_status').html('Pas de session');
            } else {
                tipi_session = JSON.parse(tipi_session);

                jQuery('#box_status').html(
                    'user: ' + (tipi_session.user || '') + "\n" +
                    'key: ' + (tipi_session.key || '') + "\n" +
                    'sess_id: ' + (tipi_session.sess_id || '') + "\n" +
                    'heartbeat: ' + (new Date(tipi_session.heartbeat * 1000) || '') + "\n" +
                    'valid: ' + (session.isValid() ? 'true' : 'false')
                );
            }
        };

    jQuery(document).ready(function () {
        //  Juste pour faire joli :)
        dump_status();
        window.setInterval(dump_status, 1000);

        //  Action du login
        jQuery('#btn_login').click(function () {
            /**
             *  Demande de login.
             */
            session.login(
                jQuery('input[name="input_username"]').val(),
                jQuery('input[name="input_password"]').val()
            ).done(function () {
                /**
                 *  Gestion du login ok ici
                 */
                console.log('Sucess');
                dump_status();
            }).fail(function () {
                /**
                 *  Gestion d'erreur de login ou mauvais mot de passe ici.
                 *
                 *  Note: mot de passe incorrect et utilisateur non existant: 400 Bad Request.
                 */
                jQuery('input[name="input_password"]').val('');
                console.log('Error');
            });
        });

        /**
         *  Fermeture d'une session
         */
        jQuery('#btn_logout').click(function () {
            session.logout();
            dump_status();
        });

        /**
         *  Lecture des données de l'utilisateur dans Tipi
         */
        jQuery('#btn_data').click(function () {
            /**
             *  Namespace donné pour la lecture des données, obligatoire
             *  Seulement la partie 'user_data' du namespace arrive à l'utilisateur.
             *  Le reste n'est accessible que depuis les applications serveur. (Forum, Tisserin, etc.)
             */
            session.getUserData(
                jQuery('input[name="input_namespace"]').val()
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

    });
});
