/*jslint browser: true */
/*global define */

define(['vendors/cryptojs'], function (CryptoJS) {
    'use strict';

    var /**
         *  Taille, en bit, du passe à générer.
         *
         *  @type {Number}
         */
        key_size = 96,

        /**
         *  Base du dernier hash généré.
         *
         *  @type {Number}
         */
        last_time = null,

        /**
         *  Dernier code retourné.
         *
         *  @type {String}
         */
        last_hash = null,

        /**
         *  Objet Otp
         *
         *  @type {Object}
         */
        Otp = {};

    Otp.prototype = {
        /**
         *  Création du code et encodage en base64
         *
         *  @param {Boolean} raw Retourner le buffer sans conversion en base64
         *  @returns {String | WordArray}   Code en base64
         */
        getCode: function (raw) {
            var time = Math.floor((new Date()) / 30000),   //  Unix timestamp / 30
                hash = null;

            if (last_time !== time) {
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

                last_time = time;
                last_hash = hash;
            } else {
                hash = last_hash;
            }

            return raw ? hash : hash.toString(CryptoJS.enc.Base64);
        }
    };

    /**
     *  Création d'un générateur OTP
     *
     *  @param   {String | CryptoJS.lib.WordArray} secret Clef privée, String en hex ou instance de CryptoJS.lib.WordArray
     *
     *  @returns {Object}        Générateur OTP
     */
    Otp.create = function (secret) {
        var that = null;

        if (typeof secret === 'string') {
            secret = CryptoJS.enc.Hex.parse(secret);
        }

        that = Object.create(Otp.prototype, {
            secret: {
                value: secret,
                enumerable: false
            }
        });

        return that;
    };

    return Otp;
});
