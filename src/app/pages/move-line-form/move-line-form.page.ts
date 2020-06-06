import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';
import { Location } from '@angular/common';
import { LoadingController } from '@ionic/angular';


@Component({
  selector: 'app-move-line-form',
  templateUrl: './move-line-form.page.html',
  styleUrls: ['./move-line-form.page.scss'],
})
export class MoveLineFormPage implements OnInit {

  moves: any;
  data: {};
  placeholder: string;
  move: BigInteger;
  qty_done: BigInteger;
  loading: any;
  @Input() scanner_reading: string;

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private audio: AudioService,
    public stock: StockService,
    private storage: Storage,
    private location: Location,
    public loadingController: LoadingController,
  ) {
    this.moves = ['up', 'down', 'left', 'right'];
  }

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


  onReadingEmitted(val: string) {
    if (this.moves.includes(val)) {
      this.page_controller(val);
    } else {
      this.scanner_reading = val;
    }
  }

  // Navigation

  go_back() {
    this.audio.play('click');
    this.location.back();
  }

  page_controller(direction) {
    if (direction === 'up') {
      console.log("up");
      this.router.navigateByUrl('/stock-picking/' + this.data['picking_id']['id'] + '/' + this.data['picking_id']['code']);
    } else if (direction === 'down') {
      console.log("down");
      if (this.data['ready_to_validate']){
        this.ButtonValidate(this.data['picking_id']['id']);
      } else {
        // this.action_confirm();
      }
    } else if (direction === 'left') {
      console.log("left");
      this.get_move_line_info(this.data['id'], -1);
    } else if (direction === 'right') {
      console.log("right");
      this.get_move_line_info(this.data['id'], +1);
    }
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

  ChangeQty(qty) {
    if (qty === 0) {
      this.data['qty_done'] = this.data['product_uom_qty'];
      }
    else {
      this.data['qty_done'] += qty;
    }
  }

  get_move_line_info(move, index= 0) {
   /* this.stock.get_move_line_info(move, index).then((data) => {
      console.log(data);
      if (data['image'] === false) {
        data['base64'] = false;
        data['image'] = this.placeholder;
      } else {
        data['base64'] = true;
      }
      this.data = data;
      console.log(this.data);
      this.audio.play('click');
    })
    .catch((error) => {
      this.presentAlert('Error al recuperar el movimiento:', error);
    });
    */

  }
  /*
  action_confirm(){
    this.stock.set_qty_done_from_apk(this.data['id'], this.data['qty_done']).then((lines_data) => {
      console.log(lines_data);
      this.get_move_line_info(this.data['id']);
    })
    .catch((error) => {
      this.presentAlert('Error al validar el albarán:', error);
    });
  }
  */
  ButtonValidate(PickingId) {
    this.presentLoading();
    this.stock.ButtonValidate(Number(PickingId)).then((lines_data) => {
      if (lines_data && lines_data['err'] === false) {
        console.log('Reloading');
        this.loading.dismiss();
        this.location.back();
      } else if (lines_data['err'] !== false) {
        this.loading.dismiss();
        this.presentAlert('Error al validar el albarán:', lines_data['err']);
      }
    })
    .catch((error) => {
      this.loading.dismiss();
      this.presentAlert('Error al validar el albarán:', error);
    });
  }

  async presentLoading() {
    this.loading = await this.loadingController.create({
      message: 'Validando...',
      translucent: true,
      cssClass: 'custom-class custom-loading'
    });
    await this.loading.present();
  }

}
