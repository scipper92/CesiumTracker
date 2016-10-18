/**
 * Created by a.zhakypov on 10.10.2016.
 */

function Haversine(x){
    return (1-Math.cos(x))/2.;
}

function distEarth(A,B){
    var ab = 2*Math.asin(Math.sqrt(Haversine(B[0]-A[0])+Math.cos(A[0])*Math.cos(B[0])*Haversine(B[1]-A[1])));
    //   var r = rEarth((A[0]+B[0])/2.);
    return ab;
}

function distEarthLatLng(A,B){
    //var c = Math.PI/180.;
    //var ab = rEarth( (A.lat + B.lat)/2 )*2*Math.asin(Math.sqrt(Haversine(B.lat- A.lat)+Math.cos( A.lat)*Math.cos(B.lat)*Haversine(B.lng - A.lng)));
    var ab = 2*Math.asin(Math.sqrt(Haversine(B.latitude- A.latitude)+Math.cos( A.latitude)*Math.cos(B.latitude)*Haversine(B.longitude - A.longitude)));
    return ab;
}

function sgn(x) {
    return (x > 0) - (x < 0);
}

function azimut(A,B){
  //  var c = Math.PI/180.;
    return Math.atan(Math.cos(A[0])*Math.tan(B[0])/Math.sin(B[1]-A[1])-Math.sin(A[0])/Math.tan(B[1]-A[1]));
}

function rEarth(fi){
   // var c = Math.PI/180.;
    var f = 298.257223563;
    var e1 = (2-1/f)/f;
    var a = 6378.137;
    return a*Math.sqrt(1-e1)/(1-e1*Haversine(2*fi));
}

function captureRadius(fi,roll,h){
    return Math.asin((1+h/rEarth(fi))*Math.sin(roll))-roll;
}

function fabs(x,q) {
    var d = Math.round(x/q);
    var r = Math.abs(x-d*q);
    var p = {
        d: 2*Math.PI*d,
        r: r
    };
    return p;
}

function fmod(x,q) {
    var d = Math.floor(x/q);
    return x-d*q;
}