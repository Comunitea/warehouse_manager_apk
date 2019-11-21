import { Component, NgModule } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { Storage } from '@ionic/storage';

import { OdooService } from './services/odoo.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  public appPages = [
    {
      title: 'Entrar',
      url: '/login',
      icon: 'person'
    },
    {
      title: 'Inventario',
      url: '/stock-picking-type-list',
      icon: 'book'
    },  
    {
      title: 'Productos',
      url: '/product-list',
      icon: 'shirt'
    },    
    {
      title: 'Ubicaciones',
      url: '/stock-location-list',
      icon: 'home'
    },
    {
      title: 'Salir',
      url: '/logout',
      icon: 'log-out'
    }
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private storage: Storage,
    private OdooService: OdooService,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }
}
