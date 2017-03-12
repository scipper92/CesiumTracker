/**
 * Created by a.zhakypov on 22.09.2016.
 */
//var viewer;
//var Cesium;
var tleList;
var deg2rad = Math.PI/180;
var tic;
var startD, endD, step, milistep;// in seconds
var name, satrec, roll, minSun;
var point, polygon;
var period, inclination, orbDelta;


$(function () {
    $.get("./Components/tle/getTle.php",function (tle) {
        //console.log(tle);
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
    Cesium.BingMapsApi.defaultKey = 'Ahfl5eatJbFgoXQ5JcTvBsjdwXIoxDzQ_0A-XIIzXj4yCi0DfgceblDXwmBHKTH1';
    var viewer = new Cesium.Viewer('cesiumContainer', {
        infoBox : false,
        baseLayerPicker: false,
        imageryProvider: Cesium.createTileMapServiceImageryProvider({
            url : require.toUrl('Assets/Textures/NaturalEarthII')
        })/*, {
        imageryProvider: new BingMapsApi({
            url: 'https://dev.virtualearth.net',
            key: 'Ahfl5eatJbFgoXQ5JcTvBsjdwXIoxDzQ_0A-XIIzXj4yCi0DfgceblDXwmBHKTH1'
        })
    }*/});
    var scene = viewer.scene;
    var polygonEntities;
    var clock = viewer.clock;

    function drawShape(points){
        return viewer.entities.add({
            polygon : {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(points),
                material : Cesium.Color.RED.withAlpha(0.3)/*,
                outline: true,
                outlineColor: Cesium.Color.BLACK*/
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
           // viewer.entities.removeAll();
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
            var latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);
            //var longitudeString =
            $("#pointLng").val(longitude);
            $("#pointLat").val(latitude);
            viewer.entities.add({
                position : cartesian,
                point : {
                    pixelSize : 5,
                    color : Cesium.Color.YELLOW
                }
            });
        }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    function init(e,myStep){
        tic = Date.now();
        e.preventDefault();
        viewer.dataSources.removeAll();
        startD = new Date($("#startDate").val());//+" "+$("#startTime").val());
        endD = new Date($("#endDate").val());//+" "+$("#endTime").val());
        console.log(startD,endD);
        step = myStep;// in seconds
        name = $("#satellite").val();
        var postObj = {
            start: startD.toISOString(),
            end: endD.toISOString(),
            sat: name,
            step: step,
            capture: null,
            // roll: $("#maxRoll").val(),
            // view: $("#viewAngle").val(),
            positions: []
        };

        var index = tleList.find(function (tle) {
            return tle.sat == name;
        });

        endD = endD.getTime();

        milistep = step*1000; // in milliseconds
        /*var tleLine1 = '1 39731U 14024A   16273.79761109  .00000013  00000-0  17444-4 0  9991',
         tleLine2 = '2 39731  98.4446 350.0995 0001308  79.7336 280.4005 14.41995531127368';*/
        satrec = satellite.twoline2satrec(index.tle1, index.tle2);
        period = 12*3600000/Math.PI/index.tle2.slice(52,62);
        inclination = Math.sin(deg2rad*index.tle2.slice(8,15));
        // console.log(inclination);
        orbDelta = 2*Math.PI/index.tle2.slice(52,62);
        return postObj;
    }

    function initPropagator(e) {
        tic = Date.now();
        e.preventDefault();
        $(".track").remove();
        polygon = new Polygon($("#pointLng").val(),$("#pointLat").val());
        console.log(polygon);

        var point  = {
            longitude: polygon.longitude[0],
            latitude: polygon.latitude[0]
        };
        //console.log(point);
        viewer.dataSources.removeAll();
        var postObj = init(e,10);
        roll = deg2rad*$("#maxRoll").val();
        minSun = deg2rad*$("#SunAngle").val();
        postObj.point = polygon.isPoint ? point : [];
        return postObj;
    }

    function sendPost(postObj,res,prev,positions,minSun,trackItem) {
        postObj.end = prev.toISOString();
        postObj.positions = [];
        postObj.positions = positions;
        postObj.capture = 1000*rEarth(res.position.latitude)*res.capture;
        //console.log(iter+" iterations spent");
        //console.log(postObj);
        console.log(postObj);
        //var newTrackItem = trackItem;
        if(positions.length > 0 && SunAngles(prev,res.position)>=minSun){
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
        return trackItem;
    }

    $("#polygon").click(function () {
        var li = $("#polygon").parent();
        if(li.hasClass("active")){
            li.removeClass("active");
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
            return;
        }
        polygonEntities = [];
        li.addClass("active");
        $("#pointLng").val("");
        $("#pointLat").val("");
        viewer.entities.removeAll();
        var points = [];
        handler.setInputAction(function(event) {
            var cartesian = viewer.camera.pickEllipsoid(event.position, scene.globe.ellipsoid);

            if (cartesian) {
                var cartographic = Cesium.Cartographic.fromCartesian(cartesian);

                var longitude = Cesium.Math.toDegrees(cartographic.longitude);
                var latitude = Cesium.Math.toDegrees(cartographic.latitude);

                $("#pointLat").val(function (i,old) {
                    if (old === ""){
                        return latitude.toFixed(2);
                    } else {
                        return old + "," + latitude.toFixed(2)
                    }
                });
                $("#pointLng").val(function (i,old) {
                    if (old === "") {
                        return longitude.toFixed(2);
                    } else {
                        return old + "," + longitude.toFixed(2)
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
            polygonEntities.push(drawShape(points));
            points = [];
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    });

    function reachPoly(sat,t,westWidth) {
        if (polygon.isForNorth(sat)) {
            //   console.log(">> North!");
            t += Math.abs(arcsin(Math.sin(polygon.north + sat.capture) / inclination) - arcsin(Math.sin(sat.position.latitude) / inclination)) * period;
        } else if (polygon.isBackNorth(sat)) {
            //    console.log("<< North!");
            t += (2 * Math.PI - Math.abs(arcsin(Math.sin(polygon.south - sat.capture) / inclination) - arcsin(Math.sin(sat.position.latitude) / inclination))) * period;
        } else if (polygon.isForSouth(sat)) {
            //   console.log(">> South!");
            t += Math.abs(arcsin(Math.sin(polygon.south - sat.capture) / inclination) - arcsin(Math.sin(sat.position.latitude) / inclination)) * period;
        } else if (polygon.isBackSouth(sat)) {
            //    console.log("<< South!");
            t += (2 * Math.PI - Math.abs(arcsin(Math.sin(polygon.north + sat.capture) / inclination) - arcsin(Math.sin(sat.position.latitude) / inclination))) * period;
        } else if (polygon.isFarWest(sat, inclination) || polygon.isFarEast(sat, inclination)) {
          //  console.log("East");
            var t1 = sat.vz < 0 ? t + (arccos(-Math.sin(sat.position.latitude) / inclination) + arccos(-Math.sin(polygon.south) / inclination)) * period :
            t + (arccos(Math.sin(sat.position.latitude) / inclination) + arccos(Math.sin(polygon.north) / inclination)) * period;
            var now = new Date(t1);
            //    console.log('t1:', now);
            var sat1 = satPosV(satrec, now, roll);
            var b = polygon.captFromEast(sat,inclination), b1 = polygon.captFromEast(sat1,inclination);
            var l1 = fmod(2 * Math.PI - polygon.east + sat.position.longitude, 2 * Math.PI),
                l2 = fmod(2 * Math.PI - polygon.east + sat1.position.longitude, 2 * Math.PI),
                r1 = fmod(2 * Math.PI - polygon.west + sat.position.longitude, 2 * Math.PI),
                r2 = fmod(2 * Math.PI - polygon.west + sat1.position.longitude, 2 * Math.PI);
            //    console.log(l1, l2, r1, r2);
            var pl1 = f2q(l1, orbDelta), pl2 = f2q(l2, orbDelta), pr1 = f2q(r1, orbDelta), pr2 = f2q(r2, orbDelta);
            pl1.near = (pl1.r <= b+sat.capture && pl1.r >= -westWidth - sat.capture);
            pl2.near = (pl2.r <= b1+sat1.capture && pl2.r >= -westWidth - sat1.capture);
            pr1.near = (pr1.r >= -b-sat.capture && pl1.r <= westWidth + sat.capture);
            pr2.near = (pr2.r >= -b1-sat1.capture && pl2.r <= westWidth + sat1.capture);
            //    console.log(pl1, pl2, pr1, pr2);
            if(westWidth>=2*orbDelta){
                if (pr1.d < pl2.d && pr1.d > 0) {
                    t += pl1.near ? pl1.d*period : (pl1.d+2*Math.PI)*period;
                } else {
                    t = pl2.near ? t1 + pl2.d*period : t1 + (pl2.d+2*Math.PI)*period;
                }
            } else {
                while (!((pl1.near && pl1.d>0) || pl2.near || (pr1.near && pr1.d>0) || pr2.near)) {
                    /*(pl1.r>sat.capture || pl1.r<-westWidth-sat.capture) && (pl2.r>sat1.capture || pl2.r<-westWidth-sat1.capture) &&
                     (pr1.r<-sat.capture || pr1.r>westWidth+sat.capture) && (pr2.r<-sat1.capture || pr2.r>westWidth+sat1.capture))*/
                    l1 += 2 * Math.PI;
                    l2 += 2 * Math.PI;
                    pl1 = f2q(l1, orbDelta);
                    pl2 = f2q(l2, orbDelta);
                    r1 += 2 * Math.PI;
                    r2 += 2 * Math.PI;
                    pr1 = f2q(r1, orbDelta);
                    pr2 = f2q(r2, orbDelta);
                    pl1.near = (pl1.r <= sat.capture && pl1.r >= -westWidth - sat.capture);
                    pl2.near = (pl2.r <= sat1.capture && pl2.r >= -westWidth - sat1.capture);
                    pr1.near = (pr1.r >= -sat.capture && pl1.r <= westWidth + sat.capture);
                    pr2.near = (pr2.r >= -sat1.capture && pl2.r <= westWidth + sat1.capture);
                    //         console.log(pl1, pl2, pr1, pr2);
                }
                /*
                 t = (p1.r<=sat.capture && p1.r>=westWidth-sat.capture) ? ((p2.r<=sat1.capture && p2.r>=westWidth-sat1.capture) ? (p1.d <= p2.d ?
                 t + p1.d*period : t1 + p2.d*period) : t + p1.d*period) : t1 + p2.d*period;*/
                if (pr1.d < pl2.d && pr1.d > 0) {
                    t = (pl1.near && pl1.d>0) ? t + pl1.d*period : (pr1.near ? t + pr1.d*period : (pl2.near ? t1 + pl2.d*period : t1 + pr2.d*period));
                } else {
                    t = pl2.near ? t1 + pl2.d*period : (pr2.near ? t1 + pr2.d*period : (pl1.near ? t + pl1.d*period : t + pr1.d*period));
                }
            }
        } else {
            //console.log("Near");
            var closeSide = polygon.closeExtSide(sat);
            //    console.log(closeSide);
            var i = closeSide.index;
            t += Math.max(closeSide.dist / (polygon.supLng[i] * Math.sqrt(1 - inclination * inclination) + polygon.supLat[i] * inclination) * period, 20000);
        }

        return t;
    }
    function prep4poly(postObj) {
        var t = startD.getTime();
        var now;
        var sat = satPosV(satrec,startD,roll);
        var westWidth = polygon.east - polygon.west;
        console.log(startD,sat);
        var trackItem = 0;
        while(t<endD) {
            var iter = 0;
            var positions = [];
            while (!polygon.isInside(sat)) {
                iter++;
                t = reachPoly(sat,t,westWidth);
                now = new Date(t);
                sat = satPosV(satrec, now, roll);
            //    console.log(now, sat);
            }
            if (t >= endD) break;
            var prev = now;
            postObj.start = now.toISOString();
            while (polygon.isInside(sat)) {
            //    console.log("Inside");
                iter++;/*
                var longitudeStr = satellite.degreesLong(sat.position.longitude),
                    latitudeStr = satellite.degreesLat(sat.position.latitude);*/
                positions.push({
                    time: now.toISOString(),/*
                    lng: longitudeStr,
                    lat: latitudeStr,
                    h: 1000 * sat.position.height*/
                    X: 1000*sat.cartesian.x,
                    Y: 1000*sat.cartesian.y,
                    Z: 1000*sat.cartesian.z
                });
                t += milistep;
                prev = now;
                now = new Date(t);
                sat = satPosV(satrec, now, roll);
                // console.log(now,sat);
            }
            trackItem = sendPost(postObj, sat, prev, positions, minSun, trackItem);
            t += (2 * Math.PI - polygon.north + polygon.south - sat.capture) * period;
            now = new Date(t);
            sat = satPosV(satrec, now, roll);
        }
        return;
    }

    function prep4point(postObj){
        var t = startD.getTime();
        var now;
        var res = catchPoint(point,satrec,startD,roll);
        var trackItem = 0;

        while (t<endD) {
            var iter = 0;
            var positions = [];
            while (res.dist > res.capture && t<endD) {
                iter++;
                if(res.dist<2*res.capture){
                    //console.log('near');
                    t += Math.max((res.dist - res.capture) * period, milistep);
                } else if (res.vz * (point.latitude - res.position.latitude) > 2 * res.capture) {
                    t += Math.abs(arcsin(Math.sin(point.latitude - res.vz * res.capture) / inclination) - arcsin(Math.sin(res.position.latitude) / inclination)) * period;
                    // console.log('lat1');
                } else if (res.vz * (point.latitude - res.position.latitude) < -res.capture) {
                    t += (2 * Math.PI - Math.abs(arcsin(Math.sin(point.latitude - res.vz * res.capture) / inclination) - arcsin(Math.sin(res.position.latitude) / inclination))) * period;
                    // console.log('lat2');
                } else if (Math.abs(point.longitude - res.position.longitude) > 4*res.capture) {
                //    console.log('lng');
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
                    if(p1.d<p2.d  )
                        t = (p1.r<=2*res.capture && p1.d>0) ? t + p1.d*period : t1 + p2.d*period;
                    else
                        t = (p2.r<=2*res.capture) ? t1 + p2.d*period : t + p1.d*period;
                }
                now = new Date(t);
                //   console.log(now);
                res = catchPoint(point, satrec, now, roll);
            }

            if(t>=endD) break;

            if (res.vz * (point.latitude - res.position.latitude) <= 0) {
                t += res.vz * (point.latitude - res.position.latitude)*period;
                now = new Date(t);
                res = catchPoint(point, satrec, now, roll);
            }

            iter++;

            postObj.start = now.toISOString();
            var prev = now;

            while (res.dist < res.capture) {
                iter++;/*
                var longitudeStr = satellite.degreesLong(res.position.longitude),
                    latitudeStr = satellite.degreesLat(res.position.latitude);*/
                positions.push({
                    time: now.toISOString(),/*
                    lng: longitudeStr,
                    lat: latitudeStr,
                    h: 1000 * res.position.height*/
                    X: 1000*res.cartesian.x,
                    Y: 1000*res.cartesian.y,
                    Z: 1000*res.cartesian.z
                });
                t += milistep;
                prev = now;
                now = new Date(t);
                //    console.log(now);
                res = catchPoint(point, satrec, now, roll);
            }
            trackItem = sendPost(postObj,res,prev,positions,minSun,trackItem);

            t += Math.PI * period;
            now = new Date(t);
            //    console.log(now);
            res = catchPoint(point, satrec, now, roll);
        }
    }

    $("#orbitCalc").click(function(e){
        var postObj = init(e,60);
        var positions = [];
        startD = startD.getTime();
        for(var t = startD;t<=endD;t+=milistep){
            var now = new Date(t);
            var positionAndVelocity = satellite.propagate(
                satrec,
                now.getUTCFullYear(),
                now.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
                now.getUTCDate(),
                now.getUTCHours(),
                now.getUTCMinutes(),
                now.getUTCSeconds()
            );/*
            var positionGd = satPos(now,satrec);
            var longitudeStr = satellite.degreesLong(positionGd.longitude),
                latitudeStr  = satellite.degreesLat(positionGd.latitude);/**/
            positions.push({
                time: now.toISOString(),
                X: 1000*positionAndVelocity.position.x,
                Y: 1000*positionAndVelocity.position.y,
                Z: 1000*positionAndVelocity.position.z/*
                lng: longitudeStr,
                lat: latitudeStr,
                h: 1000*positionGd.height
/**/
            });
        }
        postObj.positions = positions;
        postObj.capture = 1000*6371*satPosV(satrec,now,deg2rad*$("#maxRoll").val()).capture;
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
        var postObj = initPropagator(e);
       // console.log(orbDelta);
        if(!polygon.isPoint) {
            prep4poly(postObj);
        } else {
            prep4point(postObj);
        }
        tic = Date.now() - tic;
        console.log( tic + " miliseconds perfomed");
    });

    $("#optimize").click(function(e) {
        var postObj = initPropagator(e);
        /*-----------------------------------------------
        var positionAndVelocity = satellite.propagate(
            satrec,
            startD.getUTCFullYear(),
            startD.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
            startD.getUTCDate(),
            startD.getUTCHours(),
            startD.getUTCMinutes(),
            startD.getUTCSeconds()
        );
        var velosityMS = {
            x: 1000*positionAndVelocity.velocity.x,
            y: 1000*positionAndVelocity.velocity.y,
            z: 1000*positionAndVelocity.velocity.z
        };
        var gmst = satellite.gstimeFromDate(
            startD.getUTCFullYear(),
            startD.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
            startD.getUTCDate(),
            startD.getUTCHours(),
            startD.getUTCMinutes(),
            startD.getUTCSeconds()
        );
        var velDir = satellite.eciToGeodetic(velosityMS, gmst);
        console.log(velDir);
        --------------------------------------------------------*/

        var inclN = {
            longitude: inclination,
            latitude: sgn(Math.cos(deg2rad*index.tle2.slice(17,24)))*Math.sqrt(1-inclination*inclination)
        };
        var swathWidth = 30, overlay = 0.05;
        console.log(inclN);
        var strips = polygon.surRect(inclN,(1-2*overlay)*swathWidth);
    //    console.log(strips);
        for(var i=0;i<strips.length;i++){
            viewer.entities.add({
                corridor : {
                    positions : Cesium.Cartesian3.fromRadiansArray([
                        strips[i].top.longitude, strips[i].top.latitude,
                        strips[i].bottom.longitude, strips[i].bottom.latitude
                    ]),
                    width : 1000*swathWidth,
                    cornerType: Cesium.CornerType.MITERED,
                    material : Cesium.Color.YELLOW.withAlpha(0.7)
                }
            });
        }
        /*----------------------------------------------*/
        var t = startD;
        var now;
        var sat = satPosV(satrec,startD,roll);
        var westWidth = polygon.east - polygon.west;
        console.log(startD,sat);
        var trackItem = 0;
        var passes = [];
        for(i=0;i<strips.length;) {
           // var iter = 0;
            var positions = [];
            while (!polygon.isInside(sat)) {
             //   iter++;
                t = reachPoly(sat,t,westWidth);
                now = new Date(t);
                sat = satPosV(satrec, now, roll);
            }
            console.log(now, sat);
            while(polygon.isInside(sat)){
                positions.push(sat.position);
                t += milistep;
                now = new Date(t);
                sat = satPosV(satrec, now, roll);
            }
            if(SunAngles(now,sat.position)>=minSun) {
                passes.push({
                    date: now,
                    strips: [],
                    dists: []
                });
            //    var c1 = inclN.latitude*sat.position.latitude + inclN.longitude*sat.position.longitude;
                for (var j = 0; j < strips.length; j++) {
                    var minDist = 10, curDist;
                    for(var k=0; k<positions.length;k++){
                        curDist = Math.min(distEarthLatLng(strips[j].bottom,positions[k]),distEarthLatLng(strips[j].top, positions[k]));
                        if(curDist<minDist) minDist = curDist;
                    }
                /*    var dist = Math.min(distEarthLatLng(strips[j].bottom,positions[midInd]),distEarthLatLng(strips[j].top, positions[midInd]));
                    var dist = Math.abs(strips[j].hyperplane-c1);
                    console.log(c1,dist,minDist);*/
                    if (minDist<=sat.capture) {
                        passes[i].strips.push(j);
                        passes[i].dists.push(minDist);
                        strips[j].passCount++;
                    }
                }
                i++;
            }
            t += (2 * Math.PI - polygon.north + polygon.south - sat.capture) * period;
            now = new Date(t);
            sat = satPosV(satrec, now, roll);
        }
        passes.sort(function (a,b) {
            return a.strips.length - b.strips.length;
        }); 
        console.log(strips,passes);
        for(i=0;i<passes.length;i++){
            j = choosePass(passes[i],strips);
            strips[j].passDate = passes[i].date;
        }
        console.log(strips,passes);


        /*-----------------------------------------------*/
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
    var sat = satPosV(satrec,now,roll);
   // console.log(positionGd);
   // console.log(res);
    return {
        dist: distEarthLatLng(point,sat.position),
        capture: sat.capture,
        position: sat.position,
        cartesian: sat.cartesian,
        vz: sat.vz
    };
}

function satPosV(satrec,now,roll) {
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
    var res = {
        position: positionGd,
        cartesian: positionAndVelocity.position,
        vz: positionAndVelocity.velocity.z/Math.abs(positionAndVelocity.velocity.z),
        capture: captureRadius(positionGd.latitude,roll,positionGd.height)
    };
    res.position.longitude = fb2p(res.position.longitude);
    return res;
}

function choosePass(pass,strips){
    var minCountStrips = [], minCount = strips.length;
    for(var i=0;i<pass.strips.length;i++){
        var j = pass.strips[i];
        if(strips[j].passDate === null && strips[j].passCount <= minCount){
            if(strips[j].passCount < minCount){
                minCountStrips = [];
                minCount = strips[j].passCount;
            }
            minCountStrips.push(j);
        }
    }
    console.log(minCountStrips);
    var optimStrip = minCountStrips[0];
    for(i=1;i<minCountStrips.length;i++){
        j = minCountStrips[i];
        if(pass.dists[j] < optimStrip){
            optimStrip = j;
        }
    }
    console.log("optimal strip is "+optimStrip);
    //strips[optimStrip].passDate = pass.date;
    return optimStrip;
}
