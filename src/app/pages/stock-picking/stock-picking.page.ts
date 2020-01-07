import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { VoiceService } from '../../services/voice.service';

@Component({
  selector: 'app-stock-picking',
  templateUrl: './stock-picking.page.html',
  styleUrls: ['./stock-picking.page.scss'],
})
export class StockPickingPage implements OnInit {

  scanner_reading: string;
  next: number;
  prev: number;
  moves: any;

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private audio: AudioService,
    private voice: VoiceService,
  ) {
    this.moves = ['up', 'down', 'left', 'right'];
  }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      }
      this.audio.play('click');
    })
    .catch((error)=>{
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }

  onReadingEmitted(val: string) {
    if (this.moves.includes(val)) {
      this.page_controller(val);
    } else {
      this.scanner_reading = val;
    }
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
