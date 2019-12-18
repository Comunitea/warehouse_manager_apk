import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonInfiniteScroll } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';
import { ScannerOptions } from '../../interfaces/scanner-options';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-stock-location-list',
  templateUrl: './stock-location-list.page.html',
  styleUrls: ['./stock-location-list.page.scss'],
})
export class StockLocationListPage implements OnInit {

  scanner_options: ScannerOptions = { reader: true, microphone: false, sound: false };

  @ViewChild(IonInfiniteScroll, {static:false}) infiniteScroll: IonInfiniteScroll;

  offset: number;
  limit: number;
  limit_reached: boolean;
  locations: {};
  location_state: string;
  location_types: {};
  current_selected_type: string;
  search: string;
  show_scan_form: boolean;
  scanner_reading: string;

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private audio: AudioService,
    private stock: StockService,
    private storage: Storage
  ) {
    this.location_types = [
      //{
      //  'value': 'all',
      //  'name': 'Todos',
      // 'icon': 'book',
      //  'size': 2
      //}
      //{
      //  'value': 'supplier',
      //  'name': 'Proveedor',
      //  'icon': 'boat',
      //  'size': 1
      //},
      {
        'value': 'view',
        'name': 'Ver',
        'icon': 'desktop',
        'size': 1
      },
      {
        'value': 'internal',
        'name': 'Interna',
        'icon': 'cube',
        'size': 1
      },
      //{
      //  'value': 'customer',
      //  'name': 'Cliente',
      //  'icon': 'cash',
      // / 'size': 1
      //},
      //{
      //  'value': 'inventory',
      //  'name': 'Inventario',
      //  'icon': 'clipboard',
      //  'size': 1
      //},
      //{
      //  'value': 'procurement',
      //  'name': 'Abastecimiento',
      //  'icon': 'log-in',
      //  'size': 1
      //},
      {
        'value': 'production',
        'name': 'Producción',
        'icon': 'hammer',
        'size': 1
      },
      {
        'value': 'transit',
        'name': 'Tránsito',
        'icon': 'swap',
        'size': 2
      }
    ]
    this.check_scanner_values();
    this.offset = 0;
    this.limit = 25;
    this.limit_reached = false;
  }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      } else {
        this.get_location_list('internal');
        this.show_scan_form = this.scanner_options['reader'];
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }

  check_scanner_values() {
    this.storage.get('SCANNER').then((val) => {
      if (val){
        this.scanner_options = val;
      } 
    })
    .catch((error)=>{
      this.presentAlert('Error al acceder a las opciones del scanner:', error);
    });
  }

  onReadingEmitted(val: string) {
    this.scanner_reading = val;
    this.search = val;
    this.get_location_list(this.current_selected_type, this.search);
  }

  onShowEmitted(val: boolean) {
    this.show_scan_form = val;
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
  
  get_location_list(location_state='internal', search=null){
    this.offset = 0;
    this.limit_reached = false;
    this.current_selected_type = location_state;
    this.stock.get_location_list(location_state, this.offset, this.limit, search).then((location_list)=> {
      this.locations = location_list;
      if(Object.keys(location_list).length < 25){
        this.limit_reached = true;
      }
      if (Object.keys(this.locations).length == 1){
        this.router.navigateByUrl('/stock-location/'+this.locations[0]['id']);
      }
      this.audio.play('click');
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  get_search_results(ev:any){
    this.search = ev.target.value;
    this.get_location_list(this.current_selected_type, this.search);
  }

  // Infinitescroll

  loadData(event) {
    setTimeout(() => {
      console.log('Loading more locations');
      event.target.complete();
      this.location_list_infinite_scroll_add();

      // App logic to determine if all data is loaded
      // and disable the infinite scroll
      if (this.limit_reached) {
        event.target.disabled = true;
      }
    }, 500);
  }

  location_list_infinite_scroll_add(){
    this.offset += this.limit;
    this.stock.get_location_list(this.current_selected_type, this.offset, this.limit, this.search).then((data:Array<{}>)=> {
      let current_length = Object.keys(this.locations).length;
      if(Object.keys(data).length < 25){
        this.limit_reached = true;
      }
      for(var k in data) this.locations[current_length+Number(k)]=data[k];
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }

}
