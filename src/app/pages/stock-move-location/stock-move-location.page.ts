import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';
import { ScannerOptions } from '../../interfaces/scanner-options';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-stock-move-location',
  templateUrl: './stock-move-location.page.html',
  styleUrls: ['./stock-move-location.page.scss'],
})
export class StockMoveLocationPage implements OnInit {

  scanner_options: ScannerOptions = { reader: true, microphone: false, sound: false };

  location_id: string;
  location_dest_id: string;
  move_lines_info: Array<[]>;
  show_scan_form: boolean;
  scanner_reading: string;
  location_move_id: any;
  awaitting_origin: boolean;
  awaitting_destination: boolean;
  awaitting_qty: boolean;
  notification: string;
  actual_line: string;

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private audio: AudioService,
    private stock: StockService,
    private storage: Storage
  ) {
    this.awaitting_origin = false;
    this.awaitting_destination = false;
    this.check_scanner_values();
    this.notification = undefined;
  }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      }
      this.show_scan_form = this.scanner_options['reader'];
    })
    .catch((error)=>{
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }
  
  check_scanner_values() {
    this.storage.get('SCANNER').then((val) => {
      if (val){
        this.scanner_options = val;
      } 
    })
    .catch((error)=>{
      this.presentAlert('Error al acceder a las opciones del scanner:', error);
    });
  }

  open_link(product_id){
    this.router.navigateByUrl('/product/'+product_id);
  }

  onReadingEmitted(val: string) {
    this.scanner_reading = val;
    this.process_reading();
  }

  onShowEmitted(val: boolean) {
    this.show_scan_form = val;
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

  edit_qty(line_id) {
    this.actual_line = line_id;
    this.awaitting_qty = true;
    this.notification = "Introduzca una cantidad para la línea";
  }

  change_qty(line_id, qty) {
    this.stock.change_qty(line_id, qty).then((data)=> {
      this.update_data(data);
      this.notification = undefined;
    }).catch((error)=>{
      this.presentAlert('No se ha podido modificar la ubicación:', error);
    });
  }

  process_reading() {
    if (this.awaitting_destination == true) {
      this.change_location('destination', this.scanner_reading);
    } else if (this.awaitting_origin == true) {
      this.change_location('origin', this.scanner_reading);
    } else if (this.awaitting_qty) {
      this.change_qty(this.actual_line, this.scanner_reading);
    } else if (!this.location_id) {
      this.create_new_move_location();
    } else {
      this.create_new_move_location_line();
    }
  }

  select_location(type){
    if (type == 'origin' && this.location_move_id) {
      this.awaitting_origin = true;
      this.notification = "Introduzca una nueva ubitación de origen";
    } else if (type == 'destination' && this.location_move_id) {
      this.awaitting_destination = true;
      this.notification = "Introduzca una nueva ubitación de destino";
    }
  }

  change_location(type, location_id) {
    this.stock.change_move_location(this.location_move_id, type, location_id).then((data)=> {
      this.update_data(data);
      this.awaitting_origin = false;
      this.awaitting_destination = false;
      this.notification = undefined;
    })
    .catch((error)=>{
      this.presentAlert('No se ha podido modificar la ubicación:', error);
    });
  }

  update_data(data) {
    if(data['err'] == true) {
      this.presentAlert('No se ha podido modificar la ubicación:', data['error']);
    } else {
      this.location_id = data['origin_location_id'];
      this.location_dest_id = data['destination_location_id'];
      this.location_move_id = data['id'];
      this.move_lines_info = data['stock_move_location_line_ids'];
    }
  }

  create_new_move_location() {
    this.stock.create_new_move_location(this.scanner_reading).then((data)=>{
      this.update_data(data);
      this.audio.play('click');   
    })
    .catch((error)=>{
      this.presentAlert('Error al recuperar la ubicación:', error);
    });
  }

  create_new_move_location_line() {
    this.stock.create_new_move_location_line(this.location_move_id, this.location_id['id'], this.location_dest_id['id'], this.scanner_reading).then((data:any)=>{
      this.move_lines_info.push(data);
      this.audio.play('click');   
    })
    .catch((error)=>{
      this.presentAlert('Error al recuperar el producto:', error);
    });
  }

  force_reset_qties() {
    this.stock.set_multiple_move_location(this.location_move_id, 'reset').then((data)=> {
      this.update_data(data);
    })
    .catch((error)=>{
      this.presentAlert('Error al modificar las cantidades:', error);
    });
  }

  force_set_reserved_qties() {
    this.stock.set_multiple_move_location(this.location_move_id, 'set').then((data)=> {
      this.update_data(data);
    })
    .catch((error)=>{
      this.presentAlert('Error al modificar las cantidades:', error);
    });
  }

  action_move_location() {
    this.stock.action_move_location(this.location_move_id).then((data)=>{
      console.log(data);
      this.router.navigateByUrl('/stock-picking/'+data+'/internal');
    })
    .catch((error)=>{
      this.presentAlert('Error al enviar el movimiento: ', error);
    });
  }

}


/* producto 827702101 */

/* location 03445.19.01.01 */
