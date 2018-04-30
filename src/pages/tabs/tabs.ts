import { Component } from '@angular/core';

import { ParkingPage } from '../parkingMap/parkingMap';
import { HomePage } from '../home/home';

@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html'
})
export class TabsPage {

  kmlData: any;
  owner: any;
  IsCity: Boolean;

  tab1Root: any = HomePage;
  tab2Root: any = ParkingPage;

  tab1Params = { kmlData: this.kmlData, owner: this.owner, IsCity: this.IsCity };
  

  constructor() {

  }
}