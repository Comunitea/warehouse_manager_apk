import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, IonInfiniteScroll } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';
import {} from '../stock-picking-type-list/stock-picking-type-list.page'

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
  pickings: Array<{}>;
  picking_state: string;
  picking_types: {};
  current_type_id: string;
  view_domain: {};
  filter: string;
  search: string;
  current_code: string;
  scanner_reading: string;
  not_allowed_fields: {};
  StateIcon: {};
  States: Array<{}>;
  State: {};
  StateValue: string;
  MaxNumber: number;

  constructor(
    private odoo: OdooService,
    public router: Router,
    private route: ActivatedRoute,
    public alertCtrl: AlertController,
    private audio: AudioService,
    private stock: StockService
  ) {
    // this.offset = 0;
    // this.limit = 5;
    // this.limit_reached = false;
  }

  ionViewDidEnter(){
    this.offset = 0;
    this.limit = this.MaxNumber = 25;
    this.limit_reached = false;
    this.GetPickingList(null, this.offset, this.limit);
  }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data) => {
      if (data === false) {
        this.router.navigateByUrl('/login');
      } else {
        // Lo voy a cambiar por
        this.StateValue = '';
        this.StateIcon = this.stock.getStateIcon('stock.move');
        this.States = this.stock.GetModelInfo('stock.picking', 'filter_state');
        const All = {name: 'Todos', value: 'all'};
        this.States.push(All);
      }
    })
    .catch((error) => {
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }

  onReadingEmitted(val: string) {
    this.scanner_reading = val;
    this.search = val;
    this.offset = 0;
    this.GetPickingList(this.search, this.offset, this.limit);
  }

  Navigate(Url){
    return this.router.navigateByUrl('/' + Url );
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
  OpenLink(PickId){
    this.router.navigateByUrl('/stock-picking/' + PickId + '/1');
  }

  ChangeStateFilter(){
    if (this.StateValue === '') {
      this.State = null; }
    else{
      this.State = this.States.filter(x => x['value'] === this.StateValue)[0]; }
    this.offset = 0;
    this.GetPickingList(this.search, this.offset, this.limit);

  }

  GetPickingList(search= null, offset, limit){
    this.limit_reached = false;
    this.stock.GetPickingList(search, offset, limit, this.State).then((data: Array<{}>) => {
      this.pickings = data;
      if (data.length < this.MaxNumber){
        this.limit_reached = true;
      }

      // if (Object.keys(this.pickings).length === 1){
      //  this.stock.SetModelInfo('stock.picking', 'ActiveId', data[0]['id']);
      //  this.router.navigateByUrl('/stock-picking/' + data[0]['id']);
      // }
    });
  }
  /*
  get_picking_list(search = null){
    this.offset = 0;
    this.limit_reached = false;
    this.stock.GetPicking(this.compute_domain(search), null, 'tree', this.offset, this.limit, search).then((picking_list: Array<{}>) => {
      this.pickings = picking_list;
      // if (this.pickings[0] && this.pickings[0]['picking_fields']) {
      //  this.not_allowed_fields = this.pickings[0]['picking_fields'].split(',');
      //  console.log(this.not_allowed_fields);
      // }
      if (Object.keys(picking_list).length < 25){
        this.limit_reached = true;
      }
      if (Object.keys(this.pickings).length == 1){
        this.router.navigateByUrl('/stock-picking/'+this.pickings[0]['id']);
      }

      this.audio.play('click');
    })
    .catch((error) => {
      console.log(error);
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  } */

  get_search_results(ev: any){
    this.search = ev.target.value;
    this.offset = 0;
    this.GetPickingList(this.search, this.offset, this.limit);
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

  picking_list_infinite_scroll_add() {
    this.offset += this.limit;
    this.stock.GetPickingList(this.search, this.offset, this.limit, this.State).then((data: Array <{}>) => {
      if (data.length < this.MaxNumber){
        this.limit_reached = true;
      }
      for (const pick of data) {this.pickings.push(pick); }

    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }
}