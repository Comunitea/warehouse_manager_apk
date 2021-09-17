import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { StockService } from '../../services/stock.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-move-line-list',
  templateUrl: './move-line-list.component.html',
  styleUrls: ['./move-line-list.component.scss'],
})
export class MoveLineListComponent implements OnInit {
  @Input() ScannerReading: string
  @Input() move_lines: {}
  @Input() code: string;
  @Input() picking_fields: string;
  @Input() not_allowed_fields: {};
  picking: string;
  moves: {};
  StateIcon: {};
  TrackingIcon: {};

  constructor(
    public router: Router,
    public alertCtrl: AlertController,
    private audio: AudioService,
    /* private audio: AudioService, */
    private route: ActivatedRoute,
    private stock: StockService,
    
  ) { }

  ngOnInit() {
    if (this.move_lines) {
      this.StateIcon = this.stock.getStateIcon('stock.move');
      this.TrackingIcon = this.stock.getTrackingIcon('stock.move');
      this.moves = this.move_lines;
      this.picking = this.route.snapshot.paramMap.get('id');
    } else {
      this.get_move_lines_list();
    }
  }

  open_link(move) {
    this.audio.play('click');
    this.router.navigateByUrl('/move-form/' + move);
  }

  get_move_lines_list() {
    this.stock.get_move_lines_list(Number(this.picking)).then((LinesData => {
      this.moves = LinesData;
    }))
    .catch((error) => {
      this.presentAlert('Error al recuperar los movimientos:', error);
    });
  }

  force_set_qty_done(move_id){
    this.stock.force_set_qty_done(Number(move_id), 'stock.move').then((LinesData) => {
      console.log(LinesData);
      if (LinesData == true) {
        this.get_move_lines_list();
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al forzar la cantidad:', error);
    });
  }
  force_set_assigned_qty_done(move_id){
    this.stock.force_set_assigned_qty_done(Number(move_id), 'stock.move').then((LinesData)=>{
      console.log(LinesData);
      if (LinesData === true) {
        this.get_move_lines_list();
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al forzar la cantidad:', error);
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

}
