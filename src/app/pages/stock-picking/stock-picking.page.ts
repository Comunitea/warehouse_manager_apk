import { Component, OnInit } from '@angular/core';
import { OdooService } from '../../services/odoo.service';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-stock-picking',
  templateUrl: './stock-picking.page.html',
  styleUrls: ['./stock-picking.page.scss'],
})
export class StockPickingPage implements OnInit {

  constructor(
    private odoo: OdooService,
    public router: Router,
    private storage: Storage,
    public alertCtrl: AlertController,
  ) { }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al hacer login:', error);
    });
  }

  async presentAlert(titulo, texto) {
    const alert = await this.alertCtrl.create({
        header: titulo,
        subHeader: texto,
        buttons: ['Ok']
    });
    await alert.present();
  }

}
