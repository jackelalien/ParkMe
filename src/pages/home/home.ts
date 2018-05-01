import { Component, ViewChild, ElementRef } from '@angular/core';
import { AlertController, Platform, LoadingController, IonicPage, NavController, NavParams } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { ParkingPage } from '../parkingMap/parkingMap';
import { HttpClient } from '@angular/common/http';

import { BeaconService } from '../../services/beaconservice';
import { DatabaseService } from '../../services/databaseservice';
import { MapService } from '../../services/mapservice';
import { MotionService } from '../../services/motionservice';
import { RoutingService } from '../../services/routingservice';

declare var google;

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [DatabaseService]
})
export class HomePage {


  public routeState = 'off';
  public listViewState = 'out';
  public infoViewState = 'out';
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

  selectedTab=0;

  tab1Root = HomePage;
  tab2Root = ParkingPage;

  @ViewChild('map') mapElement: ElementRef;
  map: any;
  start = 'chicago, il';
  end = 'chicago, il';
  value: any;
  currentKML: any;
  hideMe: Boolean = true;
  hasKML: Boolean = false;
  IsCity: Boolean = false;
  markers: Array<any> = [];
  searchItems: string[];
  kmlData: any;
  owner: any;
  

  items : Array<any> = [];
  
  directionsService = new google.maps.DirectionsService;
  directionsDisplay = new google.maps.DirectionsRenderer;


  constructor(public navCtrl: NavController,
              public alertCtrl: AlertController, 
              public navParams: NavParams, 
              public geolocation: Geolocation, 
              public http: HttpClient,
              public loadCtrl: LoadingController,
                public platform: Platform,
                public beaconService: BeaconService,                
                public dbService: DatabaseService,
                public mapService: MapService,
                public motionService: MotionService,
                public routingService: RoutingService) {

    if(navParams.get('KMLData') != null)
    {
      this.kmlData = navParams.get('KMLData');
      this.owner = navParams.get('Owner');
      this.IsCity = navParams.get('IsCity');
      this.hasKML = true;
    }
  
  }

  onTabSelect(ev: any)
  {
    this.selectedTab = ev.index;
  }
  
  ionViewDidLoad(){
    setTimeout(() => {
      this.initMap();
    }, 1000);

    
  }
  


  initMap() {

    this.mapLoadState = 'off';
        let loader = this.loadCtrl.create({
            content: "Karte wird geladen...",
        });
        loader.present();

        this.mapViewState = 'off';
        console.log("Load map styles.");
    
    var me = this;

    this.geolocation.getCurrentPosition().then((position) => {
      let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      let mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
      
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
      
      // Zoom changed listener
        google.maps.event.addListener(this.map, 'zoom_changed', () => {
            if (this.positionMarker != null) this.positionMarker.setIcon(this.positionMarker.getIcon().url, this.mapService.getCustomMarkerSize(this.getMapZoom()));
            if (this.marker != null) this.marker.setIcon(this.mapService.getCustomMarkerIcon(this.marker.getIcon().url, this.mapService.getRouteMarkerSize(this.getMapZoom())));
            for (let x in this.roomMarkers) {                    
                this.roomMarkers[x].setIcon(this.mapService.getCustomMarkerIcon(this.roomMarkers[x].getIcon().url, this.mapService.getCustomMarkerSize(this.getMapZoom())));
            }
        });

        google.maps.event.addListener(this.map, 'click', (event) => {            
            this.positionState = 'off';
            this.currentPosition = {lat: event.latLng.lat(), lng: event.latLng.lng()};
            if (this.infoViewState = 'in') this.toggleInfoView();
            if (this.routeState == 'off') this.cleanRouteElements();
        });

      var connStr = "";
      if(this.hasKML)
      {
        var oS = "City";
        if(!this.IsCity)
        {
            oS = "Other";
        }
        this.currentKML = new google.maps.KmlLayer(
          {
            url: 'http://74.80.63.146/maps/KML/' + oS + '/' + this.owner + "/" + this.kmlData + ".kml",
            map: this.map
          }
        );

        this.currentKML.addListener('click', function(kmlEvent) { 
  
          
          me.start = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          me.end = kmlEvent.latLng;
          me.hideMe = true;
            //alert(me.start + " " + me.end);
        });
      }
      else
      {
        connStr = 'http://74.80.63.146/GetCityKML.php?lat=' + position.coords.latitude + '&long=' + position.coords.longitude;
      
        this.http.get(connStr).subscribe ((data: any) => {

          this.items = data;
  
          this.currentKML = new google.maps.KmlLayer(
            {
              url: 'http://74.80.63.146/maps/KML/City/' + this.items[0].Owner_Name + "/" + this.items[0].Name + ".kml",
              map: this.map
            }
          );

          this.currentKML.addListener('click', function(kmlEvent) { 

            me.start = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            me.end = kmlEvent.latLng;
            me.hideMe = true;
              
          });

        }, (err: any) =>
      {
        console.dir(err);
        this.value= err.message + " / " + connStr;
        
      });
      
      }
      
      //Load up nearest City KML from Database
      //Connect to DB and find nearest city

    }, (err) => {
      alert(err);

      let mapOptions = {
        center: {lat: 41.85, lng: -87.65},
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
      
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

      this.http.get('http://74.80.63.146/GetCityKML.php?lat=0&long=0' ).subscribe ((data: any) => {

        this.items = data;

        this.currentKML = new google.maps.KmlLayer(
          {
            url: 'http://74.80.63.146/maps/KML/City/' + this.items[0].Owner_Name + "/" + this.items[0].Name + ".kml",
            map: this.map
          }
        );

        //this.map.event.addListener(this.currentKML, 'click', function() {
        //    this.value = "LISTENING";
        //});

        this.currentKML.addListener('click', function(kmlEvent) {
            //this.start = position;
            this.end = kmlEvent.latLng;
            //this.value = "CLICK";
        });

      }, (err: any) => {
      console.dir(err);
      this.value= err.message;
      
    });
      

    });

    this.geolocation.watchPosition().subscribe((position) => {
      let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      let mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
      
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
    });
    
    this.directionsDisplay.setMap(this.map);



         // reset map elements
        if (this.polygons != null) {
            for (let x in this.polygons) this.polygons[x].setMap(null);
            this.polygons = [];
        }
        if (this.roomMarkers != null) {
            for (let x in this.roomMarkers) this.roomMarkers[x].setMap(null);
            this.roomMarkers = [];
        }     
        
        // get level attributes
        
        let tables = this.dbService.getCurrentLotTables(this.currentBuilding, this.currentLevel);
        this.currentAttr = tables.attr;
        this.currentCoords = tables.coords;
        this.currentPoints = tables.points;

        if (this.currentAttr != null && this.currentLevel != null) {   
            // SQLite code with observable    
            this.dbService.getCurrentAttrCoords(this.currentAttr, this.currentCoords).subscribe(data => {
                console.log("Loading map polygons.");
                for (let x in data) {
                    let lot: any = {};
                    let paths: any[] = [];

                    lot = data[x];

                    let allCoordinates = lot.coordinates;
                    let coordinates: String[] = allCoordinates.split("; ");

                    // split all coordinates to LatLng paths
                    paths = this.mapService.splitCoordinatesToLatLng(coordinates);                    

                    let polygon = this.mapService.createPolygonRoomOptions(paths, lot.type);
                    polygon.setMap(this.map);

                    this.polygons.push(polygon);

                    if (lot.type == "park") {
                        google.maps.event.addListener(polygon, 'click', (event) => {
                            let attributes = {shapeid: lot.shapeid, name: lot.name, desc: lot.desc, lot: this.currentBuilding, level: this.currentLevel};
                            this.selectRoom(attributes);
                        })
                    }
                    // TESTING #############################################
                    if (lot.type == "direction") {
                        google.maps.event.addListener(polygon, 'click', (event) => {
                            this.positionState = 'off';
                            this.currentPosition = {lat: event.latLng.lat(), lng: event.latLng.lng()};
                            if (this.infoViewState = 'in') this.toggleInfoView();
                            if (this.routeState == 'off') this.cleanRouteElements();
                        })
                    }        

                    if (lot.type == "park") {                        
                        let customMarker = this.mapService.getIconForCustomMarker(lot.type, paths);
                        customMarker.setMap(this.map);
                        this.roomMarkers.push(customMarker); 
                        google.maps.event.addListener(customMarker, 'click', (event) => {
                            let attributes = {shapeid: lot.shapeid, name: lot.name, desc: lot.desc, lot: this.currentBuilding, level: this.currentLevel};
                            this.selectRoom(attributes);
                        })                                            
                    } 
                }   
                console.log("Polygons loaded: " + this.polygons.length + ", Custom markers: " + this.roomMarkers.length);                   
                    
                // Next level routing elements
                if (this.routeState == 'on' && this.routingLevelsRemain.length > 0) {
                    console.log("RoutingLevelsRemain.length: " + this.routingLevelsRemain.length);
                    for (let x in this.routingPolylinesRemain) this.routingPolylinesRemain[x].setMap(null);
                    for (let x in this.markersRemain) this.markersRemain[x].setMap(null);
                    this.markersRemain = [];
        
                    this.routingLevel.push(this.routingLevelsRemain[0][1], this.routingLevelsRemain[0][2]);
                    this.routingLevelsRemain.splice(0, 1);
        
                    this.createRoutingElements(this.routingLevel, this.routingLevelsRemain);
                    console.log("RoutingLevelsRemain.length: " + this.routingLevelsRemain.length);
                    /* if (this.routingLevelsRemain.length > 0) this.fitMapToMarkerBounds(3000);
                    else {
                        let center = new google.maps.LatLng(this.currentPosition.lat, this.currentPosition.lng);
                        this.map.panTo(center);
                        this.map.setZoom(20);
                    } */
                    this.fitMapToMarkerBounds(3000);
                }

                this.dbService.getAllBuildingsAttrCoords(this.currentBuilding).subscribe(data => {
                    console.log("Loading map buildings.");
                    let building: any = {};                
                    for (let x in data) {
                        let paths: any[] = [];
    
                        building = data[x];
    
                        let allCoordinates = building.coordinates;
                        let coordinates: String[] = allCoordinates.split(";");
    
                        paths = this.mapService.splitCoordinatesToLatLng(coordinates);                    
    
                        let polygon = this.mapService.createPolygonBuildingOptions(paths);
                        polygon.setMap(this.map);

                        google.maps.event.addListener(polygon, 'click', (event) => {
                            this.currentPosition = {lat: event.latLng.lat(), lng: event.latLng.lng()};
                            this.changeCurrentLevel(building.name, 0); // TESTING
                        })
                    }                    
                    loader.dismiss();
                    this.mapLoadState = 'on';
                })
            })              
        }
  }



  calculateAndDisplayRoute() {

    //this.hideMe=false;
    //alert(this.start + " " + this.end);
    
    for(var i = 0; i < this.markers.length; i++)
    {
      this.markers[i].setMap(null);
    }
    this.markers = [];

    var markerA = new google.maps.Marker({
      position: this.start,
      title: "Start",
      label: "A",
      map: this.map
    });
    this.markers.push(markerA);
    var markerB = new google.maps.Marker({
      position: this.end,
      title: "End",
      label: "B",
      map: this.map
    });
    this.markers.push(markerB);

    this.directionsService.route({

      
      origin: markerA.getPosition(),
      destination: markerB.getPosition(),
      travelMode: 'DRIVING'
    }, (response, status) => {
      if (status === 'OK') {
        this.directionsDisplay.setDirections(response);
        
      } else {
        alert('Directions request failed due to ' + status);
      }
    });
  }

//Retrieves current position from beacons or gps
public getCurrentPosition() {        
        this.checkLog += "Position-";
        if (this.positionState == "on") {
            if (this.beacons.length > 2) {
                this.currentPosition = this.getCurrentPositionBeacons(); 
                console.log(this.checkLog);              
            } else {
                this.mapService.getCurrentPositionGPS().subscribe(data => {
                    this.currentPosition = data;
                    this.checkLog += "GPS: " + this.currentPosition.lat + ", " + this.currentPosition.lng;                
                    console.log(this.checkLog);
                });            
            }              
        } 
        if (this.currentPosition != null && this.mapLoadState == 'on' && this.infoViewState == 'out' && this.centerViewState == 'on') {
            let center = new google.maps.LatLng(this.currentPosition.lat, this.currentPosition.lng);
            this.map.panTo(center);
        }
        if (this.currentPosition != null) {
            this.getCurrentBuilding();
            this.displayCurrentPosition();    
        }
    }

//Updates display of current user position
public displayCurrentPosition() {
        if (this.map != null) {
            let center = new google.maps.LatLng(this.currentPosition.lat, this.currentPosition.lng);
            if (this.positionMarker != null) this.positionMarker.setMap(null);  
            this.positionMarker = this.mapService.createCustomMarker(this.currentPosition, "./assets/icon/position.png", 16);            
            this.positionMarker.setMap(this.map);
            // if (this.mapViewState == 'on') this.map.panTo(center); // BUG? Uncaught RangeError: Maximum call stack size exceeded
        }
    }

//Checks for the current displayed building by current user position.
public getCurrentBuilding() {
        this.previousBuilding = this.currentBuilding;
        let buildings = this.dbService.getLotCentroids();
        let positionLatLng = new google.maps.LatLng(this.currentPosition.lat, this.currentPosition.lng);
        
        let buildingsSort = this.routingService.sortByDistance(buildings, positionLatLng);
        this.currentBuilding = buildingsSort[0].name;
        this.checkLog += ", Current Building: " + this.currentBuilding;  

        if (this.currentBuilding != this.previousBuilding || this.currentLevel != this.previousLevel) {
            /* let tables = this.dbService.getCurrentBuildingTables(this.currentBuilding, this.currentLevel);
            this.currentAttr = tables.attr;
            this.currentCoords = tables.coords;
            this.currentPoints = tables.points; */
            this.initMap();
            this.dbService.getCurrentPoints(this.currentPoints).subscribe(data => {
                this.allPoints = data;   
            });   
        }
        this.previousLevel = this.currentLevel;
    }

    public clickLevel(direction: any) {
        this.changeCurrentLevel(this.currentBuilding, this.currentLevel + direction);
    }


//Changes the current level on google map
public changeCurrentLevel(building: any, newLevel: any) {
        console.log("Change current level: " + this.currentLevel + ", " + newLevel);
        let buildingLevels = this.dbService.getLotLevels(this.currentBuilding);
        this.currentLevel = this.mapService.changeCurrentLevel(this.currentLevel, buildingLevels, newLevel);
        console.log("New current level: " + this.currentLevel);
        this.initMap();       
        this.previousLevel = this.currentLevel; 
    }

    public cleanPolygons(polygons: any) {
        console.log("Clean polygons.");
        if (polygons != null) {
            for (let x in polygons) polygons[x].polygon.setMap(null);
            return polygons = [];            
        }
    }

//Returns current zoom of google map
  public getMapZoom() {
        return this.map.getZoom();
    }

  //Filters ListView of all rooms
  public getRoomListView(event: any) {
        if (this.infoViewState == 'in') {
                this.toggleInfoView();
        }   
        if (this.roomsListViewBackup != null) this.roomsListView = this.roomsListViewBackup;

        let value = event.target.value;

        if (value && value.trim() != '') {    
            this.roomsListView = this.roomsListView.filter((room) => {
                return (room.name.toLowerCase().indexOf(value.toLowerCase()) > -1 || room.desc.toLowerCase().indexOf(value.toLowerCase()) > -1);
            })
            if (this.listViewState == 'out') {
                this.toggleListView();
            }
        } else {
            if (this.listViewState == 'in') {
                this.toggleListView();
            }
        }      
    }

//Selects room for routing and creates route marker
public selectRoom(room: any) {   
        this.cleanRouteElements();
        this.dbService.getRoomCoordinates(room.shapeid, room.building, room.level).subscribe(data => {
            let roomCentroid = this.mapService.getPolygonCentroid(data);
            let position = new google.maps.LatLng(parseFloat(roomCentroid.lat), parseFloat(roomCentroid.lng)); 

            this.attributes.name = room.name;
            this.attributes.desc = room.desc;
            this.attributes.building = room.building;
            this.attributes.level = room.level;
            this.attributes.position = roomCentroid;

            this.marker = this.mapService.createRouteMarker(position, "./assets/icon/marker.png", 48);
            this.marker.setMap(this.map);

            this.map.setZoom(18);
            this.map.panTo(position); // BUG: Uncaught RangeError: Maximum call stack size exceeded
            
            if (this.listViewState == 'in') this.toggleListView();
            if (this.infoViewState == 'out') this.toggleInfoView();
            //if (this.routeState == 'on') this.routeState = 'off'; clean elements
                        
        });  
    } 

//Checks if beacons are available in proximity
  public checkBeacons() {        
        try {
            this.beacons = this.beaconService.getBeacons();
            this.checkLog += "Beacons available: " + this.beacons.length + ", ";            
            this.beaconService.cleanBeacons();
        } catch(e) {
            console.log(e);
        }
    }

//Sets current position from beacons
   public getCurrentPositionBeacons() {
        this.tricons = [];
        for (let i = 0; i < 3; i++) {
            let latLngAlt = this.beacons[i].coordinates.split(", ");                
            this.tricons.push({lat: latLngAlt[0], lng: latLngAlt[1], distance: this.beacons[i].distance, elevation: latLngAlt[2]});         
        }    
        let triPoint: any = this.routingService.trilaterate(this.tricons);
        this.checkLog += "Beacons: " + triPoint.lat + ", " + triPoint.lng;
        return {lat: triPoint.lat, lng: triPoint.lng};        
    }


//Starts routing based on destination input
public startRouting(endName: String, endBuilding: String, endLevel: number, endPosition: any) {
        console.log("Start routing algorithm: " + endName + ", " + endBuilding + ", " + endLevel);
        let currentPosition = this.currentPosition;
        let currentPositionLatLng = new google.maps.LatLng(currentPosition.lat, currentPosition.lng);
        let endPositionLatLng = new google.maps.LatLng(endPosition.lat, endPosition.lng);
        let rPaths;
        this.routeState = 'on';
        //if (this.infoViewState = 'in') this.toggleInfoView();
        if (this.marker != null) this.marker.setMap(null);

        // Routing through multiple levels
        // 0    EndBuilding == CurrentBuilding && EndLevel == CurrentLevel
        if (endBuilding == this.currentBuilding && endLevel == this.currentLevel) { 
            this.dbService.getRoutingPolygonsPoints(this.currentBuilding, this.currentLevel).subscribe(data => {    
                let routingPolygonsRawSBSL = data[0];
                let routingPointsSBSL = data[1];    
                
                this.createRoutingPolygons(routingPolygonsRawSBSL);

                let rStartSBSL = this.routingService.getRouteStart(currentPosition, this.routingPolygons, routingPointsSBSL);
                let rEndSBSL = this.routingService.getRoutePointByName(routingPointsSBSL, endName);

                let rPathsLevel = this.routingService.createRouteInLevel(rStartSBSL, rEndSBSL, this.routingPolygons, routingPointsSBSL); 
                rPathsLevel.splice(0, 1); // removes current position for update, temporary
                let mLevelPos = new google.maps.LatLng(rEndSBSL.lat, rEndSBSL.lng);
                let mLevelUrl = "./assets/icon/marker.png";

                this.routingLevel.push(rPathsLevel, [mLevelPos, mLevelUrl]);
                this.createRoutingElements(this.routingLevel, null);
                console.log("RoutingLevelsRemain.length: " + this.routingLevelsRemain.length);
                
                this.fitMapToMarkerBounds(5000);
                /* if (this.infoViewState = 'in') this.toggleInfoView();
                let center = new google.maps.LatLng(this.currentPosition.lat, this.currentPosition.lng);
                this.map.panTo(center);
                this.map.setZoom(20); */
            });    

        // 1    EndBuilding == CurrentBuilding && EndLevel != CurrentLevel
        } else if (endBuilding == this.currentBuilding && endLevel != this.currentLevel) {
            console.log("1: endBuilding: " + endBuilding + " == this.currentBuilding: " + this.currentBuilding + " && endLevel: " + endLevel + " != this.currentLevel: " + this.currentLevel);  

            // start building, start level
            this.dbService.getRoutingPolygonsPoints(this.currentBuilding, this.currentLevel).subscribe(data => {    
                let routingPolygonsRawSBSL = data[0];
                let routingPointsSBSL = data[1];

                this.createRoutingPolygons(routingPolygonsRawSBSL);

                let rStartSBSL = this.routingService.getRouteStart(currentPosition, this.routingPolygons, routingPointsSBSL);
                let rEndSBSL = this.routingService.getRoutePointByType(routingPointsSBSL, "staircase", currentPositionLatLng);

                let rPathsLevel = this.routingService.createRouteInLevel(rStartSBSL, rEndSBSL, this.routingPolygons, routingPointsSBSL); 
                rPathsLevel.splice(0, 1); // removes current position for update, temporary
                let mLevelPos = new google.maps.LatLng(rEndSBSL.lat, rEndSBSL.lng);
                let mLevelUrl = "./assets/icon/markerChange.png";
                
                this.routingLevel.push(rPathsLevel, [mLevelPos, mLevelUrl]);

                // start building, end level
                this.dbService.getRoutingPolygonsPoints(this.currentBuilding, endLevel).subscribe(dataEL => {        
                    let routingPolygonsRawSBEL = dataEL[0];
                    let routingPointsSBEL = dataEL[1];

                    this.createRoutingPolygons(routingPolygonsRawSBEL);
                    
                    let rStartSBEL = this.routingService.getRoutePointByRouteId(routingPointsSBEL, rEndSBSL.routing);
                    let rEndSBEL = this.routingService.getRoutePointByName(routingPointsSBEL, endName);

                    let rPaths = this.routingService.createRouteInLevel(rStartSBEL, rEndSBEL, this.routingPolygons, routingPointsSBEL); 
    
                    let mPos = new google.maps.LatLng(rEndSBEL.lat, rEndSBEL.lng);
                    let mUrl = "./assets/icon/marker.png";

                    this.routingLevelsRemain.push([[this.currentBuilding, endLevel], rPaths, [mPos, mUrl]]);
                    this.createRoutingElements(this.routingLevel, this.routingLevelsRemain);
                    console.log("RoutingLevelsRemain.length: " + this.routingLevelsRemain.length);
                    this.fitMapToMarkerBounds(5000);
                });
            });
        // 2    EndBuilding != CurrentBuilding
        } else if (endBuilding != this.currentBuilding) {
            console.log("2: endBuilding: " + endBuilding + " != this.currentBuilding: ");   
            if (this.currentLevel == 0) {                
                // start building, level 0
                console.log("2: start building, start level.");
                this.dbService.getRoutingPolygonsPoints(this.currentBuilding, 0).subscribe(dataSBSL => {        
                    let routingPolygonsRawSBSL = dataSBSL[0];
                    let routingPointsSBSL = dataSBSL[1];

                    this.createRoutingPolygons(routingPolygonsRawSBSL);
                    
                    let rStartSBSL = this.routingService.getRouteStart(currentPosition, this.routingPolygons, routingPointsSBSL);
                    let rEndSBSL = this.routingService.getRoutePointByType(routingPointsSBSL, "exit", endPositionLatLng);

                    let rPathsLevel = this.routingService.createRouteInLevel(rStartSBSL, rEndSBSL, this.routingPolygons, routingPointsSBSL); 
                    rPathsLevel.splice(0, 1); // removes current position for update, temporary  
    
                    let mLevelPos = new google.maps.LatLng(rEndSBSL.lat, rEndSBSL.lng);
                    let mLevelUrl = "./assets/icon/markerExit.png";
                    
                    this.routingLevel.push(rPathsLevel, [mLevelPos, mLevelUrl]);

                    if (endLevel == 0) {
                        // end building, start level
                        console.log("2: end building, start level.");
                        this.dbService.getRoutingPolygonsPoints(endBuilding, 0).subscribe(dataEBSL => {    
                            let routingPolygonsRawEBSL = dataEBSL[0];
                            let routingPointsEBSL = dataEBSL[1];
            
                            this.createRoutingPolygons(routingPolygonsRawEBSL);
            
                            let positionExit = new google.maps.LatLng(parseFloat(rEndSBSL.lat), parseFloat(rEndSBSL.lng));
                            
                            let rStartEBSL = this.routingService.getRoutePointByExit(routingPointsEBSL, positionExit);                            
                            let rEndEBSL = this.routingService.getRoutePointByName(routingPointsEBSL, endName);

                            let rPaths = this.routingService.createRouteInLevel(rStartEBSL, rEndEBSL, this.routingPolygons, routingPointsEBSL);                     
                                        
                            let mPos = new google.maps.LatLng(rEndEBSL.lat, rEndEBSL.lng);
                            let mUrl = "./assets/icon/marker.png";
                            
                            this.routingLevelsRemain.push([[endBuilding, endLevel], rPaths, [mPos, mUrl]]);
                            this.createRoutingElements(this.routingLevel, this.routingLevelsRemain);
                            console.log("RoutingLevelsRemain.length: " + this.routingLevelsRemain.length);
                            this.fitMapToMarkerBounds(5000);
                        });
                    } else {
                        // end building, start level
                        console.log("2: end building, start level.");
                        this.dbService.getRoutingPolygonsPoints(endBuilding, 0).subscribe(dataEBSL => {    
                            let routingPolygonsRawEBSL = dataEBSL[0];
                            let routingPointsEBSL = dataEBSL[1];
            
                            this.createRoutingPolygons(routingPolygonsRawEBSL);
            
                            let positionExit = new google.maps.LatLng(parseFloat(rEndSBSL.lat), parseFloat(rEndSBSL.lng));
                            let rStartEBSL = this.routingService.getRoutePointByExit(routingPointsEBSL, positionExit);
                            let start = new google.maps.LatLng(parseFloat(rStartEBSL.lat), parseFloat(rStartEBSL.lng));
                            let rEndEBSL = this.routingService.getRoutePointByType(routingPointsEBSL, "staircase", start);

                            let rPaths = this.routingService.createRouteInLevel(rStartEBSL, rEndEBSL, this.routingPolygons, routingPointsEBSL);                     
                                                                    
                            let mPos = new google.maps.LatLng(rEndEBSL.lat, rEndEBSL.lng);
                            let mUrl = "./assets/icon/markerChange.png";
                            
                            this.routingLevelsRemain.push([[endBuilding, 0], rPaths, [mPos, mUrl]]);

                            // end building, end level
                            console.log("2: end building, end level.");
                            this.dbService.getRoutingPolygonsPoints(endBuilding, endLevel).subscribe(dataEBEL => {        
                                let routingPolygonsRawEBEL = dataEBEL[0];
                                let routingPointsEBEL = dataEBEL[1];
            
                                this.createRoutingPolygons(routingPolygonsRawEBEL);
                                
                                let rStartEBEL = this.routingService.getRoutePointByRouteId(routingPointsEBEL, rEndEBSL.routing);
                                let rEndEBEL = this.routingService.getRoutePointByName(routingPointsEBEL, endName);

                                let rPaths = this.routingService.createRouteInLevel(rStartEBEL, rEndEBEL, this.routingPolygons, routingPointsEBEL);                     
                                                
                                let mPos = new google.maps.LatLng(rEndEBEL.lat, rEndEBEL.lng);
                                let mUrl = "./assets/icon/marker.png";

                                this.routingLevelsRemain.push([[endBuilding, endLevel], rPaths, [mPos, mUrl]]);
                                this.createRoutingElements(this.routingLevel, this.routingLevelsRemain);
                                console.log("RoutingLevelsRemain.length: " + this.routingLevelsRemain.length);
                                this.fitMapToMarkerBounds(5000);
                            });   
                        });
                    }
                });                
            } else {
                // start building, start level
                console.log("2: start building, start level.");
                this.dbService.getRoutingPolygonsPoints(this.currentBuilding, this.currentLevel).subscribe(dataSBSL => {    
                    let routingPolygonsRawSBSL = dataSBSL[0];
                    let routingPointsSBSL = dataSBSL[1];
    
                    this.createRoutingPolygons(routingPolygonsRawSBSL);
    
                    let rStartSBSL = this.routingService.getRouteStart(currentPosition, this.routingPolygons, routingPointsSBSL);
                    let rEndSBSL = this.routingService.getRoutePointByType(routingPointsSBSL, "staircase", currentPositionLatLng);

                    let rPathsLevel = this.routingService.createRouteInLevel(rStartSBSL, rEndSBSL, this.routingPolygons, routingPointsSBSL); 
                    rPathsLevel.splice(0, 1); // removes current position for update, temporary
    
                    let mLevelPos = new google.maps.LatLng(rEndSBSL.lat, rEndSBSL.lng);
                    let mLevelUrl = "./assets/icon/markerChange.png";
                    
                    this.routingLevel.push(rPathsLevel, [mLevelPos, mLevelUrl]);

                    // start building, level 0
                    console.log("2: start building, end level.");
                    this.dbService.getRoutingPolygonsPoints(this.currentBuilding, 0).subscribe(dataSBSL => {        
                        let routingPolygonsRawSBEL = dataSBSL[0];
                        let routingPointsSBEL = dataSBSL[1];
    
                        this.createRoutingPolygons(routingPolygonsRawSBEL);
                        
                        let rStartSBEL = this.routingService.getRoutePointByRouteId(routingPointsSBEL, rEndSBSL.routing);
                        let rEndSBEL = this.routingService.getRoutePointByType(routingPointsSBEL, "exit", endPositionLatLng);

                        let rPaths = this.routingService.createRouteInLevel(rStartSBEL, rEndSBEL, this.routingPolygons, routingPointsSBEL);                     
                                
                        let mPos = new google.maps.LatLng(rEndSBEL.lat, rEndSBEL.lng);
                        let mUrl = "./assets/icon/markerExit.png";                          
    
                        this.routingLevelsRemain.push([[this.currentBuilding, 0], rPaths, [mPos, mUrl]]);

                        if (endLevel == 0) {
                            // end building, start level
                            console.log("2: end building, start level.");
                            this.dbService.getRoutingPolygonsPoints(endBuilding, 0).subscribe(dataEBSL => {    
                                let routingPolygonsRawEBSL = dataEBSL[0];
                                let routingPointsEBSL = dataEBSL[1];

                                this.createRoutingPolygons(routingPolygonsRawEBSL);
                                
                                let positionExit = new google.maps.LatLng(parseFloat(rEndSBSL.lat), parseFloat(rEndSBSL.lng));
                                
                                let rStartEBSL = this.routingService.getRoutePointByExit(routingPointsEBSL, positionExit);                            
                                let rEndEBSL = this.routingService.getRoutePointByName(routingPointsEBSL, endName);
    
                                let rPaths = this.routingService.createRouteInLevel(rStartEBSL, rEndEBSL, this.routingPolygons, routingPointsEBSL);                     
                                            
                                let mPos = new google.maps.LatLng(rEndEBSL.lat, rEndEBSL.lng);
                                let mUrl = "./assets/icon/marker.png";
                                
                                this.routingLevelsRemain.push([[endBuilding, endLevel], rPaths, [mPos, mUrl]]);
                                this.createRoutingElements(this.routingLevel, this.routingLevelsRemain);
                                console.log("RoutingLevelsRemain.length: " + this.routingLevelsRemain.length);
                                this.fitMapToMarkerBounds(5000);
                            });
                        } else {
                            // end building, start level
                            console.log("2: end building, start level.");
                            this.dbService.getRoutingPolygonsPoints(endBuilding, 0).subscribe(dataEBSL => {    

                                let routingPolygonsRawEBSL = dataEBSL[0];
                                let routingPointsEBSL = dataEBSL[1];
                
                                this.createRoutingPolygons(routingPolygonsRawEBSL);
                
                                let positionExit = new google.maps.LatLng(parseFloat(rEndSBEL.lat), parseFloat(rEndSBEL.lng));
                                let rStartEBSL = this.routingService.getRoutePointByExit(routingPointsEBSL, positionExit);
                                let start = new google.maps.LatLng(parseFloat(rStartEBSL.lat), parseFloat(rStartEBSL.lng));
                                let rEndEBSL = this.routingService.getRoutePointByType(routingPointsEBSL, "staircase", start);

                                let rPaths = this.routingService.createRouteInLevel(rStartEBSL, rEndEBSL, this.routingPolygons, routingPointsEBSL);                     
                                                
                                let mPos = new google.maps.LatLng(rEndEBSL.lat, rEndEBSL.lng);
                                let mUrl = "./assets/icon/markerChange.png";
                                
                                this.routingLevelsRemain.push([[endBuilding, 0], rPaths, [mPos, mUrl]]);

                                // end building, end level
                                console.log("2: end building, end level.");
                                this.dbService.getRoutingPolygonsPoints(endBuilding, endLevel).subscribe(dataEBEL => {        
                                    let routingPolygonsRawEBEL = dataEBEL[0];
                                    let routingPointsEBEL = dataEBEL[1];
                
                                    this.createRoutingPolygons(routingPolygonsRawEBEL);
                                    
                                    let rStartEBEL = this.routingService.getRoutePointByRouteId(routingPointsEBEL, rEndEBSL.routing);
                                    let rEndEBEL = this.routingService.getRoutePointByName(routingPointsEBEL, endName);

                                    let rPaths = this.routingService.createRouteInLevel(rStartEBEL, rEndEBEL, this.routingPolygons, routingPointsEBEL);                     
                                                        
                                    let mPos = new google.maps.LatLng(rEndEBEL.lat, rEndEBEL.lng);
                                    let mUrl = "./assets/icon/marker.png";
                                   
                                    this.routingLevelsRemain.push([[endBuilding, endLevel], rPaths, [mPos, mUrl]]);
                                    this.createRoutingElements(this.routingLevel, this.routingLevelsRemain);
                                    console.log("RoutingLevelsRemain.length: " + this.routingLevelsRemain.length);
                                    this.fitMapToMarkerBounds(5000);
                                });   
                            });
                        }
                    });
                });
            }   
        }         
    }

  public updateRoute() {
        console.log("Update route.");
        let currentLatLng = new google.maps.LatLng(parseFloat(this.currentPosition.lat), parseFloat(this.currentPosition.lng));
        let firstPathLatLng = new google.maps.LatLng(parseFloat(this.routingLevel[0][0].lat), parseFloat(this.routingLevel[0][0].lng));
        if (this.routingService.computeDistance(currentLatLng, firstPathLatLng) < 5) {
            if (this.routingLevel[0].length < 2) {
                // Level change
                if (this.routingLevelsRemain.length > 0) {
                    console.log("rLevelsRemain > 0: " + this.routingLevelsRemain.length);
                    // Remove old new level paths / polylines and set new ones
                    this.routingPolylineLevel.setMap(null);  
                    
                    this.routingLevel = [];

                    // Remove old level markers and set new ones
                    for (let x in this.markersLevel) this.markersLevel[x].setMap(null); 
                    this.markersLevel = [];                    

                    // Change current level
                    let checkBuilding = this.routingLevelsRemain[0][0][0];
                    if (this.currentBuilding == checkBuilding) this.changeCurrentLevel(this.routingLevelsRemain[0][0][0], this.routingLevelsRemain[0][0][1]);    
                } else {
                    // finish route
                    console.log("Finished navigation.");                
                    this.routeState = 'off';
                    if (this.infoViewState = 'in') this.toggleInfoView();
                    this.cleanRouteElements();
                    // TODO popup ziel erreicht
                    let alert = this.alertCtrl.create({
                          title: 'Ziel erreicht!',
                          buttons: ['OK']
                        });
                    alert.present();
                }                
            } else {
                console.log("Splice routing path level.");
                this.routingLevel[0].splice(0, 1);
                this.routingPolylineLevel.setMap(null);
                this.routingPolylineLevel = this.mapService.createRoutePolyline(this.routingLevel[0]);
                this.routingPolylineLevel.setMap(this.map);    
            }   
        }
        // updates polyline from current position to first path of level route polyline
        if (this.routeState == 'on') {
            if (this.routingPolylineLevelPosition != null) this.routingPolylineLevelPosition.setMap(null);   
            if (this.routingPathsLevelPosition != null) this.routingPathsLevelPosition = [];
            if (this.routingLevel[0] != null) {
                this.routingPathsLevelPosition.push(this.currentPosition);
                this.routingPathsLevelPosition.push(this.routingLevel[0][0]);
                this.routingPolylineLevelPosition = this.mapService.createRoutePolyline(this.routingPathsLevelPosition);
                this.routingPolylineLevelPosition.setMap(this.map);
            }
        }
    }

  //Clean all route markers/polylines
private cleanRouteElements() {
        if (this.marker != null) this.marker.setMap(null);
        if (this.routingPolygons != null) this.routingPolygons = this.cleanPolygons(this.routingPolygons);
        if (this.routingPolylineLevel != null) this.routingPolylineLevel.setMap(null);
        if (this.routingPolylineLevelPosition != null) this.routingPolylineLevelPosition.setMap(null);
        if (this.markersLevel != null) for (let x in this.markersLevel) this.markersLevel[x].setMap(null);
        for (let x in this.markersRemain) this.markersRemain[x].setMap(null);
        this.markersRemain = [];
        // OLD for double marker
        /* if (this.markersRemain != null) {
            for (let i = 0; i < this.markersRemain.length; i++) for (let j = 0; j < this.markersRemain[i].length; j++) this.markersRemain[i][j].setMap(null);
        } */
        if (this.routingPolylinesRemain != null) for (let i = 0; i < this.routingPolylinesRemain.length; i++) this.routingPolylinesRemain[i].setMap(null);
        this.routingPathsLevelPosition = [];
        this.routingLevel = [];
        this.routingLevelsRemain = [];
    }

//Creates routing polygons for specific level calc
private createRoutingPolygons(routingPolygonsRaw: any) {
        if (this.routingPolygons != null) this.routingPolygons = this.cleanPolygons(this.routingPolygons);  
        this.routingPolygons = this.routingService.getRoutePolygonsLatLngCoordinates(routingPolygonsRaw);                
        for (let x in this.routingPolygons) this.routingPolygons[x].polygon.setMap(this.map);  
    }

private createRoutingElements(routingLevel: any, routingLevelsRemain: any) {        
        this.routingPolylineLevel = this.mapService.createRoutePolyline(routingLevel[0]);
        this.routingPolylineLevel.setMap(this.map);    

        let markerLevel = this.mapService.createRouteMarker(routingLevel[1][0], routingLevel[1][1], 48);
        markerLevel.setMap(this.map);
        this.markersLevel.push(markerLevel);

        if (routingLevelsRemain != null) {
            for (let x in routingLevelsRemain) {
                let polyline = this.mapService.createRoutePolylineRemain(routingLevelsRemain[x][1]);                
                polyline.setMap(this.map);
                this.routingPolylinesRemain.push(polyline);
                    
                let markerRemain = this.mapService.createRouteMarkerRemain(routingLevelsRemain[x][2][0], routingLevelsRemain[x][2][1], 48);
                markerRemain.setMap(this.map);                     
                this.markersRemain.push(markerRemain);
            }
        }
    }




private fitMapToMarkerBounds(time: any) {
        if (this.infoViewState = 'in') this.toggleInfoView();
        if (this.centerViewState == 'on') this.toggleCenterStateView();
        let bounds = new google.maps.LatLngBounds();
        //for (let x in this.routingLevel)
        let position = new google.maps.LatLng(this.currentPosition.lat, this.currentPosition.lng);
        bounds.extend(position); // current position
        bounds.extend(this.routingLevel[1][0]); // start point
        if (this.routingLevelsRemain != null)
            for (let x in this.routingLevelsRemain) bounds.extend(this.routingLevelsRemain[x][2][0]);
        this.map.fitBounds(bounds);
        setTimeout(() => {             
            let center = new google.maps.LatLng(this.currentPosition.lat, this.currentPosition.lng);
            this.map.panTo(center);
            this.map.setZoom(20); 
            if (this.centerViewState == 'off') this.toggleCenterStateView();                     
        //}, 5000);  
        }, time);  
        
    }







//
    public toggleListView() {
        this.listViewState = (this.listViewState == 'out') ? 'in' : 'out';
    }

    public toggleInfoView() {
        this.infoViewState = (this.infoViewState == 'out') ? 'in' : 'out';
    }

    public toggleMapView() {
        this.mapViewState = (this.mapViewState == 'on') ? 'off' : 'on';
    } 

    public toggleCenterStateView() {
        this.centerViewState = (this.centerViewState == 'on') ? 'off' : 'on';
        console.log("CenterViewState: " + this.centerViewState);
    } 

    public initializeRoomListView() {  

        console.log("Initialize ListView.");   

        let loader = this.loadCtrl.create({
                content: "Gebäudedaten geladen...",
            });

        loader.present();

        this.dbService.getLotsListView().subscribe((data) => {  
            this.roomsListView = data;    
            this.roomsListViewBackup = this.roomsListView;    
            loader.dismiss();

            
        });        
    }


}
