import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, IonInfiniteScroll } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';
import { ScannerOptions } from '../../interfaces/scanner-options';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-stock-location-product-list',
  templateUrl: './stock-location-product-list.page.html',
  styleUrls: ['./stock-location-product-list.page.scss'],
})
export class StockLocationProductListPage implements OnInit {

  scanner_options: ScannerOptions = { reader: true, microphone: false, sound: false };

  @ViewChild(IonInfiniteScroll, {static:false}) infiniteScroll: IonInfiniteScroll;

  offset: number;
  limit: number;
  LimitReached: boolean;
  products: {};
  search: string;
  location: string;
  ScannerReading: string;

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private audio: AudioService,
    public stock: StockService,
    private storage: Storage
  ) {
    this.offset = 0;
    this.limit = this.stock.TreeLimit;
    this.LimitReached = false;
  }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      } else {
        this.location = this.route.snapshot.paramMap.get('id');
        this.get_location_products();
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }

  onReadingEmitted(val: string) {
    this.ScannerReading = val;
    this.search = val;
    this.get_location_products(this.search);
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
  
  get_location_products(search=null){
    this.offset = 0;
    this.LimitReached = false;
    this.stock.get_location_products(this.location, this.offset, this.limit, search).then((products_lists:Array<{}>)=> {
      this.products = products_lists;
      if(Object.keys(products_lists).length < this.stock.TreeLimit){
        this.LimitReached = true;
      }
      if (Object.keys(this.products).length == 1){
        this.router.navigateByUrl('/product/'+this.products[0]['id']);
      }
      this.audio.play('click');
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de productos:', error);
    });
  }

  get_search_results(ev:any){
    this.search = ev.target.value;
    this.get_location_products(this.search);
  }

  // Infinitescroll

  loadData(event) {
    setTimeout(() => {
      console.log('Loading more locations');
      event.target.complete();
      this.product_list_infinite_scroll_add();

      // App logic to determine if all data is loaded
      // and disable the infinite scroll
      if (this.LimitReached) {
        event.target.disabled = true;
      }
    }, 500);
  }

  product_list_infinite_scroll_add(){
    this.offset += this.limit;
    this.stock.get_location_products(this.location, this.offset, this.limit, this.search).then((data:Array<{}>)=> {
      let current_length = Object.keys(this.products).length;
      if(Object.keys(data).length < this.stock.TreeLimit){
        this.LimitReached = true;
      }
      for(var k in data) this.products[current_length+Number(k)]=data[k];
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de productos:', error);
    });
  }

  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }

}
