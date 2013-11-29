<?php

namespace GamLib\Tipi;

use GamLib\Tipi;

class Session {
	/**
	 *  Instance du singleton Session.
	 *
	 *  @var GamLib\Tipi\Session
	 */
	private static $instance = null;

	/**
	 *  Lecture de l'instance de Session
	 *
	 *  @return GamLib\Tipi\Session Instance du singleton
	 */
	public static function getInstance() {
		if (self::$instance === null) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 *  Constructeur privé. (Singleton)
	 */
	private function __construct() {}

	/**
	 *  Id de la session courante.
	 *
	 *  @var string
	 */
	private static $sessid = null;

	/**
	 *  Lecture du header Authorization.
	 *
	 *  @return string Token d'authentification complet.
	 */
	private function getAuthorization() {
		$auth = '';
		$headers = getallheaders();

		if (isset($headers['Authorization'])) {
			$auth = $headers['Authorization'];
		} else if (isset($headers['authorization'])) {
			$auth = $headers['authorization'];
		}

		return $auth;
	}

	/**
	 *  Lecture de l'id de session pour la requête courante.
	 *
	 *  @return  string      ID de la session
	 */
	public function getId() {
		if (self::$sessid === null) {
			preg_match(
				'/(?:sessid=")(?P<sessid>[a-z0-9\/+=\-]+)(?:")/i',
				$this->getAuthorization(),
				$token
			);

			if (!isset($token['sessid']) || empty($token['sessid'])) {
				return null;
			}

			self::$sessid = bin2hex(base64_decode($token['sessid']));
		}

		return self::$sessid;
	}

	/**
	 *  Vérifie si la session de l'utilisateur est bien active sur le serveur
	 *
	 *  @return boolean
	 */
	public function isValid() {
		$result = Tipi::getInstance()->makeRequest('session/ping', 'POST', array(
			'sess_id' => $this->getId(),
			'timestamp' => time()
		));

		$result = json_decode($result, true);

		return isset($result['success']) && $result['success'] === true;
	}
}
