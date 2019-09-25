import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-stock-picking-list',
  templateUrl: './stock-picking-list.page.html',
  styleUrls: ['./stock-picking-list.page.scss'],
})
export class StockPickingListPage implements OnInit {

  pickings: {}
  picking_state: string

  constructor(
    private odoo: OdooService,
    public router: Router,
    private storage: Storage,
    public alertCtrl: AlertController,
    private audio: AudioService,
    private stock: StockService
  ) { }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      } else {
        this.get_picking_list('confirmed');
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
  
  get_picking_list(picking_state='assigned'){
    this.storage.get('CONEXION').then((con)=>{
      this.stock.get_picking_list(picking_state, con.uid).then((picking_list)=> {
        this.pickings = picking_list;
      })
      .catch((error) => {
        this.presentAlert('Error al recuperador el listado de operaciones:', error);
      });
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador los datos de conexión:', error);
    });
  }

}
