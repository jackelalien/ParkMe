import { TabsPage } from './../tabs/tabs';
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { HttpClient } from '@angular/common/http';
import { HomePage } from '../home/home';
import { Geolocation } from '@ionic-native/geolocation';

@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})
export class ListPage {
  selectedItem: any;
  icons: string[];
  searchedItems: Array<any>;
  items: Array<any>;
  currentKML: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public http: HttpClient, public geolocation: Geolocation) {
    // If we navigated to this page, we will have an item available as a nav param

    // Let's populate this page with some filler content for funzies
  }

  ionViewDidEnter()
  {
    this.Update();
  }

 Update()
 {
  this.geolocation.getCurrentPosition().then((position) => {
    
    var connStr = 'http://74.80.63.146/GetAllKML.php?lat=' + position.coords.latitude + '&long=' + position.coords.longitude;

        this.http.get(connStr).subscribe ((data: any) => {

          

          this.searchedItems = data;
          this.items = [];
          for(var i = 0; i < this.searchedItems.length; i++)
          {
            this.items.push({
              title: this.searchedItems[i].Name,
              owner: this.searchedItems[i].Owner_Name,
              IsCity: this.searchedItems[i].IsCity
            });
          }
  

        }, (err: any) =>
      {
        console.dir(err);
        
      });
  }, (err) => { 
    alert(err);
  });
 }


  itemTapped(event, item) {
    // That's right, we're pushing to ourselves!
    this.navCtrl.push(TabsPage, {
      KMLData: item.title,
      Owner: item.owner,
      IsCity: item.IsCity
    });
  }
}
