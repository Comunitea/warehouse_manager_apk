import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { ScannerOptions } from '../../interfaces/scanner-options';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-stock-picking',
  templateUrl: './stock-picking.page.html',
  styleUrls: ['./stock-picking.page.scss'],
})
export class StockPickingPage implements OnInit {

  scanner_options: ScannerOptions = { reader: true, microphone: false, sound: false };

  show_scan_form: boolean
  scanner_reading: string
  next: number;
  prev: number;
  moves: any;

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private audio: AudioService,
    private storage: Storage
  ) {
    this.check_scanner_values();
    this.moves = ['up', 'down', 'left', 'right'];
  }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      }
      this.show_scan_form = this.scanner_options['reader'];
      this.audio.play('click');
    })
    .catch((error)=>{
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }

  check_scanner_values() {
    this.storage.get('SCANNER').then((val) => {
      if (val){
        this.scanner_options = val;
      } 
    })
    .catch((error)=>{
      this.presentAlert('Error al acceder a las opciones del scanner:', error);
    });
  }

  onReadingEmitted(val: string) {
    if (this.moves.includes(val)) {
      this.page_controller(val);
    } else {
      console.log(this.scanner_reading);
      this.scanner_reading = val;
    }
  }

  onShowEmitted(val: boolean) {
    this.show_scan_form = val;
  }

  async presentAlert(titulo, texto) {
    this.audio.play('error');
    const alert = await this.alertCtrl.create({
        header: titulo,
        subHeader: texto,
        buttons: ['Ok']
    });
    await alert.present();
  }

  // Navigation 

  page_controller(direction) {
    if (direction == 'up') {
      console.log("up");
    } else if (direction == 'down') {
      console.log("down");
    } else if (direction == 'left') {
      console.log("left");
    } else if (direction == 'right') {
      console.log("right");
    }
  }

}
