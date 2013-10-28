/*jslint browser: true */
/*global require */

require.config({
    baseUrl: 'js',

    config: {
        session: {
            tipi_url:   'http://127.0.0.1:9999/users/login',
            store_key:  'tipi_session',
            timeout:    1800    //  30 minutes
        }
    },

    paths: {
        app:        '../app',
        vendors:    '../vendors',
        jquery:     '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min'
    }
});

require(['app/main']);
