import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, IonicPage, NavParams, Platform } from 'ionic-angular';

import { HomePage } from '../home/home';

import { BeaconService } from '../../services/beaconservice';

@Component({
    selector: 'page-parkinMap',
    templateUrl: 'parkingMap.html'
  })

export class ParkingPage
{
  public routeState = 'off';
  public listViewState = 'out';
  public inforViewState = 'out';
  public levelViewState = 'in';
  public mapViewState = 'on';
  public mapLoadState = 'on';
  public positionState = 'on';
  public centerViewState = 'on';

  public roomsListView: any[] = [];
  public roomsListViewBackup: any[] = [];
  public allPoints: any[] = [];
  public attributes = {name: "", type: "", desc: "", position: "", building: "", level: ""};

  public marker;
  public polygon;
  public positionMarker;

  // routing elements
  public polygons: any[] = [];
  public routingPolygons: any[] = [];
  public roomMarkers: any[] = [];
  public markersLevel: any[] = [];
  public markersRemain: any[] = [];
  public markersPathsLevel: any[] = [];
  public markersPathsRemain: any[][] = [];
  public routingPolylineLevelPosition;
  public routingPolylineLevel;
  public routingPolylinesRemain: any[] = [];
  public routingPathsLevelPosition: any[] = [];
  public routingPathsLevel: any[] = [];
  public routingPathsRemain: any[][] = [];
  public routingLevels: any[][] = [];

  // testing
  public routingLevel: any[] = [];
  public routingLevelsRemain: any[] = [];

  // beacon variables
  public beacons: any[] = [];
  public tricons: any[] = [];
  
  // location variables
  public previousBuilding;
  public previousLevel;
  public currentPosition = null;
  public currentBuilding = "";    
  public currentLevel = 0;
  public currentAttr;
  public currentCoords;
  public currentPoints;

  // logging
  public checkLog;

  parkingMap: any;

    positioningMode: any = 2; //1 - exact dominant beacon, 2 - trilateration
    plForm = "Unknown";
    deviceId = 'NA';
    dominantHistory = [];

    pages = [
      { pageName: 'HomePage', title: "Map", icon:"map", id:"mapTab"},
      { pageName: 'ParkingPage', title: "Parking", icon:"car", id:"parkTab"}
    ];

    constructor(public navCtrl: NavController, public beaconService: BeaconService, public navParams: NavParams, public platform : Platform) {
      this.parkingMap = this.navParams.get('pMap');

  }

  LoadBeacons()
  {
  
  }


  ionViewDidLoad()
  {
    this.platform.ready().then(() => {
      this.beaconService.setupBeacons();
      this.beaconService.startRangingBeacons();

      /*
      setInterval(() => {
        this.checkBeacons();
        this.getCurrentPosition();
        if(this.routeState == 'on' && this.routinglevel.length > 0) this.updateRoute();
      }, 3000); */
    });
  }

  public initRoomListView()
  {

  }

  public checkBeacons() {
    try {
      this.beacons = this.beaconService.getBeacons();
      this.beaconService.cleanBeacons();
    } catch(e) {

    }
  }

  public getCurrentPosition()
  {
    
  }


  onCompassSucess(heading) {

  }

  /*



        <polygon points="{{x-8}},{{y}} {{x+8}},{{y}} {{x}},{{y-16}}" stroke="red" stroke-width="1" fill="yellow"
        transform="rotate({{degree}} {{x}},{{y}})" />
     
        <circle cx="{{x}}" cy="{{y}}" r="8" stroke="red" stroke-width="2" fill="yellow">
         <animate
        attributeType="XML"
        attributeName="fill"
        values="#ff0;#ff0;#f00;#fff"
        dur="1.0s"
        repeatCount="indefinite"/>
       </circle>
       <polyline visibility="{{pathVisibility}}" points="{{pathPoints}}" stroke-dasharray="5,5" style="fill:none;stroke:blue;stroke-width:3" marker-end="url(#arrow)"  />
       

       
       <polyline visibility="{{beaconsVisibility}}" points="{{beaconAllPoints}}" fill="none" stroke="none" stroke-width="2" marker-start="url(#CircleMark)" marker-mid="url(#CircleMark)" marker-end="url(#CircleMark)"  />
      




  */

  
}