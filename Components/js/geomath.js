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
    return a*Math.sqrt(1-e1*Haversine(2*fi));
}

function captureRadius(fi,roll,h){
    return Math.asin((1+h/rEarth(fi))*Math.sin(roll))-roll;
    //return Math.asin(h/rEarth(fi)*Math.tan(roll));
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

function fb2p(x) {
    while(x>Math.PI)
        x-=2*Math.PI;
    while(x<-Math.PI)
        x+=2*Math.PI;
    return x;
}

function f2q(x,q) {
    var d = Math.round(x/q);
    var r = x-d*q;
    var p = {
        d: 2*Math.PI*d,
        r: r,
        near: false
    };
    return p;
}

function fmod(x,q) {
    var d = Math.floor(x/q);
    return x-d*q;
}

function arcsin(x) {
    if(Math.abs(x)<=1)
        return Math.asin(x);
    else if (x>1)
        return 0.5*Math.PI + Math.asin(x-1);
    else
        return -0.5*Math.PI + Math.asin(x+1);
}

function arccos(x) {
    if(Math.abs(x)<=1)
        return Math.acos(x);
    else if (x>1)
        return Math.acos(2-x);
    else
        return Math.acos(-2-x);
}

function div(a,q) {
    return Math.floor(a/q);
}

function JulianDate(date) {
    var JD = {
        UT: date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600,
        d: 0
    };
    //JD.d = 367*date.getUTCFullYear() - 7*div(date.getUTCFullYear() + div(date.getUTCMonth()+9,12),4) + 275*div(date.getUTCMonth(),9)
    //    + date.getUTCDate() - 730530 + JD.UT/24;
    var base = new Date("2000-01-01T00:00:00Z");
    JD.d = (date.getTime() - base.getTime())/24/3600/1000;
    //console.log(d);
    //console.log(JD);
    return JD;
}

function SunPos(d){
    var deg2rad = Math.PI/180;
    var ecl = deg2rad*(23.4393 - 3.563E-7 * d);
    var w = deg2rad*(282.9404 + 4.70935E-5 * d),
    e = 0.016709 - 1.151E-9 * d,
    M = deg2rad*(356.0470 + 0.9856002585 * d);

    var E =  M + e * Math.sin(M) * ( 1.0 + e * Math.cos(M) );
    var xv = Math.cos(E) - e,
    yv = Math.sqrt(1.0 - e*e) * Math.sin(E);

    var v = Math.atan2( yv, xv ),
    r = Math.sqrt( xv*xv + yv*yv );

    var lonsun = v+w;

    var xs = r * Math.cos(lonsun),
    ys = r * Math.sin(lonsun);

    var xe = xs,
    ye = ys * Math.cos(ecl),
    ze = ys * Math.sin(ecl);

    var pos = {
        LS: lonsun,
        RA: Math.atan2(ye, xe),
        Decl: Math.atan2(ze, Math.sqrt(xe * xe + ye * ye))
    };
    return pos;
}

function SideralTime(Ls,UT,lng) {
    var GMST0 = Ls + Math.PI;
    var GMST = GMST0 + UT*Math.PI/12;
    return GMST + lng;

}

function SunAngles(date,pos) {
    var JD = JulianDate(date);
    var Sun = SunPos(JD.d);
   // console.log(Sun);
    var LST = SideralTime(Sun.LS,JD.UT,pos.longitude);
    var HA = LST - Sun.RA;
    var x = Math.cos(HA) * Math.cos(Sun.Decl),
    y = Math.sin(HA) * Math.cos(Sun.Decl),
    z = Math.sin(Sun.Decl);

    var xhor = x * Math.sin(pos.latitude) - z * Math.cos(pos.latitude),
    yhor = y,
    zhor = x * Math.cos(pos.latitude) + z * Math.sin(pos.latitude);

    //var az  = Math.atan2( yhor, xhor ) + Math.PI,
    //alt = Math.asin( zhor );

    return Math.atan2( zhor, Math.sqrt(xhor*xhor+yhor*yhor) );
    //Math.asin( zhor );
}

function scalarSphere(lat1,lat2,lng1,lng2){
    return Math.sin(lat1)*Math.sin(lat2)+Math.cos(lat1)*Math.cos(lat2)*Math.cos(lng2-lng1);
}
