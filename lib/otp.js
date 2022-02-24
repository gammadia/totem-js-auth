/*jslint browser: true */
/*global define */

define(['crypto-js'], function (CryptoJS) {
    'use strict';

    var /**
         *  Taille, en bit, du passe à générer.
         *
         *  @type {Number}
         */
        key_size = 96,

        /**
         *  Intérval de synchronisation du temps avec le serveur. En ms.
         *
         *  @type {Number}
         */
        time_sync_interval = 30 * 60 * 1000, // 30 min

        /**
         *  Objet Otp
         *
         *  @type {Object}
         */
        Otp = {};

    Otp.prototype = {
        /**
         *  Synchronisation avec le serveur pour la génération des tokens.
         *
         *  @param   {String}   time_url URL de la resource time sur le serveur
         *  @param   {Function} callback
         */
        syncTimeWithServer: function (time_url, callback) {
            var request = new XMLHttpRequest(),
                start = null,
                that = this;

            request.open('POST', time_url, true);

            request.onload = function () {
                if (this.status >= 200 && this.status < 400) {
                    var end = Date.now(),
                        response = JSON.parse(this.response),
                        request_duration = end - start,
                        remote_expected = (request_duration / 2) + start,
                        delta = Math.round(response.time - remote_expected);

                    that.delta = delta;

                    if (callback) {
                        callback();
                    }
                }
            };

            request.send();
            start = Date.now();

            if (!this.sync_interval) {
                this.sync_interval = window.setInterval(function () {
                    that.syncTimeWithServer(time_url);
                }, time_sync_interval);
            }
        },

        getTime: function () {
            return (Date.now() + this.delta);
        },

        /**
         *  Création du code et encodage en base64
         *
         *  @param {Boolean} raw Retourner le buffer sans conversion en base64
         *  @param {Number}  time Forcer la valeur du temps pour le code à générer
         *  @returns {String | WordArray}   Code en base64
         */
        makeCode: function (raw, time) {
            var hash = null;

            time = time || Math.floor(this.getTime() / 30000);   //  Unix timestamp / 30

            if (this.last_time !== time) {
                hash = CryptoJS.HmacSHA512(
                    String(time),
                    this.secret
                );

                //  Retrait des bits non significatifs
                hash.clamp();

                //  Garde seulement les [key_size] bits les moins significatifs
                hash = CryptoJS.lib.WordArray.create(
                    hash.words.slice(hash.words.length - (key_size / 32))
                );

                this.last_time = time;
                this.last_hash = hash;
            } else {
                hash = this.last_hash;
            }

            return raw ? hash : hash.toString(CryptoJS.enc.Base64);
        },

        /**
         *  Création du code et encodage en base64
         *
         *  @param {Boolean} raw Retourner le buffer sans conversion en base64
         *  @param {Function} Callback
         *  @returns {String | WordArray}   Code en base64
         */
        getCode: function (raw, callback) {
            var that = this;

            if (this.delta === null) {
                this.syncTimeWithServer(this.time_url, function () {
                    callback(that.makeCode(raw));
                });
            } else {
                callback(this.makeCode(raw));
            }
        }
    };

    /**
     *  Création d'un générateur OTP
     *
     *  @param   {String | CryptoJS.lib.WordArray} secret Clef privée, String en hex ou instance de CryptoJS.lib.WordArray
     *  @param   {String} time_url URL du temps sur le serveur
     *
     *  @returns {Object}        Générateur OTP
     */
    Otp.create = function (secret, time_url) {
        var that = null;

        if (typeof secret === 'string') {
            secret = CryptoJS.enc.Hex.parse(secret);
        }

        that = Object.create(Otp.prototype, {
            /**
             *  Clef de base des codes Otp
             *
             *  @type string
             */
            secret: {
                value: secret,
                enumerable: false
            },

            /**
             *  Base du dernier hash généré.
             *
             *  @type {Number}
             */
            last_time: {
                value: null,
                enumerable: false,
                writable: true
            },

            /**
             *  Dernier code retourné.
             *
             *  @type {String}
             */
            last_hash: {
                value: null,
                enumerable: false,
                writable: true
            },

            /**
             *  Delta de temps entre le serveur et la machine locale.
             *
             *  @type {Integer}
             */
            delta: {
                value: null,
                enumerable: false,
                writable: true
            },

            /**
             *  URL de synchronisation du temps.
             *
             *  @type {String}
             */
            time_url: {
                value: time_url,
                enumerable: false,
                writable: true
            }
        });

        return that;
    };

    return Otp;
});
