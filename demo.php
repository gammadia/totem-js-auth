<?php

require_once('lib/Tipi/Tipi.php');
require_once('lib/Tipi/Tipi/Session.php');
require_once('lib/Tipi/Tipi/Otp.php');

Tipi\Tipi::setUrl('http://127.0.0.1:9999/');
Tipi\Tipi::setApplicationName('Demo');
Tipi\Tipi::setApplicationKey('M9kUGp37UD/6X38t60vanyJmbxza2SwFDowal6V5xz4975LSzCoikEpxN/jrXaf7M/zRN/Cowuikbmm54NhsYA==');

header('Content-type: application/json');

echo json_encode(
	Tipi\Tipi::getInstance()->getUserData($_POST['namespace'])
);
