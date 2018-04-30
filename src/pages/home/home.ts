import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
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


  constructor(public navCtrl: NavController, public navParams: NavParams, public geolocation: Geolocation, public http: HttpClient) {

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
    
    var me = this;
   
    
    this.geolocation.getCurrentPosition().then((position) => {
      let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      let mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
      
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
      

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
  
          //this.map.event.addListener(this.currentKML, 'click', function() {
          //    this.value = "LISTENING";
          //});
         
         // this.value = this.currentKML;
  
  
          this.currentKML.addListener('click', function(kmlEvent) { 
  
          
            me.start = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            me.end = kmlEvent.latLng;
            me.hideMe = true;
              //alert(me.start + " " + me.end);
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
            this.value = "CLICK";
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


}
