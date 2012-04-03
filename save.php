<?php

if (!empty($_POST['image'])) {
    $time = time();
	$imageData = $_POST['image'];
	$imageName = $time . '.png';
	$filteredData = substr($imageData, strpos($imageData, ',') + 1);
    $unencodedData = base64_decode($filteredData);
    $fp = fopen('images/temp/' . $imageName, 'wb');
    fwrite($fp, $unencodedData);
    fclose($fp);
    echo '{ "url": "images/temp/' . $imageName . '" }';    
}

?>