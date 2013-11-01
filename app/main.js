/*jslint browser: true */
/*global define */

define(['jquery', 'session'], function (jQuery, Session) {
    'use strict';

    var session = Session.create(),

        dump_status = function () {
            var tipi_session = localStorage.getItem('tipi_session');

            if (!tipi_session) {
                jQuery('#box_status').html('Pas de session');
            } else {
                tipi_session = JSON.parse(tipi_session);

                jQuery('#box_status').html(
                    'username: ' + (tipi_session.username || '') + "\n" +
                    'key: ' + (tipi_session.key || '') + "\n" +
                    'sess_id: ' + (tipi_session.sess_id || '') + "\n" +
                    'heartbeat: ' + (tipi_session.heartbeat || '') + "\n" +
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
            session.login(
                jQuery('input[name="input_username"]').val(),
                jQuery('input[name="input_password"]').val()
            ).done(function () {
                console.log('Sucess');
                session.ping();
            }).fail(function () {
                jQuery('input[name="input_password"]').val('');
                console.log('Error');
            });
        });

        jQuery('#btn_logout').click(function () {
            session.destroy();
        });

    });
});