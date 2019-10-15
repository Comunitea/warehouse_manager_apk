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

  get_move_lines_details_list () {
    
    this.stock.get_move_lines_details_list(this.move_line_ids).then((lines_data)=>{
      this.move_line_ids_info = lines_data;
    })
    .catch((error)=>{
      this.presentAlert('Error al recuperar los movimientos:', error);
    });
    
  }

  force_set_available_qty_done(move_id){
    this.stock.force_set_available_qty_done(Number(move_id), 'stock.move.line').then((lines_data)=>{
      if (lines_data == true) {
        this.get_move_lines_details_list();
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al forzar la cantidad:', error);
    });
  }

  force_set_assigned_qty_done(move_id, model='stock.move.line'){
    this.stock.force_set_assigned_qty_done(Number(move_id), model).then((lines_data)=>{
      if (lines_data == true) {
        this.get_move_lines_details_list();
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al forzar la cantidad:', error);
    });
  }

  force_set_reserved_qty_done(move_id){
    this.stock.force_set_reserved_qty_done(Number(move_id), 'stock.move.line').then((lines_data)=>{
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
