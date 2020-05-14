import { Component, OnInit, Input} from '@angular/core';
import { OdooService } from '../../services/odoo.service';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-info-sale-order',
  templateUrl: './info-sale-order.page.html',
  styleUrls: ['./info-sale-order.page.scss'],
})
export class InfoSaleOrderPage implements OnInit {

  constructor(public odoo: OdooService, private navCtrl: NavController, private route: ActivatedRoute) {
  }
  SaleOrder: any;

  ngOnInit() {

  }
  goBack() {
    this.navCtrl.back();
    }
  ionViewWillEnter() {
    const Id = +this.route.snapshot.paramMap.get('id');
    const self = this;
    // this.Data = this.navParams.get('data');
    this.odoo.execute('sale.order', 'get_modal_info', {id: Id}).then((data) => {
      self.SaleOrder = data;
    }).catch((error) => {
    });
  }
}
