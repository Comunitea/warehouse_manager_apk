import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonInfiniteScroll } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
/* import { AudioService } from '../../services/audio.service'; */
import { StockService } from '../../services/stock.service';


@Component({
  selector: 'app-stock-picking-type-list',
  templateUrl: './stock-picking-type-list.page.html',
  styleUrls: ['./stock-picking-type-list.page.scss'],
})
export class StockPickingTypeListPage implements OnInit {

  @ViewChild(IonInfiniteScroll, {static:false}) infiniteScroll: IonInfiniteScroll;

  offset: number;
  limit: number;
  limit_reached: boolean;
  picking_types: {};
  picking_codes: {};
  picking_menu: {};
  current_selected_type: string;
  search: string;

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    /* private audio: AudioService, */
    private stock: StockService
  ) {
    this.picking_menu = [
      {
        'value': 'all',
        'name': 'Todos',
        'icon': 'book',
        'size': 3
      },
      {
        'value': 'incoming',
        'name': 'Por recibir',
        'icon': 'log-in',
        'size': 3
      },
      {
        'value': 'internal',
        'name': 'Traspasos',
        'icon': 'sync',
        'size': 3
      },
      {
        'value': 'outgoing',
        'name': 'Por hacer',
        'icon': 'log-out',
        'size': 3
      }
    ]

    this.offset = 0;
    this.limit = 25;
    this.limit_reached = false;
    this.picking_codes = [
      'incoming',
      'outgoing',
      'internal'
    ]
  }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      } else {
        this.get_picking_types();
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
  
  get_picking_types(picking_state=null, search=null){
    if (picking_state && picking_state != 'all') {
      this.current_selected_type =picking_state;
      picking_state = [picking_state];
    } else {
      this.current_selected_type = 'all';
      picking_state = this.picking_codes;
    }
    this.offset = 0;
    this.limit_reached = false;
    this.stock.get_picking_types(picking_state, this.offset, this.limit, search).then((picking_type_list:Array<{}>)=> {
      this.picking_types = picking_type_list;
      if(Object.keys(picking_type_list).length < 25){
        this.limit_reached = true;
      }
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  get_search_results(ev:any){
    this.search = ev.target.value;
    this.get_picking_types(this.current_selected_type, this.search);
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
    let picking_state;
    if (this.current_selected_type == 'all') {
      picking_state = this.picking_codes;
    } else {
      picking_state = [this.current_selected_type];
    }
    this.stock.get_picking_types(picking_state, this.offset, this.limit, this.search).then((picking_type_list:Array<{}>)=> {
      let current_length = Object.keys(this.picking_types).length;
      if(Object.keys(picking_type_list).length < 25){
        this.limit_reached = true;
      }
      for(var k in picking_type_list) this.picking_types[current_length+Number(k)]=picking_type_list[k];
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }

}
