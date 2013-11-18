/*jslint browser: true */
/*global define */

define(['jquery', 'session'], function (jQuery, Session) {
    'use strict';

    var session = Session.create(),

        dump_status = function () {
            var tipi_session = localStorage.getItem('tipi_session'),
                session_valid = session.isValid();

            //  Active les boutons en fonction de l'état de la session.
            jQuery('input[name="input_username"]').prop('disabled', session_valid);
            jQuery('input[name="input_password"]').prop('disabled', session_valid);
            jQuery('#btn_login').prop('disabled', session_valid);
            jQuery('#btn_logout').prop('disabled', !session_valid);

            if (!tipi_session) {
                jQuery('#box_status').html('Pas de session');
            } else {
                tipi_session = JSON.parse(tipi_session);

                jQuery('#box_status').html(
                    'username: ' + (tipi_session.username || '') + "\n" +
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
        window.setInterval(dump_status, 5000);

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
        jQuery('#btn_logout').click(function () {
            session.logout();
            dump_status();
        });

    });
});