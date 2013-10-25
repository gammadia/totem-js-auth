/*jslint browser: true */
/*global define */

define(['jquery', 'session'], function (jQuery, session) {
    'use strict';

    jQuery(document).ready(function () {
        jQuery('#btn_login').click(function () {
            var auth_request = session.create(
                jQuery('input[name="input_username"]').val().toLowerCase().replace(/[^a-zA-Z0-9]+/g, ''),
                jQuery('input[name="input_password"]').val()
            );

            auth_request.make_request().done(function () {
                console.log('Sucess');
            }).fail(function () {
                jQuery('input[name="input_password"]').val('');
                console.log('Error');
            });
        });
    });
});