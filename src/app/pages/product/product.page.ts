import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
})
export class ProductPage implements OnInit {

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
  ) { }

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
    })
    .catch((error)=>{
      this.presentAlert('Error al recuperar el picking:', error);
    });
  }

}
