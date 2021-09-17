import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonInfiniteScroll } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';


@Component({
  selector: 'app-stock-picking-type-list',
  templateUrl: './stock-picking-type-list.page.html',
  styleUrls: ['./stock-picking-type-list.page.scss'],
})
export class StockPickingTypeListPage implements OnInit {

  @ViewChild(IonInfiniteScroll, {static: false}) infiniteScroll: IonInfiniteScroll;

  offset: number;
  limit: number;
  LimitReached: boolean;
  picking_types: Array<{}>;
  picking_codes: {};
  TypeMenu: Array<{}>;
  Id: BigInteger;
  search: string;
  Code: {};

  constructor(
    public odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    public audio: AudioService,
    public stock: StockService
  ) {
    this.TypeMenu = [];

    this.offset = 0;
    this.limit = 10;
    this.LimitReached = false;
    this.picking_codes = [
      'incoming',
      'outgoing',
      'internal'
    ];
  }
  ionViewDidEnter(){
    this.FillMenuTypes();
    //this.stock.SetModelInfo('App', 'ActivePage', 'StockLocationPage');
    // this.GetWhCodeFilter('crm.team', 'filter_2');
    // this.GetWhCodeFilter('delivery.carrier', 'filter_delivery_carrier');
    // this.GetWhCodeFilter('stock.picking.batch', 'filter_stock_picking_batch');
    console.log ('Recupero los filtros');
    // this.stock.GetWhCodeFilter('crm.team', 'filter_2', 'wh_code');
    // this.stock.GetWhCodeFilter('delivery.carrier', 'filter_1', 'wh_code');
    // this.stock.GetWhCodeFilter('stock.picking.batch', 'filter_3', 'state');
  }

  ngOnInit() {
    this.stock.GetStates('stock.picking.batch', 'state');
    this.stock.SetFilterMoves('Pendientes');
    const self = this;
    this.odoo.isLoggedIn().then((data) => {
      if (data === false) {
        self.router.navigateByUrl('/login');
      } else {

      }
    })
    .catch((error) => {
      self.presentAlert('Error al comprobar tu sesión:', error);
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

  FillMenuTypes(){
    this.TypeMenu = [];
    const self = this;
    this.stock.GetPickingTypesMenu().then((data: Array<{}>) => {
      for (const menu of data){
        const NewMenu = {code: menu['code'],
                         name: menu['apk_name'],
                         icon: menu['icon'] || 'sync',
                         id: menu['id'],
                         size: 2 };
        self.TypeMenu.push(NewMenu);

        }

      self.Code = self.stock.GetModelInfo('stock.picking.type', 'Code');

      if (!self.Code) {self.GetPickingTypes('all'); }
      else { self.GetPickingTypes(self.Code); }
      }
    )
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });

  }

  GetPickingTypes(Code = null, search= null) {
    this.audio.play('click');
    this.LimitReached = false;
    if (Code) {
      this.search = null;
      this.stock.SetModelInfo('stock.picking.type', 'Code', Code);
    }
    const self = this;
    this.stock.GetPickingTypes(Code, search, this.offset, this.limit).then((TypeIds: Array <{}>) => {
      self.picking_types = TypeIds;
      if (TypeIds.length < 10){
        this.LimitReached = true;
      }

    })
    .catch((error) => {
      self.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  get_search_results(ev: any){
    if (ev.target.value.length > 3){
    this.search = ev.target.value;
    this.GetPickingTypes(null, this.search); }
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

  picking_list_infinite_scroll_add(){
    this.offset += this.limit;
    this.stock.GetPickingTypes(this.Code, this.search, this.offset, this.limit).then((data: Array<{}>) => {
      if (data.length < 10){
        this.LimitReached = true;
      }
      // if (data) {this.picking_types.push(data)};
      for (const type of data) {this.picking_types.push(type); }
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }
  OpenTypeId(Code, PickingTypeId, DomainName) {
    this.audio.play('click');
    this.stock.SetModelInfo('stock.picking.type', 'Code', Code);
    this.stock.SetModelInfo('stock.picking.type', 'PickingTypeId', PickingTypeId);
    this.stock.SetModelInfo('stock.picking.type', 'DomainName', DomainName);
    this.router.navigateByUrl('/stock-picking-list');
  }

}
