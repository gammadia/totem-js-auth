/*jslint browser: true */
/*global define */

var Srp = require('./srp'),
    axios = require('axios'),
    Otp = require('./otp'),
    CryptoJS = require('crypto-js')
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
     *  @returns Promise
     */
    make_request: function (add_clear) {
        var that = this;

        that.promise = that.promise || Promise.defer();

        axios.post(
            config.tipi_url + 'session/login',
            that.getRequest(add_clear),
            {
                headers: {
                    'Accept-Version': api_version
                }
            }
        ).then(
            that.getResponseHandler()
        ).catch(function (error) {
            var result = null;

            if (error.response.status === 422) {
                result = error.response.data;

                if (result.error === 'partial_user' && result.clear === true) {
                    return that.make_request(true);
                }
            } else if (error.response.status === 0 && error.response.data === 'error') {
                that.promise.reject('no_con');
            } else if (error.response.status === 404) {
                that.promise.reject('password');
            } else if (error.response.status === 403) {
                result = errpr.response.data;

                if (result.error === 'partial_user_failure') {
                    that.promise.reject('password');
                }
            }

            that.promise.reject('unknown');
        });

        return this.promise.promise;
    },

    /**
     *  Créer une objet de données pour la requête d'authentification.
     *
     *  @returns {object} Objet à poster lors de la requête.
     */
    getRequest: function (add_clear) {
        var request = {};

        this.srp = new Srp(this.username, this.password);

        request = {
            username:   this.username,
            namespace:  this.namespace,
            A:          this.srp.getAString()
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

        axios.post(
            config.tipi_url + 'session/login',
            {
                M1: this.srp.getM1String()
            }
        ).then(function (data) {
            if (data.M2 && data.M2 === that.srp.getM2String()) {
                that.session_success(data.sess_id);
            } else {
                that.promise.reject('password');
            }
        }).catch(function (error) {
            if (error.response.status === 400) {
                that.promise.reject('password');
            }

            if (error.response.status === 404) {
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
        this.key = this.srp.getK();
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
            this.generator = Otp.create(this.key, config.tipi_url + 'time');
        }

        return this.generator || null;
    },

    /**
     *  Es-ce que la session est valide?
     *
     *  @returns {Boolean} Vrais ou faux.
     */
    isValid: function () {
        var valid = (this.heartbeat + config.timeout) > Math.floor((new Date()) / 1000);

        if (!valid || !this.sess_id) {
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

        if (this.ping_interval) {
            window.clearInterval(this.ping_interval);
        }

        this.ping_interval = window.setInterval(function () {
            that.ping();
        }, ping_interval_time);
    },

    /**
     *  Génère un jetton d'authentification.
     *
     *  @param {Function} callback
     *  @returns {String} Jetton d'identification pour l'api.
     */
    getToken: function (callback) {
        var that = this;

        //  Pas de bras, pas de chocolat.
        if (!this.isValid() || !this.getOtpGenerator()) {
            return callback(null);
        }

        this.getOtpGenerator().getCode(false, function (code) {
            if (!that.isValid()) {
                return callback(null);
            }

            var token = null;

            token = auth_scheme + ' sessid="';

            token += CryptoJS.enc.Base64.stringify(
                CryptoJS.enc.Hex.parse(that.sess_id)
            );

            token += '", sign="';

            token += CryptoJS.enc.Base64.stringify(
                CryptoJS.HmacSHA256(
                    that.sess_id,
                    code
                )
            );

            token += '"';

            return callback(token);
        });
    },

    /**
     *  Génération d'un jeton de requête sur un sujet. Valable pour cette session entière.
     *  Utilisé pour les fichiers statiques
     *
     *  @param   {String} subject Sujet de la requête. (url)
     *
     *  @returns {String}         Jetton
     */
    getStaticToken: function (subject) {
        var token = null;

        // Enlève la partie du querystring.
        subject = subject.match(/.+\/\?|.+\?|.+/)[0].replace(/\/\?|\?/, '');

        token = CryptoJS.enc.Base64.stringify(
            CryptoJS.HmacSHA256(
                window.encodeURI(subject),
                this.key
            )
        );

        return token;
    },

    /**
     *  Ajout les informations d'identification à un objet de config Axios.
     *
     *  axios(session.authentify({
     *      url: '...',
     *      method: 'POST',
     *      data: {
     *          key: 'value'
     *      }
     *  }));
     *
     *  @param   {Object} options Options de la requête ajax
     *  @param   {Function} callback
     *
     *  @returns {Object}         Options avec les informations d'identification
     */
    authentify: function (options, callback) {
        this.getToken(function (token) {
            if (!token) {
                return callback(null);
            }

            options = options || {};
            options.headers = options.headers || {};

            options.headers.Authorization = token;
            options.headers['Accept-Version'] = api_version;

            return callback(options);
        });
    },

    /**
     *  Ajout un jeton static sur une url
     *
     *  @param   {String} url
     *
     *  @returns {String}
     */
    authentifyUrl: function (url) {
        var params = 'sessid=' + CryptoJS.enc.Base64.stringify(
            CryptoJS.enc.Hex.parse(this.sess_id)
        ) + '&token=' + this.getStaticToken(url);

        url += (url.indexOf('?') !== -1 ? '&' : '?') + params;

        return url;
    },

    /**
     *  "Ping" la session sur le serveur.
     *  Vérifie si elle est toujours valide et met à jour le timeout.
     *
     *  @param {Function} callback
     *
     *  @returns {[type]} [description]
     */
    ping: function (callback) {
        var that = this;

        this.authentify(
            {
                url: config.tipi_url + 'session/ping',
                method: 'POST',
                data: {
                    timestamp: this.getOtpGenerator().getTime()
                }
            },
            function (options) {
                axios(options)
                    .then(function (data) {
                        if (data.success) {
                            that.touch();
                            that.persist();
                        } else {
                            that.destroy();
                        }

                        if (callback) {
                            return callback();
                        }
                    }).catch(function (error) {
                    if (error.response.status === 404) {
                        that.destroy();
                    }

                    if (callback) {
                        return callback(error);
                    }
                });
            }
        );
    },

    /**
     *  Déconnexion d'une session
     */
    logout: function () {
        this.authentify(
            {
                url: config.tipi_url + 'session/logout',
                method: 'POST'
            },
            function (options) {
                axios(
                    options
                );
            }
        );

        this.destroy();
    },

    /**
     *  Reset des valeurs de base de la session
     */
    reset: function () {
        this.user = null;
        this.key = null;
        this.sess_id = null;
        this.heartbeat = null;
        this.generator = null;
    },

    /**
     *  Détruit la session en cours.
     */
    destroy: function () {
        if (this.ping_interval) {
            window.clearInterval(this.ping_interval);
        }

        this.reset();

        if (config && config.logout_url) {
            axios.get(config.logout_url).then(function () {
                window.location.reload();
            });
        }

        this.persist();
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
     *  @returns {Promise}          Promesse
     */
    login: function (username, password, namespace) {
        this.username = username || '';
        this.password = password || '';
        this.namespace = namespace || config.namespace;

        //  Simplification du user, évite les fautes de frappes, majuscules, espaces, ponctuation, etc.
        this.username = this.username.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '');

        this.promise = null;
        this.reset();

        return this.make_request();
    },

    /**
     *  Lecture des données de l'utilisateur
     *
     *  @param {String} namespace Nom du namespace voulu
     *  @returns {Promise} Objet de promesse
     */
    getUserData: function (namespace) {
        var promise = Promise.defer();

        if (!namespace) {
            promise.reject(new Error('No namespace'));
            return promise.promise;
        }

        this.authentify({
            url: config.tipi_url + 'users/data/' + namespace,
            method: 'GET'
        }, function (options) {
            axios(options)
                .then(function (data) {
                    promise.resolve(data);
                }).catch(function () {
                promise.reject(new Error('Unable to get data'));
            });
        });

        return promise.promise;
    },

    /**
     *  Écriture des données utilisateur
     *
     *  @param {String} namespace Nom du namespace
     *  @param {Object} data      Données
     *  @returns {Promise} Objet de promesse
     */
    setUserData: function (namespace, data) {
        var promise = Promise.defer();

        if (!namespace) {
            promise.reject(new Error('No namespace'));
            return promise.promise;
        }

        this.authentify({
            url: config.tipi_url + 'users/data/' + namespace,
            method: 'PUT',
            data: JSON.stringify(data),
        }, function (options) {
            options.headers['content-type']  = 'application/json';

            axios(options)
                .done(function (data) {
                    promise.resolve(data);
                }).fail(function () {
                promise.reject(new Error('Unable to set data'));
            });
        });

        return promise.promise;
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
session.getInstance = function (force) {
    if (force || instance === null) {
        instance = create_session();
    }

    return instance;
};

module.exports = session;