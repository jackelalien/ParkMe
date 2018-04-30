import { KalmanService } from './kalmanservice';
import { Injectable } from '@angular/core';
import { IBeacon } from '@ionic-native/ibeacon';
import { Observable } from 'rxjs/Observable';

import * as beaconData from '../assets/data/beacondata.json';


//In IonViewDidLoad, on this.platform.ready().then(() => )
//Init room list view, call setup beacons, start rangin beacons

@Injectable()
export class iBeaconManager {
    public positioningMode : number = 2;
    public platform : any = "Unknown";
    public deviceId : any = "NA";

    public dominantHistory = [];
    public startingImage : any;

    public beaconPoints : Array<any>;
    public routeConnectors : Array<any>;

    public rssiHistory: any[] = [];
    public historyCount : number = 5;
    public currentRSSI;


    AddBeaconPoint(x1: number, y1: number) { this.beaconPoints.push({ x: x1, y: y1 }); }

    AddRoutePoint(x1: number, y1: number){ this.routeConnectors.push({x: x1, y: y1}); }

    GetDistance(rssi : any)
    {
        var A0 = -55;
        var n = 3.3;
        if(rssi == 0) return -1;
        else
        {
            var p = (rssi - A0)/(-10*n);
    		var d = Math.pow(10, p);
    		var c = d.toFixed(1);
    		return c;
        }
    }

    



}