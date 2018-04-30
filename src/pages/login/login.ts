import { TabsPage } from './../tabs/tabs';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { GooglePlus } from '@ionic-native/google-plus';
import { HomePage } from '../home/home';
import { ParkingPage } from '../parkingMap/parkingMap';


@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
  providers: [GooglePlus]
})
export class LoginPage {

  displayName: any;
  email: any;
  familyName: any;
  givenName: any;
  userId: any;
  imageUrl: any;

  
  
  isLoggedIn:boolean= false;
  
  constructor(public navCtrl: NavController, private googlePlus: GooglePlus) {

  }

  
  login() {
    this.googlePlus.login()
      .then(res => {
        console.log(res);
        this.displayName = res.displayName;
        this.email = res.email;
        this.familyName = res.familyName;
        this.givenName = res.givenName;
        this.userId = res.userId;
        this.imageUrl = res.imageUrl;

        this.isLoggedIn = true;
      })
      .catch(err => console.error(err));
  }
  
  gotoPage()
  {
    this.navCtrl.setRoot(TabsPage);
  }
  
   
}


