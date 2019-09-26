import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
/* import { AudioService } from '../../services/audio.service'; */
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-stock-picking-list',
  templateUrl: './stock-picking-list.page.html',
  styleUrls: ['./stock-picking-list.page.scss'],
})
export class StockPickingListPage implements OnInit {

  pickings: {};
  picking_state: string;
  picking_types: {};
  current_selected_type: string;
  search: string;

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    /* private audio: AudioService, */
    private stock: StockService
  ) {
    this.picking_types = [
      {
        'value': 'all',
        'name': 'Todos',
        'icon': 'book',
        'size': 1
      },
      {
        'value': 'draft',
        'name': 'Borrador',
        'icon': 'paper',
        'size': 2
      },
      {
        'value': 'waiting',
        'name': 'Faltan operaciones',
        'icon': 'sync',
        'size': 2
      },
      {
        'value': 'confirmed',
        'name': 'En espera',
        'icon': 'cart',
        'size': 2
      },
      {
        'value': 'assigned',
        'name': 'Preparado',
        'icon': 'checkmark',
        'size': 2
      },
      {
        'value': 'done',
        'name': 'Hecho',
        'icon': 'done-all',
        'size': 2
      },
      {
        'value': 'cancel',
        'name': 'Cancelado',
        'icon': 'close',
        'size': 1
      }
    ]
  }

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
    /* this.audio.play('error'); */
    const alert = await this.alertCtrl.create({
        header: titulo,
        subHeader: texto,
        buttons: ['Ok']
    });
    await alert.present();
  }
  
  get_picking_list(picking_state='assigned', search=null){
    this.current_selected_type = picking_state;
    this.stock.get_picking_list(picking_state, search).then((picking_list)=> {
      this.pickings = picking_list;
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  get_search_results(ev:any){
    this.search = ev.target.value;
    this.get_picking_list(this.current_selected_type, this.search);
  }

}
