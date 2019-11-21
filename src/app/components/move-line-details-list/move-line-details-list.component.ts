import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { StockService } from '../../services/stock.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-move-line-details-list',
  templateUrl: './move-line-details-list.component.html',
  styleUrls: ['./move-line-details-list.component.scss'],
})
export class MoveLineDetailsListComponent implements OnInit {

  @Input() scanner_reading: string
  @Input() move_line_ids: {}
  @Input() code: string;
  move_line_ids_info: {};
  picking: string;

  constructor(
    public router: Router,
    private stock: StockService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    if (this.move_line_ids) {
      this.picking = this.route.snapshot.paramMap.get('id');
      this.get_move_lines_details_list();
    }
  }

  ngOnChanges(changeRecord) {
    if (changeRecord['scanner_reading'] && changeRecord['scanner_reading']['currentValue']) {
      let default_code = changeRecord['scanner_reading']['currentValue'];
      console.log("Confirmamos cantidad reservada para el producto con default code:" + default_code);
      this.force_set_qty_done_by_product_code_apk(default_code, 'product_uom_qty');      
    }
  }

  get_move_lines_details_list () {
    
    this.stock.get_move_lines_details_list(this.move_line_ids).then((lines_data)=>{
      this.move_line_ids_info = lines_data;
    })
    .catch((error)=>{
      this.presentAlert('Error al recuperar los movimientos:', error);
    });
    
  }

  force_set_qty_done(move_id, field){
    this.stock.force_set_qty_done(Number(move_id), field, 'stock.move.line').then((lines_data)=>{
      if (lines_data == true) {
        this.get_move_lines_details_list();
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al forzar la cantidad:', error);
    });
  }

  force_set_qty_done_by_product_code_apk(product_code, field){
    this.stock.force_set_qty_done_by_product_code_apk(product_code, field, 'stock.move.line', this.picking).then((lines_data)=>{
      if (lines_data == true) {
        this.get_move_lines_details_list();
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al forzar la cantidad:', error);
    });
  }

  open_link(pick_id){
    this.router.navigateByUrl('/product/'+pick_id);
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

}
