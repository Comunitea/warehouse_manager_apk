import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-stock-location',
  templateUrl: './stock-location.page.html',
  styleUrls: ['./stock-location.page.scss'],
})
export class StockLocationPage implements OnInit {

  location: number;
  location_data: {};

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private audio: AudioService,
    private stock: StockService
  ) { }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      } else {
        var location = this.route.snapshot.paramMap.get('id');
        this.get_location_info(location);
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
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

  get_location_info(location) {
    this.stock.get_location_info(location).then((data)=>{
      this.location_data = data[0];
      this.audio.play('click');   
    })
    .catch((error)=>{
      this.presentAlert('Error al recuperar el location:', error);
    });
  }

}
