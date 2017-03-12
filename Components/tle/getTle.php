<?php
/**
 * Created by PhpStorm.
 * User: a.zhakypov
 * Date: 30.09.2016
 * Time: 15:44
 */
function sat_sort($a,$b){
    return -strcmp($a['sat'],$b['sat']);
}

$fd = @fopen('http://www.celestrak.com/NORAD/elements/resource.txt',"r");
if(!$fd){
    $fd = fopen('./tle.txt',"r");
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
} else {
    $tle = array();
    $fw = fopen('./tle.txt',"w");
    while(!feof($fd)){
        $sat = trim(fgets($fd));
        fwrite($fw,$sat."\n");
        $tle1 = trim(fgets($fd));
        fwrite($fw,$tle1."\n");
        $tle2 = trim(fgets($fd));
        fwrite($fw,$tle2."\n");
        $tle[] = array(
            'sat' => $sat,
            'tle1' => $tle1,
            'tle2' => $tle2
        );
    }
    fclose($fw);
    fclose($fd);
}

usort($tle,"sat_sort");
echo json_encode($tle);