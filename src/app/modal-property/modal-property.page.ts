import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { OdooService } from '../services/odoo.service';

@Component({
  selector: 'app-modal-property',
  templateUrl: './modal-property.page.html',
  styleUrls: ['./modal-property.page.scss'],
})
export class ModalPropertyPage implements OnInit {

  @Input() DataIn: {'Model': string, 'id': BigInteger};
  Lenitems: [0, 1, 2, 3];
  Data: any;
  constructor(
    private modalController: ModalController,
    public odoo: OdooService,

    ) {

  }

  ngOnInit() {
    // this.Data = this.navParams.get('data');
  }

  ionViewWillEnter() {
    const self = this;
    // this.Data = this.navParams.get('data');
    this.odoo.execute(this.DataIn.Model, 'get_modal_info', {id: this.DataIn.id}).then((data) => {
      self.Data = data;
    }).catch((error) => {
    });
  }

  async closeModal() {
    const onClosedData = 'Wrapped Up!';
    await this.modalController.dismiss(onClosedData);
  }

}
