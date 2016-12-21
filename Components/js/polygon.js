/**
 * Created by a.zhakypov on 21.12.2016.
 */
function Polygon(lngStr,latStr) {
    var lng = lngStr.split(","),
        lat = latStr.split(",");
    this.north = -90;
    this.south = 90;
    this.east = -180;
    this.west = 180;
    this.longitude = [];
    this.latitude = [];
    this.isForNorth = function (sat) {
        return sat.position.latitude - this.north > 2*sat.capture && sat.vz<0;
    };
    this.isBackNorth = function (sat) {
        return sat.position.latitude - this.north > sat.capture && sat.vz>0;
    };
    this.isForSouth = function (sat) {
        return sat.position.latitude - this.south < -2*sat.capture && sat.vz>0;
    };
    this.isBackSouth = function (sat) {
        return sat.position.latitude - this.south < -sat.capture && sat.vz<0;
    };
    this.isFarEast = function (sat,incl) {
        var b = this.captFromEast(sat,incl);
        return sat.position.longitude > this.east + b + sat.capture;
    };
    this.isFarWest = function (sat,incl) {
        var b = this.captFromEast(sat,incl);
        return sat.position.longitude < this.west - b - sat.capture;
    };
    this.captFromEast = function (sat,incl) {
        var a = sat.vz>0 ? this.north + sat.capture - sat.position.latitude : sat.position.latitude - this.south - sat.capture;
        return Math.asin(Math.sin(a)*Math.sqrt(1-incl*incl)/incl);
    };
    this.isInside = function (sat) {
        for(var i=0;i<this.supC.length;i++){
            if(this.supLat[i]*sat.position.latitude+this.supLng[i]*sat.position.longitude > this.supC[i]+sat.capture)
                return false;
        }
        return true;
    };
    this.closeExtSide = function(sat){
        var closeSide = {
            index: -1,
            dist: 100
        };
        for(var i=0;i<this.supC.length;i++){
            var dist = this.supLat[i]*sat.position.latitude+this.supLng[i]*sat.position.longitude - this.supC[i];
            //console.log("dist from "+i+" = "+dist);
            if(dist>0 && dist<closeSide.dist){
                closeSide.index = i;
                closeSide.dist = dist;
            }
        }
        return closeSide;
    };
    for(var i=0;i<lng.length;i++){
        this.longitude[i] = deg2rad*lng[i];
        this.latitude[i] = deg2rad*lat[i];
        if(this.latitude[i]>this.north){
            this.north = this.latitude[i];
        }
        if(this.latitude[i]<this.south){
            this.south = this.latitude[i];
        }
        if(this.longitude[i]>this.east){
            this.east = this.longitude[i];
        }
        if(this.longitude[i]<this.west){
            this.west = this.longitude[i];
        }
    }
    if(lng.length<=1){
        this.isPoint = true;
    } else {
        this.isPoint = false;
        this.supLng = [];
        this.supLat = [];
        this.supC = [];
        var norm, tmpLng, tmpLat;
        for(i=0;i<lng.length-1;i++){
            tmpLng = this.latitude[i] - this.latitude[i+1];
            tmpLat = this.longitude[i+1] - this.longitude[i];
            norm = Math.sqrt(tmpLat*tmpLat + tmpLng*tmpLng);
            this.supLng[i] = tmpLng/norm;
            this.supLat[i] = tmpLat/norm;
            this.supC[i] = this.supLat[i]*this.latitude[i] + this.supLng[i]*this.longitude[i];
        }
        tmpLng = this.latitude[i] - this.latitude[0];
        tmpLat = this.longitude[0] - this.longitude[i];
        norm = Math.sqrt(tmpLat*tmpLat + tmpLng*tmpLng);
        this.supLng[i] = tmpLng/norm;
        this.supLat[i] = tmpLat/norm;
        this.supC[i] = this.supLat[i]*this.latitude[i] + this.supLng[i]*this.longitude[i];
    }
}
