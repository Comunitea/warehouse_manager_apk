import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonInfiniteScroll } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
/* import { AudioService } from '../../services/audio.service'; */
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-stock-picking-list',
  templateUrl: './stock-picking-list.page.html',
  styleUrls: ['./stock-picking-list.page.scss'],
})
export class StockPickingListPage implements OnInit {

  @ViewChild(IonInfiniteScroll, {static:false}) infiniteScroll: IonInfiniteScroll;

  offset: number;
  limit: number;
  limit_reached: boolean;
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

    this.offset = 0;
    this.limit = 25;
    this.limit_reached = false;
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
    this.offset = 0;
    this.limit_reached = false;
    this.current_selected_type = picking_state;
    this.stock.get_picking_list(picking_state, this.offset, this.limit, search).then((picking_list:Array<{}>)=> {
      this.pickings = picking_list;
      if(Object.keys(picking_list).length < 25){
        this.limit_reached = true;
      }
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  get_search_results(ev:any){
    this.search = ev.target.value;
    this.get_picking_list(this.current_selected_type, this.search);
  }

  // Infinitescroll

  loadData(event) {
    setTimeout(() => {
      console.log('Loading more locations');
      event.target.complete();
      this.picking_list_infinite_scroll_add();

      // App logic to determine if all data is loaded
      // and disable the infinite scroll
      if (this.limit_reached) {
        event.target.disabled = true;
      }
    }, 500);
  }

  picking_list_infinite_scroll_add(){
    this.offset += this.limit;
    this.stock.get_picking_list(this.current_selected_type, this.offset, this.limit, this.search).then((data:Array<{}>)=> {
      let current_length = Object.keys(this.pickings).length;
      if(Object.keys(data).length < 25){
        this.limit_reached = true;
      }
      for(var k in data) this.pickings[current_length+Number(k)]=data[k];
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }

}
