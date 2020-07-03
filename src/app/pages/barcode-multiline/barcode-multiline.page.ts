import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { NavController, ModalController, IonTextarea} from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { Keyboard } from '@ionic-native/keyboard/ngx';
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

  @ViewChild('EanList') EanList: IonTextarea;

  ean: string;
  rows: number;

  constructor(public odoo: OdooService, private modalController: ModalController,private keyboard: Keyboard) {

   }

  ionViewWillEnter() {
  setTimeout(() => {
    this.EanList.setFocus();
    setTimeout(() => {
      this.keyboard.hide();
    }, 50);
  }, 150);
  }
  AfterViewInit() {
    setTimeout(() => {
       this.EanList.setFocus();
       this.keyboard.hide();
    }, 150);
  }
  ngOnInit() {
    this.EanList.setFocus();
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
