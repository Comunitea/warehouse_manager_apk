import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
/* import { AudioService } from '../../services/audio.service'; */

@Component({
  selector: 'app-stock-picking',
  templateUrl: './stock-picking.page.html',
  styleUrls: ['./stock-picking.page.scss'],
})
export class StockPickingPage implements OnInit {

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController
    /* private audio: AudioService, */
  ) { }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      } 
    })
    .catch((error)=>{
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }

  async presentAlert(titulo, texto) {
    /* this.audio.play('error'); */
    const alert = await this.alertCtrl.create({
        header: titulo,
        subHeader: texto,
        buttons: ['Ok']
    });
    await alert.present();
  }

}
