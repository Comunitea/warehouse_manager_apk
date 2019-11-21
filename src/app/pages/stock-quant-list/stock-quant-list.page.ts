import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, IonInfiniteScroll } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
/* import { AudioService } from '../../services/audio.service'; */
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-stock-quant-list',
  templateUrl: './stock-quant-list.page.html',
  styleUrls: ['./stock-quant-list.page.scss'],
})
export class StockQuantListPage implements OnInit {

  @ViewChild(IonInfiniteScroll, {static:false}) infiniteScroll: IonInfiniteScroll;

  offset: number;
  limit: number;
  limit_reached: boolean;
  quants: {};
  search: string;
  location: string;
  show_scan_form: boolean;
  scanner_reading: string;

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    /* private audio: AudioService, */
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
        this.location = this.route.snapshot.paramMap.get('id');
        this.get_location_quants();
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }

  onReadingEmitted(val: string) {
    this.scanner_reading = val;
    this.search = val;
    this.get_location_quants(this.search);
  }

  onShowEmitted(val: boolean) {
    this.show_scan_form = val;
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
  
  get_location_quants(search=null){
    this.offset = 0;
    this.limit_reached = false;
    this.stock.get_location_quants(this.location, this.offset, this.limit, search).then((quants_list:Array<{}>)=> {
      this.quants = quants_list;
      if(Object.keys(quants_list).length < 25){
        this.limit_reached = true;
      }
      if (Object.keys(this.quants).length == 1){
        this.router.navigateByUrl('/product/'+this.quants[0]['product_id'][0]);
      }
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de stock:', error);
    });
  }

  get_search_results(ev:any){
    this.search = ev.target.value;
    this.get_location_quants(this.search);
  }

  // Infinitescroll

  loadData(event) {
    setTimeout(() => {
      console.log('Loading more locations');
      event.target.complete();
      this.quant_list_infinite_scroll_add();

      // App logic to determine if all data is loaded
      // and disable the infinite scroll
      if (this.limit_reached) {
        event.target.disabled = true;
      }
    }, 500);
  }

  quant_list_infinite_scroll_add(){
    this.offset += this.limit;
    this.stock.get_location_quants(this.location, this.offset, this.limit, this.search).then((data:Array<{}>)=> {
      let current_length = Object.keys(this.quants).length;
      if(Object.keys(data).length < 25){
        this.limit_reached = true;
      }
      for(var k in data) this.quants[current_length+Number(k)]=data[k];
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de stock:', error);
    });
  }

  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }

}
