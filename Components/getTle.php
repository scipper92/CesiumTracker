<?php
/**
 * Created by PhpStorm.
 * User: a.zhakypov
 * Date: 30.09.2016
 * Time: 15:44
 */
$fd = fopen('http://www.celestrak.com/NORAD/elements/resource.txt',"r");
$tle = array();
while(!feof($fd)){
    $sat = trim(fgets($fd));
    $tle1 = trim(fgets($fd));
    $tle2 = trim(fgets($fd));
    $tle[] = array(
        'sat' => $sat,
        'tle1' => $tle1,
        'tle2' => $tle2
    );
}
fclose($fd);
echo json_encode($tle);