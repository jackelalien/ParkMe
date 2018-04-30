import { KalmanService } from './kalmanservice';
import { Injectable } from '@angular/core';
import { IBeacon } from '@ionic-native/ibeacon';
import { Observable } from 'rxjs/Observable';

import * as beaconData from '../assets/data/beacondata.json';

@Injectable()
export class BeaconService {

    public beacons: any[] = [];
    public beaconDataStr: any[] = [];
    public rssis: any[] = [];
    public currentRSSI;
    public currentPositionBeacon: any;

    

    constructor(private iBeacon: IBeacon)
    {
        for(let i = 0; i < beaconData.beacons.length; i++)
        {
            this.beaconDataStr.push({identifier : beaconData.beacons[i].identifer, coordinates: beaconData.beacons[i].coordinates});
            
        }
    }

    public setupBeacons()
    {
        this.iBeacon.requestAlwaysAuthorization();

        let delegate = this.iBeacon.Delegate();

        delegate.didDetermineStateForRegion().subscribe
        (
          data => console.log('didDetermineStateForRegion: ', data),
          error => console.error()
        );

        delegate.didStartMonitoringForRegion().subscribe
        (
            data => console.log("didStartMonitoringForRegion: ", data),
            error => console.error()
        );

        delegate.didRangeBeaconsInRegion().subscribe
        (
            data => {
                let region = data.region;
                let beacon = data.beacons;

                //Checks for current beacons array
                if(typeof beacon[0] == 'undefined') {
                    try {
                        let index = this.beacons.map(function(e) { return e.identifier; }).indexOf(region.identifier);
                        if(index != -1) this.beacons.splice(index, 1);
                    } catch(e) { console.error("ERROR: " + e); }

                    let indexData;
                    try { indexData = this.beaconDataStr.map(function(e) { return e.identifier; }).indexOf(region.identifier); }
                    catch(e) { console.error("ERR: " + e); }

                    for(let x in this.rssis) {
                        let rssiK = 0;
                        let distanceK = "";

                        if(this.rssis[x].id==region.identifier)
                        {
                            if (this.rssis[x].rssis.length < 20) {
                                this.rssis[x].rssis.push(beacon[0].rssi);
                            }
                            else {
                                this.rssis[x].rssis.splice(0, 1);
                                this.rssis[x].rssis.push(beacon[0].rssi);
                            }
                            if (this.rssis[x].rssis.length > 0) {
                                let kalman = new KalmanService();
                                let dataConstantKalman = this.rssis[x].rssis.map(function(v) {
                                    return kalman.filter(v, 2, 10, 1, 0, 1);
                                });
                                let index = dataConstantKalman.length - 1;
                                rssiK = dataConstantKalman[index].toFixed(2);
                                distanceK = (Math.pow(10, (beacon[0].tx - rssiK) / (10 * 3))).toFixed(2);
                            }   
                            
                            this.beacons.push({identifier: region.identifier,
                                tx: beacon[0].tx,
                                rssi: beacon[0].rssi,
                                rssiK: rssiK,
                                distance: distanceK,
                                coordinates: this.beaconDataStr[indexData].coordinates});
                            break;
                        }
                    }

                }
            },
            error => console.error()
        );

        this.iBeacon.setDelegate(delegate);
    }

    public startRangingBeacons()
    {
        console.log("Started Ranging");
        for(let i = 0; i < beaconData.beacons.length; i++)
        {
            let beaconRegion = this.iBeacon.BeaconRegion(
                beaconData.beacons[i].identifier,
                beaconData.beacons[i].uuid,
                beaconData.beacons[i].major,
                beaconData.beacons[i].minor
            );
            this.iBeacon.startRangingBeaconsInRegion(beaconRegion)
            .then(
                () => console.log("Native layer received the request to monitoring: " + beaconData.beacons[i].identifier),
                error => console.error("native layer failed to begin monitoring: ", error)
            );
            this.rssis.push({id: beaconData.beacons[i].identifier, rssis: []});
            console.log("Setup: " + beaconData.beacons[i].identifier);
        }
    }

    public startRangingBeacon() {
        let beaconRegion = this.iBeacon.BeaconRegion(
            beaconData.beacons[1].identifier,
            beaconData.beacons[1].uuid,
            beaconData.beacons[1].major,
            beaconData.beacons[1].minor
        );

        this.iBeacon.startRangingBeaconsInRegion(beaconRegion)
        .then(
                () => console.log('Native layer recieved the request to monitoring'),
                error => console.error('Native layer failed to begin monitoring: ', error)
        );
    }

    public stopRangingBeacons()
    {
        for (let i = 0; i < beaconData.beacons.length; i++) {
            let beaconRegion = this.iBeacon.BeaconRegion(
              beaconData.beacons[i].identifier,
              beaconData.beacons[i].uuid,
              beaconData.beacons[i].major,
              beaconData.beacons[i].minor);
            this.iBeacon.stopRangingBeaconsInRegion(beaconRegion)
            .then(
                () => console.log('Native layer recieved the request to monitoring'),
                error => console.error('Native layer failed to begin monitoring: ', error)
            );
            
        }
    }

    public cleanBeacons() {
        this.beacons = [];
    }

    public getBeacons() {
        return this.beacons;
    }

   

}