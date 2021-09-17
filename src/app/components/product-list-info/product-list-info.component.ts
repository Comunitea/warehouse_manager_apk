import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController} from '@ionic/angular';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-product-list-info',
  templateUrl: './product-list-info.component.html',
  styleUrls: ['./product-list-info.component.scss'],
})
export class ProductListInfoComponent implements OnInit {

  @Input() products: {}

  constructor(public router: Router,
              private audio: AudioService,
              public alertCtrl: AlertController,
              private stock: StockService) { }

  ngOnInit() {}

  OpenStock(ProductId){
    this.router.navigateByUrl('/stock-location/' + 13 + '/' + ProductId);
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
