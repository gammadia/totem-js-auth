/*jslint browser: true */
/*global define */

define(['srp', 'jquery', 'otp', 'cryptojs.sha256', 'cryptojs.enc-base64'], function (srp, jQuery, Otp, CryptoJS) {
    'use strict';

    var /**
         *  Nombre maximal de tentatives avant d'abandoner.
         *  Utilisé pour le fix temporaire des erreures de la lib srp.
         *
         *  @type {Number}
         */
        max_retries = 3,

        /**
         *  Nom du scheme d'authentification HTTP à utiliser
         *
         *  @type {String}
         */
        auth_scheme = 'TIPI-TOKEN',

        /**
         *  Nom du stockage dans le localstorage pour les données de sessions
         *
         *  @type {String}
         */
        store_key = 'tipi_session',

        /**
         *  Objet d'interval de ping
         *
         *  @type {Object}
         */
        ping_interval = null,

        /**
         *  Temp entre les pings de session
         *
         *  @type {Number}
         */
        ping_interval_time = 60 * 1000, //  60 sec

        /**
         *  Instance de session. (Singleton)
         *
         *  @type {Object}
         */
        instance = null,

        /**
         *  Version de l'API à utiliser sur le serveur
         *  ~2 = 2.*.*
         *
         *  @type {String}
         */
        api_version = '~2',

        /**
         *  Objet de gestion de la session utilisateur. Singleton.
         *
         *  @type {Object}
         */
        session = {},

        /**
         *  Objet de configuration du module d'authentification Tipi.
         *
         *  @type {Object}
         */
        config = {};

    session.prototype = {
        /**
         *  Créer une requête de session.
         *
         *  @returns {jQuery.Deferred} Objet de promesse jQuery
         */
        make_request: function (add_clear) {
            var that = this;

            this.promise = this.promise || jQuery.Deferred();

            jQuery.ajax(
                config.tipi_url + 'session/login',
                {
                    type: 'POST',
                    data: this.getRequest(add_clear),
                    headers: {
                        'Accept-Version': api_version
                    }
                }
            ).done(
                this.getResponseHandler()
            ).fail(function (xhr) {
                var result = null;

                if (xhr.status === 422) {
                    result = JSON.parse(xhr.responseText);

                    if (result.error === 'partial_user' && result.clear === true) {
                        return that.make_request(true);
                    }
                } else if (xhr.status === 0 && xhr.statusText === 'error') {
                    that.promise.reject('no_con');
                } else if (xhr.status === 404) {
                    that.promise.reject('password');
                }

                that.promise.reject('unknown');
            });

            return this.promise.promise();
        },

        /**
         *  Créer une objet de données pour la requête d'authentification.
         *
         *  @returns {object} Objet à poster lors de la requête.
         */
        getRequest: function (add_clear) {
            var request = {};

            this.srp = srp.create(this.username, this.password);

            request = {
                username:   this.username,
                namespace:  this.namespace,
                A:          this.srp.getA().toString(16)
            };

            if (add_clear) {
                request.clear = this.password;
            }

            return request;
        },

        /**
         *  Créer un handler pour le retour de la requête d'authentification.
         *
         *  @return {function} Fonction de gestion de la réponse.
         */
        getResponseHandler: function () {
            var that = this,
                fn = function (data) {
                    if (typeof data !== 'object') {
                        data = jQuery.parseJSON(data);
                    }

                    if (data.B !== undefined && data.s !== undefined) {
                        this.srp.setB(data.B);
                        this.srp.sets(data.s);
                        this.validateKey();
                    } else {
                        this.promise.reject();
                        this.promise = null;
                    }
                };

            return function (data) {
                fn.apply(that, [data]);
            };
        },

        /**
         *  Valide la clef retournée par le serveur.
         */
        validateKey: function () {
            var that = this;

            jQuery.post(
                config.tipi_url + 'session/login',
                {
                    M1: this.srp.getM1().toString(16)
                }
            ).done(function (data) {
                if (typeof data !== 'object') {
                    data = jQuery.parseJSON(data);
                }

                if (data.M2 && data.M2 === that.srp.getM2().toString(16)) {
                    that.session_success(data.sess_id);
                } else {
                    that.retry();
                }
            }).fail(function (jqXHR) {
                if (jqXHR.status === 400) {
                    that.retry();
                }

                if (jqXHR.status === 404) {
                    that.promise.reject();
                }
            });
        },

        /**
         *  La session a été établie avec success.
         *
         *  @param {String} id Id de session attribué par le serveur.
         */
        session_success: function (id) {
            //  Récupère la clef et nettoye l'objet srp.
            this.key = this.srp.getK().toString(16);
            this.sess_id = id;
            delete this.srp;

            this.touch();
            this.persist();
            this.startPing();

            this.promise.resolve();
            this.promise = null;
        },

        /**
         *  Écris la session dans le localStorage pour utilisation ultérieur.
         */
        persist: function () {
            localStorage.setItem(
                store_key,
                JSON.stringify({
                    user:   this.user,
                    key:        this.key,
                    sess_id:    this.sess_id,
                    heartbeat:  this.heartbeat
                })
            );
        },

        /**
         *  Création du générateur Otp
         *
         *  @returns {Otp}
         */
        getOtpGenerator: function () {
            if (!this.generator) {
                this.generator = Otp.create(this.key);
            }

            return this.generator || null;
        },

        /**
         *  Génère un jetton d'authentification.
         *
         *  @returns {String} Jetton d'identification pour l'api.
         */
        getToken: function () {
            var token = null;

            //  Pas de bras, pas de chocolat.
            if (this.isValid() && this.getOtpGenerator()) {
                token = auth_scheme + ' sessid="';

                token += CryptoJS.enc.Base64.stringify(
                    CryptoJS.enc.Hex.parse(this.sess_id)
                );

                token += '", sign="';

                token += CryptoJS.enc.Base64.stringify(
                    CryptoJS.HmacSHA256(
                        this.sess_id,
                        this.getOtpGenerator().getCode()
                    )
                );

                token += '"';
            }

            return token;
        },

        /**
         *  Es-ce que la session est valide?
         *
         *  @returns {Boolean} Vrais ou faux.
         */
        isValid: function () {
            var valid = (this.heartbeat + config.timeout) > Math.floor((new Date()) / 1000);

            if (!valid) {
                this.destroy();
            }

            return valid;
        },

        /**
         *  Mise à jour du heartbeat de la session locale
         */
        touch: function () {
            this.heartbeat = Math.floor((new Date()) / 1000);
        },

        /**
         *  Démarre les pings de sessions sur le serveur
         *
         *  @see ping
         */
        startPing: function (immediate) {
            var that = this;

            if (immediate) {
                that.ping();
            }

            if (ping_interval) {
                window.clearInterval(ping_interval);
            }

            ping_interval = window.setInterval(function () {
                that.ping();
            }, ping_interval_time);
        },

        /**
         *  Ajout les informations d'identification à un objet de config jQuery.ajax.
         *
         *  jQuery.ajay(url, session.authentify({
         *      type: 'POST',
         *      data: {
         *          key: 'value'
         *      }
         *  }));
         *
         *  @param   {Object} options Options de la requête ajax
         *
         *  @returns {Object}         Options avec les informations d'identification
         */
        authentify: function (options) {
            options = options || {};
            options.headers = options.headers || {};

            options.headers.Authorization = this.getToken();
            options.headers['Accept-Version'] = api_version;

            return options;
        },

        /**
         *  "Ping" la session sur le serveur.
         *  Vérifie si elle est toujours valide et met à jour le timeout.
         *
         *  @returns {[type]} [description]
         */
        ping: function () {
            var that = this;

            jQuery.ajax(
                config.tipi_url + 'session/ping',
                this.authentify({
                    type: 'POST',
                    data: {
                        timestamp: new Date()
                    }
                })
            ).done(function (data) {
                if (typeof data !== 'object') {
                    data = jQuery.parseJSON(data);
                }

                if (data.success) {
                    that.touch();
                    that.persist();
                } else {
                    that.destroy();
                }
            }).fail(function () {
                that.destroy();
            });
        },

        /**
         *  Déconnexion d'une session
         *
         *  @returns {[type]} [description]
         */
        logout: function () {
            jQuery.ajax(
                config.tipi_url + 'session/logout',
                this.authentify({
                    type: 'POST'
                })
            );

            this.destroy();
        },

        /**
         *  Détruit la session en cours.
         */
        destroy: function () {
            if (ping_interval) {
                window.clearInterval(ping_interval);
            }

            this.user = null;
            this.key = null;
            this.sess_id = null;
            this.heartbeat = null;
            this.generator = null;

            this.persist();
        },

        /**
         *  Relance la requête en cas d'échec. Il arrive que srp se broutte.
         *
         *  @todo Dû à un bug dans BigInt qui foire des soustractions.
         */
        retry: function () {
            var that = this;

            that.tries += 1;

            if (that.tries >= max_retries) {
                that.tries = 0;
                that.promise.reject('password');
            } else {
                that.make_request();
            }
        },

        /**
         *  Initialise la session.
         *  Vérifie si un cookie existe déjà.
         */
        init: function () {
            var sess = JSON.parse(localStorage.getItem(store_key));

            if (sess) {
                this.user   = sess.user || null;
                this.key        = sess.key || null;
                this.sess_id    = sess.sess_id || null;
                this.heartbeat  = sess.heartbeat || null;

                if (this.isValid()) {
                    this.startPing(true);
                }
            }
        },

        /**
         *  Login d'un utilisateur pour créer une nouvelle session
         *
         *  @param   {String} username
         *  @param   {String} password
         *  @param   {String} @namespace Nom du namespace de l'application dans Tipi
         *
         *  @returns {jQuery.Deferred}          Promesse
         */
        login: function (username, password, namespace) {
            this.username = username || '';
            this.password = password || '';
            this.namespace = namespace || config.namespace;

            //  Simplification du user, évite les fautes de frappes, majuscules, espaces, ponctuation, etc.
            this.username = this.username.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '');

            this.promise = null;
            this.destroy();

            return this.make_request();
        },

        /**
         *  Lecture des données de l'utilisateur
         *
         *  @param {String} namespace Nom du namespace voulu
         *  @returns {Object} Données du namespace
         */
        getUserData: function (namespace) {
            var promise = jQuery.Deferred();

            if (!namespace) {
                promise.reject(new Error('No namespace'));
            }

            jQuery.ajax(
                config.tipi_url + 'users/data/' + namespace,
                this.authentify()
            ).done(function (data) {
                if (typeof data !== 'object') {
                    data = jQuery.parseJSON(data);
                }

                promise.resolve(data);
            }).fail(function () {
                promise.reject(new Error('Unable to get data'));
            });

            return promise.promise();
        }
    };

    /**
     *  Création d'un nouvel objet de session pour le client.
     *
     *  @constructor
     */
    function create_session() {
        instance = Object.create(session.prototype, {
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
            tries: {
                value: 0,
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

        instance.init();

        return instance;
    }

    /**
     *  Défini la configuration du module d'authentification Tipi.
     *
     *  tipi_url:  URL de l'api Tipi.
     *  timeout:   Timeout en secondes avant déconnection.
     *  namespace: Namespace à utiliser pour la connection.
     *
     *  @param {Object} configuration
     */
    session.setConfig = function (configuration) {
        config = configuration;
    };

    /**
     *  Retourne l'instance de session.
     *
     *  @returns {Object} La session
     */
    session.getInstance = function () {
        if (instance === null) {
            instance = create_session();
        }

        return instance;
    };

    return session;
});
