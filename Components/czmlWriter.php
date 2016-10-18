<?php
/**
 * Created by PhpStorm.
 * User: a.zhakypov
 * Date: 28.09.2016
 * Time: 15:37
 */
if(isset($_POST)){
    $stamp = microtime(true);
    $home = getcwd();
    chdir('./czml');
    $dir = scandir('.');
    $expire = 600;
    foreach ($dir as $file){
        if(is_file($file) && $stamp - filectime($file)> $expire){
            unlink($file);
        }
    }
    chdir($home);
    $interval = $_POST['start'].'/'.$_POST['end'];
    $fname = $_POST['sat'].'_'.$stamp.'.czml';
    $position = $_POST['positions'];
    $n = count($position);
    $fd = fopen('./czml/'.$fname,"w");
    $step = $_POST['step'];
    $Roll = tan(deg2rad($_POST['roll']))*$position[0]['h'];
    $view = tan(deg2rad(0.5*$_POST['view']))*$position[0]['h'];
    fwrite($fd,'[
  {
    "id":"document",
    "name":"'.$fname .'",
    "version":"1.0",
    "clock":{
      "interval":"'.$interval.'",
      "currentTime":"'.$_POST['start'].'",
      "multiplier":60,
      "range":"LOOP_STOP",
      "step":"SYSTEM_CLOCK_MULTIPLIER"
    }
  },');
    if(isset($_POST['point'])){
        $lat = $_POST['point']['latitude'];
        $lng = $_POST['point']['longitude'];

        fwrite($fd,'
  {
    "id":"point",
    "name":"('.$lat.';'.$lng.')",
    "billboard":{
      "eyeOffset":{
        "cartesian":[
          0,0,0
        ]
      },
      "horizontalOrigin":"CENTER",
      "image":"../images/facility.gif",
      "pixelOffset":{
        "cartesian2":[
          0,0
        ]
      },
      "scale":1.5,
      "show":true,
      "verticalOrigin":"CENTER"
    },
    "position":{
      "cartographicRadians":['.$lng.','.$lat.',10000]
    }
  },');
    }
    $img = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADJSURBVDhPnZHRDcMgEEMZjVEYpaNklIzSEfLfD4qNnXAJSFWfhO7w2Zc0Tf9QG2rXrEzSUeZLOGm47WoH95x3Hl3jEgilvDgsOQUTqsNl68ezEwn1vae6lceSEEYvvWNT/Rxc4CXQNGadho1NXoJ+9iaqc2xi2xbt23PJCDIB6TQjOC6Bho/sDy3fBQT8PrVhibU7yBFcEPaRxOoeTwbwByCOYf9VGp1BYI1BA+EeHhmfzKbBoJEQwn1yzUZtyspIQUha85MpkNIXB7GizqDEECsAAAAASUVORK5CYII=';
    fwrite($fd,'
  {
    "id":"Satellite/'.$_POST['sat'].'",
    "name":"'.$_POST['sat'].'",
    "availability":"'.$interval.'",
    "billboard":{
      "eyeOffset":{
        "cartesian":[
          0,0,0
        ]
      },
      "horizontalOrigin":"CENTER",
      "image":"'.$img.'",
      "pixelOffset":{
        "cartesian2":[
          0,0
        ]
      },
      "scale":1.5,
      "show":true,
      "verticalOrigin":"CENTER"
    },
    "cylinder":{
      "length":'.$position[0]['h'] .',
      "topRadius":0.0,
      "bottomRadius":'.$view.',
      "material":{
        "solidColor":{
          "color":{
            "rgba":[
              0,255,0,128
            ]
          }
        }
      }
    },
    "ellipse":{
      "semiMinorAxis":'.$Roll.',
      "semiMajorAxis":'.$Roll.',
      "fill": false,
      "outline":true,
      "outlineColor":{
        "rgba":[
          255,0,0,255
        ]
      }
    },
    "label":{
      "fillColor":{
        "rgba":[
          255,0,255,255
        ]
      },
      "font":"11pt Lucida Console",
      "horizontalOrigin":"LEFT",
      "outlineColor":{
        "rgba":[
          0,0,0,255
        ]
      },
      "outlineWidth":2,
      "pixelOffset":{
        "cartesian2":[
          12,0
        ]
      },
      "show":true,
      "style":"FILL_AND_OUTLINE",
      "text":"'.$_POST['sat'].'",
      "verticalOrigin":"CENTER"
    },
    "path":{
      "show":[
        {
          "interval":"'.$interval.'",
          "boolean":true
        }
      ],
      "width":1,
      "material":{
        "solidColor":{
          "color":{
            "rgba":[
              0,255,0,255
            ]
          }
        }
      },
      "leadTime":['
    );

    $cycle = 100;
    $predict = $cycle*$step;
    for($i=0;$i<$n-$cycle;$i+=$cycle){
        fwrite($fd,'
        {
          "interval":"'.$position[$i]['time'].'/'.$position[$i+$cycle]['time'].'",
          "epoch":"'.$position[$i]['time'].'",
          "number":[
            0,'.$predict.',
            '.$predict.',0
          ]
        },');
    }
    $predict = ($n-1-$i)*$step;
    fwrite($fd,'
        {
          "interval":"'.$position[$i]['time'].'/'.$position[$n-1]['time'].'",
          "epoch":"'.$position[$i]['time'].'",
          "number":[
            0,'.$predict.',
            '.$predict.',0
          ]
        }
      ],
      "trailTime":[');

    $predict = $cycle*$step;
    for($i=0;$i<$n-$cycle;$i+=$cycle){
        fwrite($fd,'
        {
          "interval":"'.$position[$i]['time'].'/'.$position[$i+$cycle]['time'].'",
          "epoch":"'.$position[$i]['time'].'",
          "number":[
            0,0,
            '.$predict.','.$predict.'
          ]
        },');
    }
    $predict = ($n-1-$i)*$step;
    fwrite($fd,'
        {
          "interval":"'.$position[$i]['time'].'/'.$position[$n-1]['time'].'",
          "epoch":"'.$position[$i]['time'].'",
          "number":[
            0,0,
            '.$predict.','.$predict.'
          ]
        }
      ],
      "resolution":'.$step.'
    },
    "position":{
      "interpolationAlgorithm":"LAGRANGE",
      "interpolationDegree":5,
      "referenceFrame":"FIXED",
      "epoch":"'.$_POST['start'].'",
      "cartographicDegrees":[
      '
    );


    $t = 0;

    for($i=0;$i<$n-1;$i++){
        //fwrite($fd,"  ".$t.",".$position[$i]['X'].",".$position[$i]['Y'].",".$position[$i]['Y'].",\n      ");
        fwrite($fd,"  ".$t.",".$position[$i]['lng'].",".$position[$i]['lat'].",".$position[$i]['h'].",\n      ");
        $t += $step;
    }
   // fwrite($fd,"  ".$t.",".$position[$n-1]['X'].",".$position[$n-1]['Y'].",".$position[$n-1]['Y']."\n      ");
    fwrite($fd,"  ".$t.",".$position[$i]['lng'].",".$position[$i]['lat'].",".$position[$i]['h']."\n      ");
    fwrite($fd,']
    }
  }
]');
    fclose($fd);
    $res = array('date'=>$_POST['start'],'fname'=>'./Components/czml/'.$fname);
    echo json_encode($res);
}