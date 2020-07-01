import { Component, OnInit, Input, } from '@angular/core';
import { NavController, ModalController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { Timestamp } from 'rxjs';

@Component({
  selector: 'app-barcode-multiline',
  templateUrl: './barcode-multiline.page.html',
  styleUrls: ['./barcode-multiline.page.scss'],
})

export class BarcodeMultilinePage implements OnInit {
  @Input() InventoryId;
  @Input() LocationId;
  @Input() ProductId;
  @Input() LName;
  @Input() IName;
  @Input() PName;

  ean: string;
  rows: number;

  constructor(public odoo: OdooService, private modalController: ModalController) {

   }

   ionViewWillEnter() {

  }

  ngOnInit() {
  }
  goBack() {
    this.myDismiss();
  }
  async myDismiss() {
    await this.modalController.dismiss(this.ean);
  }
  CalcRows(){
    const ElId = document.getElementById('eans');

  }
}
