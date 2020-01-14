import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { AlertController, IonInfiniteScroll } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
})
export class ProductPage implements OnInit {

  @ViewChild(IonInfiniteScroll, {static:false}) infiniteScroll: IonInfiniteScroll;

  offset: number;
  limit: number;
  limit_reached: boolean;
  quants: {};
  location_ids: boolean;

  product_data: {};
  placeholder: string;

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private audio: AudioService,
    private stock: StockService,
    private storage: Storage,
  ) {
    this.offset = 0;
    this.limit = 25;
    this.limit_reached = false;
  }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      } else {
        this.storage.get('CONEXION').then((con) => {
          this.placeholder = con.url + "/web/static/src/img/placeholder.png"
        })
        .catch((error)=>{
          this.presentAlert('Error al comprobar tu sesión:', error);
        });
        var product = this.route.snapshot.paramMap.get('id');
        this.get_product_info(product);
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

  get_product_info(product) {
    console.log(product);
    this.stock.get_product_info(product).then((data)=>{
      if (data[0]['image_medium']==false){
        data[0]['base64'] = false;
        data[0]['image_medium'] = this.placeholder;
      } else {
        data[0]['base64'] = true;
      }
      this.product_data = data[0];  
      this.audio.play('click');
      this.get_location_quants(this.product_data['default_code']);
    })
    .catch((error)=>{
      this.presentAlert('Error al recuperar el picking:', error);
    });
  }

  get_location_quants(search=null){
    this.offset = 0;
    this.limit_reached = false;
    this.stock.get_location_quants(null, this.offset, this.limit, search, 'form').then((quants_list:Array<{}>)=> {
      this.quants = quants_list;
      console.log(this.quants);
      if(Object.keys(quants_list).length < 25){
        this.limit_reached = true;
      }
      this.audio.play('click');
    })
    .catch((error) => {
      this.presentAlert('Error al recuperador el listado de stock:', error);
    });
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
    this.stock.get_location_quants(null, this.offset, this.limit, this.product_data['default_code'], 'form').then((data:Array<{}>)=> {
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
