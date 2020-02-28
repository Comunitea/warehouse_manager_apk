import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, IonInfiniteScroll } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
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
  current_type_id: string;
  view_domain: {};
  view_selector: string;
  search: string;
  current_code: string;
  scanner_reading: string;

  constructor(
    private odoo: OdooService,
    public router: Router,
    private route: ActivatedRoute,
    public alertCtrl: AlertController,
    private audio: AudioService,
    private stock: StockService
  ) {
    let options = {day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h24'}
    this.view_domain = {
        'ready' : [['state', '=', 'assigned']],
        'waiting': [['state', 'in', ['waiting', 'confirmed']]],
        'late': [['state', 'in', ['assigned', 'waiting', 'confirmed']], ['scheduled_date', '<', new Date().toLocaleString('es-ES', options)]],
        'backorders': [['state', 'in', ['waiting', 'confirmed', 'assigned']], ['backorder_id', '!=', false]]
    }
    this.offset = 0;
    this.limit = 25;
    this.limit_reached = false;
  }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      } else {
        this.current_type_id = this.route.snapshot.paramMap.get('id');
        this.view_selector = this.route.snapshot.paramMap.get('view');
        this.current_code = this.route.snapshot.paramMap.get('code');
        this.get_picking_list();
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }

  onReadingEmitted(val: string) {
    this.scanner_reading = val;
    this.search = val;
    this.get_picking_list(this.search);
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
  
  get_picking_list(search=null){
    this.offset = 0;
    this.limit_reached = false;
    this.stock.get_picking_list(this.view_domain[this.view_selector], this.current_type_id, this.offset, this.limit, search).then((picking_list:Array<{}>)=> {
      this.pickings = picking_list;
      if(Object.keys(picking_list).length < 25){
        this.limit_reached = true;
      }
      if (Object.keys(this.pickings).length == 1){
        this.router.navigateByUrl('/stock-picking/'+this.pickings[0]['id']+'/'+this.current_code);
      }
      this.audio.play('click');
    })
    .catch((error) => {
      console.log(error);
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  get_search_results(ev:any){
    this.search = ev.target.value;
    this.get_picking_list(this.search);
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
    this.stock.get_picking_list(this.view_domain[this.view_selector], this.current_type_id, this.offset, this.limit, this.search).then((data:Array<{}>)=> {
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