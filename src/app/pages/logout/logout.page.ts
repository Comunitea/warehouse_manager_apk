import { Component, OnInit } from '@angular/core';
import { OdooService } from '../../services/odoo.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.page.html',
  styleUrls: ['./logout.page.scss'],
})
export class LogoutPage implements OnInit {

  constructor(private odoo: OdooService, public alertCtrl: AlertController,) { }

  ngOnInit() {
    this.odoo.logout().then((data)=> {
      
    }).catch((error)=>{
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
