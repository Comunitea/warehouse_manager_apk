import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
/* import { AudioService } from '../../services/audio.service'; */
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-stock-picking',
  templateUrl: './stock-picking.page.html',
  styleUrls: ['./stock-picking.page.scss'],
})
export class StockPickingPage implements OnInit {

  picking: number;
  picking_data: {};
  move_lines: {};

  constructor(
    private odoo: OdooService,
    public router: Router,
    private storage: Storage,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    /* private audio: AudioService, */
    private stock: StockService
  ) { }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      } else {
        var picking = this.route.snapshot.paramMap.get('id');
        this.get_picking_info(picking);
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al comprobar tu sesión:', error);
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
      console.log(data[0]);
      this.picking_data = data[0];
      if(this.picking_data['move_lines']) {
        this.stock.get_move_lines_list(this.picking_data['move_lines']).then((lines_data)=>{
          console.log(lines_data);
          this.move_lines = lines_data;
        })
        .catch((error)=>{
          this.presentAlert('Error al recuperar los movimientos:', error);
        });
      }      
    })
    .catch((error)=>{
      this.presentAlert('Error al recuperar el picking:', error);
    });
  }

}
