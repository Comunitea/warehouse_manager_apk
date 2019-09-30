import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
/* import { AudioService } from '../../services/audio.service'; */
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-stock-location-list',
  templateUrl: './stock-location-list.page.html',
  styleUrls: ['./stock-location-list.page.scss'],
})
export class StockLocationListPage implements OnInit {

  locations: {};
  location_state: string;
  location_types: {};
  current_selected_type: string;
  search: string;

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    /* private audio: AudioService, */
    private stock: StockService
  ) {
    this.location_types = [
      {
        'value': 'all',
        'name': 'Todos',
        'icon': 'book',
        'size': 2
      },
      {
        'value': 'supplier',
        'name': 'Proveedor',
        'icon': 'paper',
        'size': 1
      },
      {
        'value': 'view',
        'name': 'Ver',
        'icon': 'sync',
        'size': 1
      },
      {
        'value': 'internal',
        'name': 'Interna',
        'icon': 'cart',
        'size': 1
      },
      {
        'value': 'customer',
        'name': 'Cliente',
        'icon': 'checkmark',
        'size': 1
      },
      {
        'value': 'inventory',
        'name': 'Inventario',
        'icon': 'done-all',
        'size': 1
      },
      {
        'value': 'procurement',
        'name': 'Abastecimiento',
        'icon': 'close',
        'size': 1
      },
      {
        'value': 'production',
        'name': 'Producción',
        'icon': 'close',
        'size': 1
      },
      {
        'value': 'transit',
        'name': 'Tránsito',
        'icon': 'close',
        'size': 2
      }
    ]
  }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      } else {
        this.get_location_list('internal');
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
  
  get_location_list(location_state='internal', search=null){
    this.current_selected_type = location_state;
    this.stock.get_location_list(location_state, search).then((location_list)=> {
      this.locations = location_list;
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  get_search_results(ev:any){
    this.search = ev.target.value;
    this.get_location_list(this.current_selected_type, this.search);
  }

}
