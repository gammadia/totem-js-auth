<?php

require_once('lib/GamLib/Tipi.php');
require_once('lib/GamLib/Tipi/Session.php');
require_once('lib/GamLib/Tipi/Otp.php');

GamLib\Tipi::setUrl('http://127.0.0.1:9999/');
GamLib\Tipi::setApplicationName('Demo');
GamLib\Tipi::setApplicationKey('M9kUGp37UD/6X38t60vanyJmbxza2SwFDowal6V5xz4975LSzCoikEpxN/jrXaf7M/zRN/Cowuikbmm54NhsYA==');

header('Content-type: application/json');

echo json_encode(
	GamLib\Tipi::getInstance()->getUserData($_POST['namespace'])
);
