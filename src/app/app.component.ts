import { Component, NgModule } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { Storage } from '@ionic/storage';
import { OdooService } from './services/odoo.service';
import { StockService } from './services/stock.service';
import { AudioService } from './services/audio.service';

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
    },
    {
      title: '01.08.01',
      url: '',
      icon: 'bug-outline'
    }
  ];

  constructor(
    public player: AudioService,
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    public stock: StockService,
    // private storage: Storage,
    // private OdooService: OdooService
  ) {
    player.preload('click', 'assets/audio/click.mp3');
    player.preload('ok', 'assets/audio/ok.mp3');
    player.preload('error', 'assets/audio/error.mp3');
    player.preload('barcode_ok', 'assets/audio/barcode_ok.mp3');
    player.preload('barcode_error', 'assets/audio/barcode_error.mp3');
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
    this.stock.InitVars();
  }
}
