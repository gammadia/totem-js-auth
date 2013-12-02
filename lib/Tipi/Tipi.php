<?php

namespace Tipi;

class Tipi {
	const ERR_NO_NAMESPACE = 32;

	/**
	 *  Instance du singleton Tipi.
	 *
	 *  @var Tipi\Tipi
	 */
	private static $instance = null;

	/**
	 *  Lecture de l'instance de Tipi
	 *
	 *  @return Tipi\Tipi Instance du singleton
	 */
	public static function getInstance() {
		if (self::$instance === null) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 *  URL de base de Tipi.
	 *  Ex: http://tipi.gammadia.ch/
	 *
	 *  @var string
	 */
	private static $tipi_base_url = null;

	/**
	 *  Défini l'URL de Tipi.
	 *
	 *  @param string $url
	 *  @see self::$tipi_base_url
	 */
	public static function setUrl($url = '') {
		if (strrchr($url, '/') !== '/') {
			$url .= '/';
		}

		self::$tipi_base_url = $url;
	}

	/**
	 *  Nom de l'application.
	 *
	 *  @var string
	 */
	private static $app_name = null;

	/**
	 *  Défini le nom de l'application.
	 *
	 *  @param string $name
	 *  @see self::$app_name
	 */
	public static function setApplicationName($name = '') {
		self::$app_name = $name;
	}

	/**
	 *  Clef de l'application.
	 *
	 *  @var string
	 */
	private static $app_key = null;

	/**
	 *  Défini la clef de l'application.
	 *
	 *  @param string $key
	 *  @see self::$app_key
	 */
	public static function setApplicationKey($key = '') {
		self::$app_key = $key;
	}

	/**
	 *  Cache des données utilisateur
	 *
	 *  @var array
	 */
	private static $cache = array();

	/**
	 *  Constructeur privé. (Singleton)
	 */
	private function __construct() {}

	/**
	 *  Générateur Otp
	 *
	 *  @var Tipi\Tipi\Otp
	 */
	private $generator = null;

	/**
	 *  Requête sur la base Tipi
	 *
	 *  @param   string $resource Resource (url)
	 *  @param   string $type     GET || POST
	 *  @param   array  $data     Données pour les requêtes POST
	 *
	 *  @return  array           Données reçues
	 */
	public function makeRequest($resource, $type = 'GET', $data = array()) {
		$ch = curl_init(self::$tipi_base_url . $resource);

		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array(
			$this->getAuthHeader()
		));

		if ($type === 'POST') {
			curl_setopt($ch, CURLOPT_POST, true);
			curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
		}

		$data = curl_exec($ch);

		curl_close($ch);

		return $data;
	}

	/**
	 *  Création du token http authentication pour Tipi
	 *  TIPI-TOKEN appid="xxx", sign="xxx"
	 *
	 *  @return string Token
	 */
	private function getToken() {
		if (!$this->generator) {
			$this->generator = new Tipi\Otp(self::$app_key);
		}

		$sign = $hash = hash_hmac('sha256', self::$app_key, $this->generator->getCode());
		$sign = base64_encode(hex2bin($sign));

		$token = 'TIPI-TOKEN ' .
				'app="' . self::$app_name . '", ' .
				'sign="' . $sign . '"';

		return $token;
	}

	/**
	 *  Création du header d'authentification
	 *
	 *  @returns [type] [description]
	 */
	public function getAuthHeader() {
		return 'Authorization: ' . $this->getToken();
	}

	/**
	 *  Lecture des données de l'utilisateur actuel pour le namespace donné.
	 *
	 *  @param   string  $namespace
	 *  @param   boolean $force_refresh Forcer le rechargement des données, ne pas lire le cache.
	 *
	 *  @return  array            Données utilisateur
	 */
	public function getUserData($namespace, $force_refresh = false) {
		if (empty($namespace)) {
			return array(
				'success' => false,
				'reason' => 'No namespace given'
			);
		}

		$session = Tipi\Session::getInstance();

		if (!$session->isValid()) {
			return array(
				'success' => false,
				'reason' => 'Invalid session'
			);
		}

		if ($force_refresh || !isset(self::$cache[$namespace])) {
			self::$cache[$namespace] = json_decode(
				$this->makeRequest('session/' . $session->getId() . '/' . $namespace),
				true
			);
		}

		return array(
			'success' => true,
			'data' => self::$cache[$namespace]
		);
	}
}
