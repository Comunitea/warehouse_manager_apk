import { Component, OnInit, ViewChild } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { AlertController, IonInfiniteScroll } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.page.html',
  styleUrls: ['./product-list.page.scss'],
})
export class ProductListPage implements OnInit {

  @ViewChild(IonInfiniteScroll, {static:false}) infiniteScroll: IonInfiniteScroll;

  offset: number;
  limit: number;
  limit_reached: boolean;
  product_list: {};
  search: string;
  show_scan_form: boolean;
  scanner_reading: string;

  constructor(
    private odoo: OdooService,
    public router: Router,
    private storage: Storage,
    public alertCtrl: AlertController,
    private audio: AudioService,
    private stock: StockService
  ) {
    this.show_scan_form = true;
    this.offset = 0;
    this.limit = 25;
    this.limit_reached = false;
  }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      } else {
        this.get_product_list();
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

  onReadingEmitted(val: string) {
    this.scanner_reading = val;
    this.search = val;
    this.get_product_list(this.search);
  }

  onShowEmitted(val: boolean) {
    this.show_scan_form = val;
  }
  
  get_product_list(search=null){
    this.offset = 0;
    this.limit_reached = false;
    this.stock.get_product_list(this.offset, this.limit, search).then((data:Array<{}>)=> {
      this.product_list = data;
      if(Object.keys(data).length < 25){
        this.limit_reached = true;
      }
      if (Object.keys(this.product_list).length == 1){
        this.router.navigateByUrl('/product/'+this.product_list[0]['id']);
      }
      this.audio.play('click');
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  get_search_results(ev:any){
    this.search = ev.target.value;
    this.get_product_list(this.search);
  }

  // Infinitescroll

  loadData(event) {
    setTimeout(() => {
      console.log('Loading more products');
      event.target.complete();
      this.product_list_infinite_scroll_add();

      // App logic to determine if all data is loaded
      // and disable the infinite scroll
      if (this.limit_reached) {
        event.target.disabled = true;
      }
    }, 500);
  }

  product_list_infinite_scroll_add(){
    this.offset += this.limit;
    this.stock.get_product_list(this.offset, this.limit, this.search).then((data:Array<{}>)=> {
      let current_length = Object.keys(this.product_list).length;
      if(Object.keys(data).length < 25){
        this.limit_reached = true;
      }
      for(var k in data) this.product_list[current_length+Number(k)]=data[k];
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de operaciones:', error);
    });
  }

  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }

}
