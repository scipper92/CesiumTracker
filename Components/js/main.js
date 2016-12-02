/**
 * Created by a.zhakypov on 22.09.2016.
 */
//var viewer;
//var Cesium;
var tleList;

$(function () {
    $.get("./Components/getTle.php",function (tle) {
        tleList = JSON.parse(tle);
        for(var i=0;i<tleList.length-1;i++){
            $("#blank-opt").after("<option>"+tleList[i].sat+"</option>");
        }
    });
});

function startup(Cesium) {
    'use strict';
//Sandcastle_Begin
// Cesium.CesiumWidget is similar to Cesium.Viewer, but
// is trimmed down.  It is just a viewer for the 3D globe;
// it does not include the animation, imagery selection,
// and other viewers, nor does it depend on the third-party
// Knockout library.
    var viewer = new Cesium.Viewer('cesiumContainer',{ infoBox : false });
    var scene = viewer.scene;

    var clock = viewer.clock;

    var deg2rad = Math.PI/180;

    function drawShape(points){
        viewer.entities.add({
            polygon : {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(points),
                material : Cesium.Color.RED.withAlpha(0.5),
                outline: true,
                outlineColor: Cesium.Color.BLACK
            }

        });
    }


    function icrf(scene, time) {
        if (scene.mode !== Cesium.SceneMode.SCENE3D) {
            return;
        }

        var icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(time);
        if (Cesium.defined(icrfToFixed)) {
            var camera = viewer.camera;
            var offset = Cesium.Cartesian3.clone(camera.position);
            var transform = Cesium.Matrix4.fromRotationTranslation(icrfToFixed);
            camera.lookAtTransform(transform, offset);
        }
    }

     viewer.camera.flyHome(0);

     scene.preRender.addEventListener(icrf);
     scene.globe.enableLighting = true;

    // Mouse over the globe to see the cartographic position
    var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(function(movement) {
        //console.log(movement);
        var cartesian = viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
        if (cartesian) {
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            //var longitudeString =
            $("#pointLng").val(Cesium.Math.toDegrees(cartographic.longitude).toFixed(2));
            $("#pointLat").val(Cesium.Math.toDegrees(cartographic.latitude).toFixed(2));
        }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    $("#polygon").click(function () {
        var li = $("#polygon").parent();
        if(li.hasClass("active")){
            li.removeClass("active");
            return;
        }

        li.addClass("active");
        $("#pointLng").val("");
        $("#pointLat").val("");
        viewer.entities.removeAll();
        var points = [];
        handler.setInputAction(function(event) {
            var cartesian = viewer.camera.pickEllipsoid(event.position, scene.globe.ellipsoid);

            if (cartesian) {
                var cartographic = Cesium.Cartographic.fromCartesian(cartesian);

                var longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
                var latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);

                $("#pointLat").val(function (i,old) {
                    if (old === ""){
                        return latitude;
                    } else {
                        return old + "," + latitude
                    }
                });
                $("#pointLng").val(function (i,old) {
                    if (old === "") {
                        return longitude;
                    } else {
                        return old + "," + longitude
                    }
                });

                viewer.entities.add({
                    position : Cesium.Cartesian3.fromDegrees(longitude, latitude),
                    point : {
                        pixelSize : 5,
                        color : Cesium.Color.YELLOW
                    }
                });

                points.push(longitude);
                points.push(latitude);

            } else {
                entity.label.show = false;
            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction(function(event) {
            drawShape(points);
            points = [];
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    });



    $("#orbitCalc").click(function(e){
        var tic = Date.now();
        e.preventDefault();
        viewer.dataSources.removeAll();
        var startD = new Date($("#startDate").val()+" "+$("#startTime").val());
        var endD = new Date($("#endDate").val()+" "+$("#endTime").val());
        var step = 60;// in seconds
        var name = $("#satellite").val();
        var point  = {
            longitude: deg2rad*$("#pointLng").val(),
            latitude: deg2rad*$("#pointLat").val()
        };
        var postObj = {
            start: startD.toISOString(),
            end: endD.toISOString(),
            sat: name,
            step: step,
            roll: $("#maxRoll").val(),
            view: $("#viewAngle").val(),
            point: point,
            positions: []
        };

        var index = tleList.find(function (tle) {
            return tle.sat == name;
        });

        startD = startD.getTime();
        endD = endD.getTime();


        var milistep = step*1000; // in milliseconds
        /*var tleLine1 = '1 39731U 14024A   16273.79761109  .00000013  00000-0  17444-4 0  9991',
            tleLine2 = '2 39731  98.4446 350.0995 0001308  79.7336 280.4005 14.41995531127368';*/
        var satrec = satellite.twoline2satrec(index.tle1, index.tle2);
        var positions = new Array();

        for(var t = startD;t<=endD;t+=milistep){
            var now = new Date(t);
            var positionGd = satPos(now,satrec);
            var longitudeStr = satellite.degreesLong(positionGd.longitude),
                latitudeStr  = satellite.degreesLat(positionGd.latitude);/**/
            positions.push({
                time: now.toISOString(),
/*
                X: 1000*positionAndVelocity.position.x,
                Y: 1000*positionAndVelocity.position.y,
                Z: 1000*positionAndVelocity.position.z
                /**/
                lng: longitudeStr,
                lat: latitudeStr,
                h: 1000*positionGd.height
            });
        }
        postObj.positions = positions;
        console.log(postObj);
        $.post("./Components/czmlWriter.php",postObj,function(data){
            var res = JSON.parse(data);
            viewer.dataSources.add(Cesium.CzmlDataSource.load(res.fname));
            return;
        });
        tic = Date.now() - tic;
        console.log( tic + " miliseconds perfomed");
    });

    $("#prepogate").click(function(e){
        var tic = Date.now();
        e.preventDefault();
        $(".track").remove();

        var point  = {
            longitude: deg2rad*$("#pointLng").val(),
            latitude: deg2rad*$("#pointLat").val()
        };
        //console.log(point);
        viewer.dataSources.removeAll();
        var startD = new Date($("#startDate").val()+" "+$("#startTime").val());
        var endD = new Date($("#endDate").val()+" "+$("#endTime").val());
        var step = 10;// in seconds
        var name = $("#satellite").val();
        var minSun = deg2rad*$("#SunAngle").val();
        var postObj = {
            start: "",
            end: "",
            sat: name,
            step: step,
            roll: $("#maxRoll").val(),
            view: $("#viewAngle").val(),
            positions: [],
            point: point
        };
        var roll = deg2rad*postObj.roll;
        var index = tleList.find(function (tle) {
            return tle.sat == name;
        });

        var milistep = step*1000; // in milliseconds
        /*var tleLine1 = '1 39731U 14024A   16273.79761109  .00000013  00000-0  17444-4 0  9991',
         tleLine2 = '2 39731  98.4446 350.0995 0001308  79.7336 280.4005 14.41995531127368';*/
        var satrec = satellite.twoline2satrec(index.tle1, index.tle2);
        var period = 12*3600000/Math.PI/index.tle2.slice(52,62);
        var inclination = Math.sin(deg2rad*index.tle2.slice(8,15));
       // console.log(inclination);
        var orbDelta = 2*Math.PI/index.tle2.slice(52,62);
       // console.log(orbDelta);
        var positions;

     /*   for(var t = startD;t<=endD;t+=milistep){
            var now = new Date(t);
            console.log(now.getUTCHours());*/

        var t = startD.getTime();
        endD = endD.getTime();
        var now;
        var res = catchPoint(point,satrec,startD,roll);
        //trackList = [];
        var trackItem = 0;
        while (t<endD) {
            var iter = 0;
            positions = [];
            while (res.dist > res.capture && t<endD) {
                iter++;
                if(res.dist<2*res.capture /*&& res.vz * (point.latitude - res.position.latitude) > 0*/){
                    //console.log('near');
                    t += Math.max((res.dist - res.capture) * period, milistep);
                } else if (res.vz * (point.latitude - res.position.latitude) > 2 * res.capture) {
                    t += Math.abs(arcsin(Math.sin(point.latitude - res.vz * res.capture) / inclination) - arcsin(Math.sin(res.position.latitude) / inclination)) * period;
                   // console.log('lat1');
                } else if (res.vz * (point.latitude - res.position.latitude) < -res.capture) {
                    t += (2 * Math.PI - Math.abs(arcsin(Math.sin(point.latitude - res.vz * res.capture) / inclination) - arcsin(Math.sin(res.position.latitude) / inclination))) * period;
                   // console.log('lat2');
                } else if (Math.abs(point.longitude - res.position.longitude) > 4*res.capture) {
                   // console.log('lng');
                    var t1 = t + 2 * arccos(res.vz * Math.sin(res.position.latitude) / inclination) * period;
                    now = new Date(t1);
                //    console.log('t1:', now);
                    var pos = satPos(now, satrec);
                //    console.log('tmp:', pos);
                    var l1 = fmod(2 * Math.PI - point.longitude + res.position.longitude, 2 * Math.PI),
                        l2 = fmod(2 * Math.PI - point.longitude + pos.longitude, 2 * Math.PI);
                    var p1 = fabs(l1, orbDelta), p2 = fabs(l2, orbDelta);
                    //console.log(p1, p2);
                    while (p1.r > 2*res.capture && p2.r > 2*res.capture) {
                        l1 += 2 * Math.PI;
                        l2 += 2 * Math.PI;
                        p1 = fabs(l1, orbDelta);
                        p2 = fabs(l2, orbDelta);
                     //   console.log(p1, p2);
                    }
                    t = (p1.r < p2.r && p1.d > 0) ? t + p1.d * period : t1 + p2.d * period;
                }
                /* else {
                 t += (2*Math.PI-res.dist-res.capture)*period;
                 }*/
                now = new Date(t);
             //   console.log(now);
                res = catchPoint(point, satrec, now, roll);
            }

            if(t>=endD) break;

            if (res.vz * (point.latitude - res.position.latitude) <= 0) {
                t += res.vz * (point.latitude - res.position.latitude)*period;
            }
            now = new Date(t);
            //   console.log(now);
            res = catchPoint(point, satrec, now, roll);
            iter++;

            postObj.start = now.toISOString();/*
            var track = {
                date: now.toDateString(),
                src: ""
            };*/
            var prev = now;

            while (res.dist < res.capture) {
                iter++;
                var longitudeStr = satellite.degreesLong(res.position.longitude),
                    latitudeStr = satellite.degreesLat(res.position.latitude);
                /**/
                positions.push({
                    time: now.toISOString(),
                    lng: longitudeStr,
                    lat: latitudeStr,
                    h: 1000 * res.position.height
                });
                t += milistep;
                prev = now;
                now = new Date(t);
            //    console.log(now);
                res = catchPoint(point, satrec, now, roll);
            }
            postObj.end = prev.toISOString();
            postObj.positions = [];
            postObj.positions = positions;
            //console.log(iter+" iterations spent");
            //console.log(postObj);
            if(positions.length > 0 && SunAngles(prev,res.position)>minSun){
                $.post("./Components/czmlWriter.php", postObj).done(function (data) {
                    var res = JSON.parse(data);
                    var prevTrack = "#track-"+trackItem;
                    trackItem++;
                    $(prevTrack).after("<a href=\"#\" class=\"list-group-item track\" id=\"track-" + trackItem + "\">" + res.date + "</a>");
                    prevTrack = "#track-" + trackItem;
                    $(prevTrack).click(function (e) {
                        e.preventDefault();
                        viewer.dataSources.removeAll();
                        viewer.dataSources.add(Cesium.CzmlDataSource.load(res.fname));
                    });
                    return;
                });
            }

            t += Math.PI * period;
            now = new Date(t);
        //    console.log(now);
            res = catchPoint(point, satrec, now, roll);
        }
        tic = Date.now() - tic;
        console.log( tic + " miliseconds perfomed");
    });


}

$(function() {
    if (typeof Cesium !== "undefined") {
        startup(Cesium);
    } else if (typeof require === "function") {
        require(["Cesium"], startup);
    }
});

$("#menu-toggle").click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
});

function satPos(now,satrec) {
    var positionAndVelocity = satellite.propagate(
        satrec,
        now.getUTCFullYear(),
        now.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
    );
    var gmst = satellite.gstimeFromDate(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
    );
    return satellite.eciToGeodetic(positionAndVelocity.position, gmst);
}

function catchPoint(point,satrec,now,roll) {
    var positionAndVelocity = satellite.propagate(
        satrec,
        now.getUTCFullYear(),
        now.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
    );
    var gmst = satellite.gstimeFromDate(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
    );
    var positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
   // console.log(positionGd);
    var res = {
        dist: distEarthLatLng(point,positionGd),
        capture: captureRadius(positionGd.latitude,roll,positionGd.height),
        position: positionGd,
        vz: positionAndVelocity.velocity.z/Math.abs(positionAndVelocity.velocity.z)
    };
   // console.log(res);
    return res;
}

