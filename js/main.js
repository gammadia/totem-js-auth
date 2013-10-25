/*jslint browser: true */
/*global require */

require.config({
    baseUrl: 'js',

    config: {
        session: {
            auth_url:   'http://127.0.0.1:9999/users/login'
        }
    },

    paths: {
        app:        '../app',
        vendors:    '../vendors',
        jquery:     '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min'
    }
});

require(['app/main']);
