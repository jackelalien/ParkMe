import { HttpClient } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
//import { BrowserAnimationsModule } from '@angular/platfrom-browser/animations';

//Pages
import { MyApp } from './app.component';
import { LoginPage } from '../pages/login/login';
import { HomePage } from '../pages/home/home';
import { ListPage } from '../pages/list/list';
import { ParkingPage } from '../pages/parkingMap/parkingMap';
import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Geolocation } from '@ionic-native/geolocation';
import { HttpClientModule } from '@angular/common/http';
import { DeviceMotion, DeviceMotionAccelerationData } from '@ionic-native/device-motion';
import { DeviceOrientation, DeviceOrientationCompassHeading} from '@ionic-native/device-orientation';
import { File } from '@ionic-native/file';
import { IBeacon } from '@ionic-native/ibeacon';
import { Keyboard } from '@ionic-native/keyboard';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

import { BeaconService } from '../services/beaconservice';
import { DatabaseService } from '../services/databaseservice';
//import { FileService } from '../services/fileservice';
import { KalmanService } from '../services/kalmanservice';
import { MapService } from '../services/mapservice';
import { MotionService } from '../services/motionservice';
import { RoutingService } from '../services/routingservice';

//Services



@NgModule({
  declarations: [
    MyApp,
    HomePage,
    LoginPage,
    ListPage,
    ParkingPage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    //BrowserAnimationsModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    LoginPage,
    ListPage,
    ParkingPage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    DeviceMotion,
    DeviceOrientation,
    Geolocation,
    IBeacon,
    Keyboard,
    SQLite,
    BeaconService,
    DatabaseService,
    //FileService,
    KalmanService,
    MapService,
    MotionService,
    RoutingService,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
