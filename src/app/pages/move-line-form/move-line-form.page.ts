import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';


@Component({
  selector: 'app-move-line-form',
  templateUrl: './move-line-form.page.html',
  styleUrls: ['./move-line-form.page.scss'],
})
export class MoveLineFormPage implements OnInit {

  data: {};
  placeholder: string;
  move: BigInteger;
  qty_done: BigInteger;

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
    this.odoo.isLoggedIn().then((data) => {
      if (data === false) {
        this.router.navigateByUrl('/login');
      } else {
        this.storage.get('CONEXION').then((con) => {
          this.placeholder = con.url + '/web/static/src/img/placeholder.png'
        })
        .catch((error) => {
          this.presentAlert('Error al comprobar tu sesión:', error);
        });
        const move = +this.route.snapshot.paramMap.get('id');
        this.get_move_line_info(move);
      }
    })
    .catch((error) => {
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

  changeqty(qty){
    if (qty == 0) {
      this.data['qty_done'] = this.data['product_uom_qty'];
    }
    else{
      this.data['qty_done'] += qty;
    }
      
  }
  get_move_line_info(move, index=0) {
    console.log(move);
    this.stock.get_move_line_info(move, index).then((data) => {
      if (data['image_medium'] == false) {
        data['base64'] = false;
        data['image_medium'] = this.placeholder;
      } else {
        data['base64'] = true;
      }
      this.data = data;
      this.audio.play('click');
    })
    .catch((error) => {
      this.presentAlert('Error al recuperar el movimiento:', error);
    });
  }
}
