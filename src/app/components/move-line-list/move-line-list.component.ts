import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-move-line-list',
  templateUrl: './move-line-list.component.html',
  styleUrls: ['./move-line-list.component.scss'],
})
export class MoveLineListComponent implements OnInit {

  @Input() scanner_reading: string
  @Input() move_lines: {}
  @Input() code: string;
  @Input() picking_fields: string;
  @Input() not_allowed_fields: {};
  picking: string;
  move_lines_info: {};

  constructor(
    public router: Router,
    public alertCtrl: AlertController,
    /* private audio: AudioService, */
    private route: ActivatedRoute,
    private stock: StockService
  ) { }

  ngOnInit() {
    if(this.move_lines) {
      this.move_lines_info = this.move_lines;
      this.picking = this.route.snapshot.paramMap.get('id');
    } else {
      this.get_move_lines_list();
    }
  }

  open_link(move){
    this.router.navigateByUrl('/move-form/'+move);
  }

  get_move_lines_list () {
    
    this.stock.get_move_lines_list(Number(this.picking)).then((lines_data)=>{
      this.move_lines_info = lines_data;
    })
    .catch((error)=>{
      this.presentAlert('Error al recuperar los movimientos:', error);
    });
    
  }

  force_set_qty_done(move_id){
    this.stock.force_set_qty_done(Number(move_id), 'stock.move').then((lines_data)=>{
      console.log(lines_data);
      if (lines_data == true) {
        this.get_move_lines_list();
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al forzar la cantidad:', error);
    });
  }

  force_set_assigned_qty_done(move_id){
    this.stock.force_set_assigned_qty_done(Number(move_id), 'stock.move').then((lines_data)=>{
      console.log(lines_data);
      if (lines_data == true) {
        this.get_move_lines_list();
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

}
