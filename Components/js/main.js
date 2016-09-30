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
    var viewer = new Cesium.Viewer('cesiumContainer');
    var scene = viewer.scene;

 /*   var clock = viewer.clock;

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

     scene.preRender.addEventListener(icrf);*/
     scene.globe.enableLighting = true;

    $("#orbitCalc").click(function(e){
        e.preventDefault();
        var startD = new Date($("#startDate").val()+" "+$("#startTime").val());
        var endD = new Date($("#endDate").val()+" "+$("#endTime").val());
        var step = 60;// in seconds
        var name = $("#satellite").val();
        var postObj = {
            start: startD.toISOString(),
            end: endD.toISOString(),
            sat: name,
            step: step,
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
            var positionGd    = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
            positions.push({
                time: now.toISOString(),
                /*
                X: 1000*positionAndVelocity.position.x,
                Y: 1000*positionAndVelocity.position.y,
                Z: 1000*positionAndVelocity.position.z
                */
                lng: positionGd.longitude,
                lat: positionGd.latitude,
                h: 1000*positionGd.height
            });
        }
        postObj.positions = positions;
        console.log(postObj);
        $.post("./Components/czmlWriter.php",postObj,function(res){
            viewer.dataSources.add(Cesium.CzmlDataSource.load(res));

        });
    });
//    viewer = new Cesium.CesiumWidget('cesiumContainer');
//Sandcastle_End
//    Sandcastle.finishedLoading();
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
    /*
    sidebar  = $("#sidebar-wrapper");
    console.log(sidebar.css("width"));
    if (sidebar.css("width") == "0px"){
        sidebar.animate({width: "250px"});
        //sidebar.css("width","250px");
    } else {
        sidebar.animate({width: "0"});
       // sidebar.css("width","0");
    }
    //$("#sidebar-wrapper").slideToggle("slow");*/
});
/*
$("#orbitCalc").click(function (e) {

        /*

        var positionEci = positionAndVelocity.position,
            velocityEci = positionAndVelocity.velocity;

        var gmst = satellite.gstimeFromDate(
            now.getUTCFullYear(),
            now.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
            now.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds()
        );

        var positionEcf   = satellite.eciToEcf(positionEci, gmst),
            //observerEcf   = satellite.geodeticToEcf(observerGd),
            positionGd    = satellite.eciToGeodetic(positionEci, gmst);
        //lookAngles    = satellite.ecfToLookAngles(observerGd, positionEcf);

        var longitude = positionGd.longitude,
            latitude  = positionGd.latitude,
            height    = positionGd.height;

        //  Convert the RADIANS to DEGREES for pretty printing (appends "N", "S", "E", "W". etc).
        var longitudeStr = satellite.degreesLong(longitude),
            latitudeStr  = satellite.degreesLat(latitude);

        console.log(longitudeStr,latitudeStr,height);

})
*/