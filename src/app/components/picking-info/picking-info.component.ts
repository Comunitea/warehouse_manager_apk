import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-picking-info',
  templateUrl: './picking-info.component.html',
  styleUrls: ['./picking-info.component.scss'],
})
export class PickingInfoComponent implements OnInit {

  picking_data: {};
  picking: string;
  picking_code: string;
  move_lines: {};
  move_line_ids: {};
  active_operation: boolean;

  @Input() scanner_reading: string
  @Input() pick: {}
  ngSwitch: any

  constructor(
    public router: Router,
    public alertCtrl: AlertController,
    private stock: StockService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.active_operation = true;
    this.picking = this.route.snapshot.paramMap.get('id');
    this.get_picking_info(this.picking);
  }

  open_link(location_id){
    this.router.navigateByUrl('/stock-location/'+location_id);
  }

  action_assign(){
    this.stock.action_assign(this.picking).then((lines_data)=>{
      if (lines_data == true) {
        console.log("Reloading");
        this.get_picking_info(this.picking);
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al asignar cantidades:', error);
    });
  }

  button_validate(){
    this.stock.button_validate(Number(this.picking)).then((lines_data)=>{
      if (lines_data && lines_data['err'] == false) {
        console.log("Reloading");
        this.get_picking_info(this.picking);
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al validar el albarán:', error['msg']['error_msg']);
    });
  }

  async force_set_qty_done(move_id, field, model='stock.picking'){
    await this.stock.force_set_qty_done(Number(move_id), field, model).then((lines_data)=>{
      if (lines_data == true) {
        console.log("Reloading");
        this.move_lines = false;
        this.move_line_ids = false;
        this.get_picking_info(this.picking);
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al forzar la cantidad:', error);
    });
  }

  async force_reset_qties(pick_id){
    await this.stock.force_reset_qties(Number(pick_id), 'stock.picking').then((lines_data)=>{
      if (lines_data == true) {
        console.log("Reloading");
        this.move_lines = false;
        this.move_line_ids = false;
        this.get_picking_info(this.picking);
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al forzar la cantidad:', error);
    });
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

  get_picking_info(picking) {
    this.stock.get_picking_info(picking).then((data)=>{
      this.picking_data = data[0];
      this.picking_code = data[0].code;
      this.move_lines = this.picking_data['move_lines'];
      this.move_line_ids = this.picking_data['move_line_ids'];
    })
    .catch((error)=>{
      this.presentAlert('Error al recuperar el picking:', error);
    });
  }

}
