import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
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

  @ViewChild(IonInfiniteScroll, {static: false}) infiniteScroll: IonInfiniteScroll;

  offset: number;
  limit: number;
  LimitReached: boolean;
  pickings: Array<{}>;
  picking_state: string;
  picking_types: {};
  current_type_id: string;
  view_domain: {};
  filter: string;
  search: string;
  current_code: string;
  ScannerReading: string;
  not_allowed_fields: string;
  StateIcon: {};
  States: Array<{}>;
  State: {};
  MaxNumber: number;

  Filter1: Array<string>;
  ValueFilter1: string;

  Filter2: Array<string>;
  ValueFilter2: string;

  Filter3: Array<string>;
  ValueFilter3: string;

  PickingTypeCode: string;
  //FilterDeliveryCarrier: Array<string>;
  //ValueFilterDeliveryCarrier: string;
  //FilterCrmTeam: Array<string>;
  //ValueFilterCrmTeam: string;
  //FilterPickState: Array<string>;
  //ValueFilterPickState: string;
  TotalPicks: number;

  constructor(
    public odoo: OdooService,
    public router: Router,
    private route: ActivatedRoute,
    public alertCtrl: AlertController,
    private audio: AudioService,
    public stock: StockService,
  ) {
    // this.offset = 0;
    // this.limit = 5;
    // this.LimitReached = false;
  }

  ionViewDidEnter(){
    this.offset = 0;
    this.limit = this.MaxNumber = this.stock.TreeLimit * 2;
    this.LimitReached = false;
    this.PickingTypeCode = this.stock.GetModelInfo('stock.picking.type', 'Code');
    this.GetPickingList(null, this.offset, this.limit);
  }

  ngOnInit() {
    this.Filter3 = this.stock.GetModelInfo('stock.picking.batch', 'filter_3');
    this.Filter1 = this.stock.GetModelInfo('stock.picking.batch', 'filter_1');
    this.Filter2 = this.stock.GetModelInfo('stock.picking.batch', 'filter_2');
    this.odoo.isLoggedIn().then((data) => {
      if (data === false) {
        this.router.navigateByUrl('/login');
      } else {
        // Lo voy a cambiar por
        this.StateIcon = this.stock.getStateIcon('stock.move');
        this.States = this.stock.GetModelInfo('stock.picking.batch', 'filter_state');
        const All = {name: 'Todos', value: 'all'};
        this.States.push(All);
      }
    })
    .catch((error) => {
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }

  onReadingEmitted(val: string) {
    this.ScannerReading = val;
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
  ChangeFilter(model = 'stock.picking'){
    this.offset = 0;
    this.GetPickingList(this.search, this.offset, this.limit);
  }
  OpenModal(Model, id) {
    this.router.navigateByUrl('/info-sale-order/' + Model + '/' + id);
    // return this.presentModal({Model: ModelO, id: IdO});
  }

  GetPickingList(search = null, offset, limit){
    this.LimitReached = false;
    const FilterValues = {filter_3: this.ValueFilter3, filter_2: this.ValueFilter2, filter_1: this.ValueFilter1}

    console.log(FilterValues);
    this.stock.GetPickingList(search, offset, limit, FilterValues).then((data: Array<{}>) => {
      this.pickings = data;
      this.TotalPicks = data[0] && data[0]['count_batch_ids'] || 0;
      if (data.length < this.MaxNumber){
        this.LimitReached = true;
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
    this.LimitReached = false;
    this.stock.GetPicking(this.compute_domain(search), null, 'tree', this.offset, this.limit, search).then((picking_list: Array<{}>) => {
      this.pickings = picking_list;
      // if (this.pickings[0] && this.pickings[0]['picking_fields']) {
      //  this.not_allowed_fields = this.pickings[0]['picking_fields'].split(',');
      //  console.log(this.not_allowed_fields);
      // }
      if (Object.keys(picking_list).length < this.stock.TreeLimit){
        this.LimitReached = true;
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
      if (this.LimitReached) {
        event.target.disabled = true;
      }
    }, 500);
  }
  NavigatePick(Index){
    if (Index === 0)
      {this.offset -= this.limit;
       if (this.offset < 0) {
         this.offset = 0; }
      }

    else {this.offset += this.limit; }
    
    return this.picking_list_infinite_scroll_add();
  }
  picking_list_infinite_scroll_add() {
    // this.offset += this.limit;
    const FilterValues = {filter_3: this.ValueFilter3, filter_2: this.ValueFilter2, filter_1: this.ValueFilter1}
    this.stock.GetPickingList(this.search, this.offset, this.limit, FilterValues).then((data: Array <{}>) => {
      this.TotalPicks = data[0] && data[0]['count_batch_ids'] || 0;
      this.pickings = data;
      this.LimitReached = data.length < this.limit;
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }
}