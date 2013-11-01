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
            var hash = CryptoJS.HmacSHA512(
                    String(Math.floor((new Date()) / 30000)),   //  Unix timestamp / 30
                    this.secret
                );

            //  Retrait des bits non significatifs
            hash.clamp();

            //  Garde seulement les [key_size] bits les moins significatifs
            hash = CryptoJS.lib.WordArray.create(
                hash.words.slice(hash.words.length - (key_size / 32))
            );

            if (!raw) {
                hash = hash.toString(CryptoJS.enc.Base64);
            }

            return hash;
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
