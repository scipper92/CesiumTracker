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
            //if(scalarSphere(this.supLat[i],sat.position.latitude,this.supLng[i],sat.position.longitude) > this.supC[i]+sat.capture)
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
            //var dist = scalarSphere(this.supLat[i],sat.position.latitude,this.supLng[i],sat.position.longitude)-this.supC[i];
            //console.log("dist from "+i+" = "+dist);
            if(dist>0 && dist<closeSide.dist){
                closeSide.index = i;
                closeSide.dist = dist;
            }
        }
        return closeSide;
    };

    this.surRect = function (inclN,lineWidth) {
        var inclK = {
            latitude: inclN.longitude,
            longitude: -inclN.latitude
        };
        var rect = {
            right: 0,
            left: 0,
            top: 0,
            bottom: 0
        };
        var maxC = {
            right: this.latitude[0]*inclN.latitude + this.longitude[0]*inclN.longitude,// scalarSphere(this.latitude[0],inclN.latitude,this.longitude[0],inclN.longitude),
            top: this.latitude[0]*inclK.latitude + this.longitude[0]*inclK.longitude// scalarSphere(this.latitude[0],inclK.latitude,this.longitude[0],inclK.longitude)
        };
        var minC = Object.assign({},maxC);
        for(var i=1;i<this.latitude.length;i++){
            var tmpRigth = this.latitude[i]*inclN.latitude + this.longitude[i]*inclN.longitude,// scalarSphere(this.latitude[i],inclN.latitude,this.longitude[i],inclN.longitude),
                tmpTop = this.latitude[i]*inclK.latitude + this.longitude[i]*inclK.longitude;// scalarSphere(this.latitude[i],inclK.latitude,this.longitude[i],inclK.longitude);
            if(tmpRigth>maxC.right){
                rect.right = i;
                maxC.right = tmpRigth;
            } else if (tmpRigth<minC.right){
                rect.left = i;
                minC.right = tmpRigth;
            }
            if(tmpTop>maxC.top){
                rect.top = i;
                maxC.top = tmpTop;
            } else if (tmpTop<minC.top) {
                rect.bottom = i;
                minC.top = tmpTop;
            }
        }
        //var inclNsqr = 1.,//inclN.latitude*inclN.latitude + inclN.longitude*inclN.longitude,
        var bottomProj = this.latitude[rect.bottom]*inclN.latitude + this.longitude[rect.bottom]*inclN.longitude;// scalarSphere(this.latitude[rect.bottom],inclN.latitude,this.longitude[rect.bottom],inclN.longitude);
        var aRight = maxC.right - bottomProj/*inclNsqr*/, aLeft = minC.right - bottomProj/*inclNsqr*/;
        var br = {
            latitude: this.latitude[rect.bottom] + aRight*inclN.latitude,
            longitude: this.longitude[rect.bottom] + aRight*inclN.longitude
        },
            bl = {
            latitude: this.latitude[rect.bottom] + aLeft*inclN.latitude,
            longitude: this.longitude[rect.bottom] + aLeft*inclN.longitude
        };
        console.log(rect,br,bl);/*
        console.log(maxC,br.latitude*inclN.latitude+br.longitude*inclN.longitude);
        console.log(minC,bl.latitude*inclN.latitude+bl.longitude*inclN.longitude);*/
        var delta = lineWidth/rEarth(br.latitude);
        var bottomLen = ((br.latitude-bl.latitude)*inclN.latitude+(br.longitude-bl.longitude)*inclN.longitude);//Math.sqrt(inclNsqr);//distEarthLatLng(bl,br);
        var numTicks = Math.ceil(bottomLen/delta);
        console.log(delta,bottomLen,numTicks);
        delta = bottomLen/numTicks;/*
        var ticks = [];
        ticks.push({
            longitude: br.longitude - 0.5*delta*inclN.longitude,
            latitude: br.latitude - 0.5*delta*inclN.latitude
        });
        for(i=0;i<numTicks-1;i++){
            ticks.push({
                longitude: ticks[i].longitude - delta*inclN.longitude,
                latitude: ticks[i].latitude - delta*inclN.latitude
            });
        }
        console.log(ticks);*/
        var tick = {
            longitude: br.longitude - 0.5*delta*inclN.longitude,
            latitude: br.latitude - 0.5*delta*inclN.latitude
        };
        var j0 = rect.right, k0 = rect.right;
        var j1 = (j0+1) % this.latitude.length, k1 = (k0-1+this.latitude.length) % this.latitude.length;
        var strips = [];
        for(i=0;i<numTicks;i++){
            var det = inclK.latitude*(this.longitude[j0]-this.longitude[j1])-inclK.longitude*(this.latitude[j0]-this.latitude[j1]);
            var alpha = ((this.longitude[j0]-tick.longitude)*inclK.latitude-(this.latitude[j0]-tick.latitude)*inclK.longitude)/det;
            while(alpha<0 || alpha>1){
                j0 = j1;
                j1 = (j0+1) % this.latitude.length;
                det = inclK.latitude*(this.longitude[j0]-this.longitude[j1])-inclK.longitude*(this.latitude[j0]-this.latitude[j1]);
                alpha = ((this.longitude[j0]-tick.longitude)*inclK.latitude-(this.latitude[j0]-tick.latitude)*inclK.longitude)/det;
            }
            var tmp0 = {
                latitude: alpha*this.latitude[j1]+(1-alpha)*this.latitude[j0]-delta*inclK.latitude,
                longitude: alpha*this.longitude[j1]+(1-alpha)*this.longitude[j0]-delta*inclK.longitude
            };
            det = inclK.latitude*(this.longitude[k0]-this.longitude[k1])-inclK.longitude*(this.latitude[k0]-this.latitude[k1]);
            alpha = ((this.longitude[k0]-tick.longitude)*inclK.latitude-(this.latitude[k0]-tick.latitude)*inclK.longitude)/det;
            while(alpha<0 || alpha>1) {
                k0 = k1;
                k1 = (k0-1+this.latitude.length) % this.latitude.length;
                det = inclK.latitude*(this.longitude[k0]-this.longitude[k1])-inclK.longitude*(this.latitude[k0]-this.latitude[k1]);
                alpha = ((this.longitude[k0]-tick.longitude)*inclK.latitude-(this.latitude[k0]-tick.latitude)*inclK.longitude)/det;
            }
            var tmp1 = {
                latitude: alpha*this.latitude[k1]+(1-alpha)*this.latitude[k0]+delta*inclK.latitude,
                longitude: alpha*this.longitude[k1]+(1-alpha)*this.longitude[k0]+delta*inclK.longitude
            };
            strips.push({
                bottom: tmp0,
                top: tmp1,
                passDate: null,
                passCount: 0,
                hyperplane: tmp1.latitude*inclN.latitude + tmp1.longitude*inclN.longitude
            });
            tick.longitude -= delta*inclN.longitude;
            tick.latitude -= delta*inclN.latitude;
        }
        return strips;
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
