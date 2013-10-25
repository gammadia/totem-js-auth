/*jslint browser: true, white: true */
/*global define */

define(['srp', 'module', 'vendors/cryptojs', 'jquery'], function (srp, module, CryptoJS, jQuery) {
	'use strict';

	var	/**
		 *  Nombre maximal de tentatives avant d'abandoner.
		 *  Utilisé pour le fix temporaire des erreures de la lib srp.
		 *
		 *  @type {Number}
		 */
		max_retries = 3,

		/**
		 *  Instance de session. (Singleton)
		 *
		 *  @type {Object}
		 */
		instance = null,

		/**
		 *  Objet de gestion de la session utilisateur. Singleton.
		 *
		 *  @type {Object}
		 */
		session = {};

	session.prototype = {
		/**
		 *  Créer une requête de session.
		 *
		 *  @returns {jQuery.Deferred} Objet de promesse jQuery
		 */
		make_request: function () {
			var that = this;

			this.promise = this.promise || jQuery.Deferred();

			jQuery.post(
				module.config().auth_url,
				this.getRequest(),
				this.getResponseHandler()
			).fail(function (jqXHR) {
				that.promise.reject();
			});

			return this.promise.promise();
		},

		/**
		 *  Créer une objet de données pour la requête d'authentification.
		 *
		 *  @returns {object} Objet à poster lors de la requête.
		 */
		getRequest: function () {
			this.srp = srp.create(this.username, this.password);

			return {
				username:	this.username,
				A:			this.srp.getA().toString(16)
			};
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
				module.config().auth_url,
				{
					M1: this.srp.getM1().toString(16)
				}
			).done(function (data, textStatus) {
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
			this.sess_id = id;

			//	Récupère la clef et nettoye l'objet srp.
			this.key = this.srp.getK().toString(16);
			delete this.srp;

			this.valid_session = true;

			//this.updateCookie();
			console.log(this.key);

			this.promise.resolve();
		},

		/**
		 *  Mise à jour du cookie d'authentification.
		 */
		/*updateCookie: function () {
			var token = this.generateToken();

			if (token === null) {
				this.cleanCookie();
			}

			jQuery.cookie(
				module.config().cookie.name,
				token,
				{
					domain: module.config().cookie.domain,
					path: module.config().cookie.path
				}
			);
		},*/

		/**
		 *  Expire le cookie en cas d'expiration ou de problème de session.
		 */
		/*cleanCookie: function () {
			jQuery.removeCookie(
				module.config().cookie.name,
				{
					domain: module.config().cookie.domain,
					path: module.config().cookie.path
				}
			);

			this.valid_session = false;
		},*/

		/**
		 *  Génère un token d'authentification.
		 *
		 *  @returns {String} Jetton d'identification pour l'api.
		 */
		generateToken: function () {
			var token = null;

			//	Pas de bras, pas de chocolat.
			if (this.key !== undefined && this.sess_id !== undefined) {
				token = [
					(new Date()).toJSON(),
					this.sess_id
				];

				token.unshift(
					CryptoJS.enc.Hex.stringify(
						CryptoJS.HmacSHA512(
							token.join(),
							CryptoJS.enc.Hex.parse(this.key)
						)
					)
				);

				token = CryptoJS.enc.Base64.stringify(
					CryptoJS.enc.Utf8.parse(
						JSON.stringify(token)
					)
				);
			}

			return token;
		},

		/**
		 *  Es-ce que la session est valide?
		 *
		 *  @returns {Boolean} Vrais ou faux.
		 */
		isValid: function () {
			return this.valid_session;
		},

		/**
		 *  Détruit la session en cours.
		 */
		destroy: function () {
			//this.cleanCookie();
		},

		/**
		 *  Relance la requête en cas d'échec. Il arrive que srp se broutte.
		 */
		retry: function () {
			var that = this;

			that.tries += 1;

			if (that.tries >= max_retries) {
				that.tries = 0;
				that.promise.reject();
			} else {
				that.make_request();
			}
		},

		/**
		 *  Initialise la session.
		 *  Vérifie si un cookie existe déjà.
		 */
		init: function () {
			//if (jQuery.cookie(module.config().cookie.name)) {
			//	this.valid_session = true;
			//}
		}
	};

	/**
	 *  Création d'un nouvel objet de session pour le client.
	 *
	 *  @constructor
	 *  @param {string} username Nom d'utilisateur (Identité)
	 *  @param {string} password Mot de passe (Preuve de l'identité)
	 */
	session.create = function (username, password) {
		instance = Object.create(session.prototype, {
			username: {
				value: username,
				enumerable: false
			},
			password: {
				value: password,
				enumerable: false
			},
			tries: {
				value: 0,
				enumerable: false,
				writable: true
			},
			onLoginSuccess: {
				value: false,
				enumerable: false,
				writable: true
			}
		});

		instance.init();

		return instance;
	};

	/**
	 *  Retourne l'instance de session.
	 *
	 *  @returns {Object} La session
	 */
	session.getInstance = function () {
		if (instance === null) {
			instance = session.create();
		}

		return instance;
	};

	return session;
});